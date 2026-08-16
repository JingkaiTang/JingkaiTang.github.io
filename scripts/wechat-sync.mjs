import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import {
  buildPublishRecord,
  buildWechatMarkdown,
  extractMediaId,
  hasHighRisk,
  parseArgs,
  parseWritingMarkdown,
  sameSource,
  scanWechatRisks,
  sha256,
  summarizeOutput,
} from './wechat-sync-lib.mjs';

const REPO = 'JingkaiTang/JingkaiTang.github.io';
const RECORD_NAME = 'wechat-publish.json';

class WorkflowError extends Error {
  constructor(message, exitCode = 2) {
    super(message);
    this.exitCode = exitCode;
  }
}

function fail(message, exitCode = 2) {
  throw new WorkflowError(message, exitCode);
}

function run(command, args, options = {}) {
  const capture = options.capture === true;
  const result = spawnSync(command, args, {
    encoding: 'utf8',
    stdio: capture ? 'pipe' : 'inherit',
    env: options.env ?? process.env,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    const detail = capture ? summarizeOutput(`${result.stdout ?? ''}\n${result.stderr ?? ''}`) : '';
    throw new WorkflowError(
      `${command} ${args.join(' ')} 执行失败${detail ? `：\n${detail}` : ''}`,
      result.status ?? 1,
    );
  }
  return result;
}

function outputOf(command, args) {
  return run(command, args, { capture: true }).stdout.trim();
}

function publisherPath() {
  const codexHome = process.env.CODEX_HOME || path.join(os.homedir(), '.codex');
  return process.env.WECHAT_PUBLISHER_SCRIPT || path.join(
    codexHome,
    'skills',
    'jingkaitang-blog-publisher',
    'scripts',
    'publish-wechat.sh',
  );
}

function ensurePublisherAvailable(file) {
  if (!fs.existsSync(file) || !fs.statSync(file).isFile()) {
    fail(`Codex 微信投递脚本不存在：${file}`);
  }
  try {
    fs.accessSync(file, fs.constants.X_OK);
  } catch {
    fail(`Codex 微信投递脚本不可执行：${file}`);
  }
}

function ensureMainIsCurrent() {
  const status = outputOf('git', ['status', '--porcelain=v1', '--untracked-files=all']);
  if (status) {
    fail('工作区不干净。请先提交或暂存无关改动，再运行 sync:wechat。');
  }

  const branch = outputOf('git', ['branch', '--show-current']);
  if (branch !== 'main') {
    fail(`公众号同步只允许在 main 分支执行，当前分支是 ${branch || '(detached HEAD)'}`);
  }

  run('git', ['fetch', '--quiet', 'origin', 'main']);
  const head = outputOf('git', ['rev-parse', 'HEAD']);
  const localMain = outputOf('git', ['rev-parse', 'main']);
  const remoteMain = outputOf('git', ['rev-parse', 'origin/main']);
  if (head !== localMain || head !== remoteMain) {
    fail(
      `main 与远端不同步：HEAD=${head} main=${localMain} origin/main=${remoteMain}。请先同步后再投递公众号。`,
    );
  }
  return head;
}

function acquireLock(slug) {
  const lockName = `jingkaitang-wechat-sync-${sha256(`${process.cwd()}\0${slug}`).slice(0, 20)}.lock`;
  const lockPath = path.join(os.tmpdir(), lockName);
  const payload = JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString(), slug });

  const isAlive = (pid) => {
    try {
      process.kill(pid, 0);
      return true;
    } catch (error) {
      return error.code === 'EPERM';
    }
  };

  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const fd = fs.openSync(lockPath, 'wx', 0o600);
      fs.writeFileSync(fd, payload);
      fs.closeSync(fd);
      return () => {
        try {
          fs.unlinkSync(lockPath);
        } catch {
          // The lock may already have been cleaned up by the OS or a recovery path.
        }
      };
    } catch (error) {
      if (error.code !== 'EEXIST' || attempt > 0) {
        fail(`已有同一篇文章的公众号同步任务在运行：${lockPath}`);
      }
      try {
        const existing = JSON.parse(fs.readFileSync(lockPath, 'utf8'));
        if (existing.pid && isAlive(existing.pid)) {
          fail(`已有同一篇文章的公众号同步任务在运行（PID ${existing.pid}）。`);
        }
        fs.unlinkSync(lockPath);
      } catch {
        fail(`无法判断已有同步锁是否失效：${lockPath}`);
      }
    }
  }
  fail(`无法创建公众号同步锁：${lockPath}`);
}

function collectSvgRefs(body) {
  return [...new Set(
    [...body.matchAll(/!\[[^\]]*\]\(([^)]+\.svg)\)/gi)].map((match) => match[1]),
  )];
}

function convertSvgRefs(body, postDir) {
  const mmdc = path.join(process.cwd(), 'node_modules', '.bin', 'mmdc');
  const generatedPngs = [];
  let convertedBody = body;

  for (const svgRef of collectSvgRefs(body)) {
    if (/^https?:\/\//i.test(svgRef)) {
      fail(`正文引用了外部 SVG，无法安全转换：${svgRef}`);
    }

    const normalized = svgRef.replace(/^\.\//, '');
    const absSvg = path.join(postDir, normalized);
    const pngRef = svgRef.replace(/\.svg$/i, '.png');
    const absPng = path.join(postDir, pngRef.replace(/^\.\//, ''));

    if (!fs.existsSync(absPng)) {
      const mmd = absSvg.replace(/\.svg$/i, '.mmd');
      if (!fs.existsSync(mmd)) {
        fail(`SVG 缺少 PNG 或 Mermaid 源文件：${svgRef}`);
      }
      if (!fs.existsSync(mmdc)) {
        fail(`缺少锁定版本的 Mermaid CLI：${mmdc}。请先运行 npm ci。`);
      }
      run(mmdc, ['-i', mmd, '-o', absPng, '-b', 'white']);
      generatedPngs.push(absPng);
    }

    convertedBody = convertedBody.replace(
      new RegExp(svgRef.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
      pngRef,
    );
  }

  return { body: convertedBody, generatedPngs };
}

function renderWechat(file, slug, theme, highlight, safeDigest) {
  const result = run('wenyan', ['render', '-f', file, '-t', theme, '-h', highlight], { capture: true });
  const previewDir = path.join(os.tmpdir(), 'jingkaitang-wechat-preview');
  fs.mkdirSync(previewDir, { recursive: true, mode: 0o700 });
  const safeSlug = slug.replace(/[^A-Za-z0-9._-]+/g, '-').replace(/^-+|-+$/g, '') || 'article';
  const previewPath = path.join(previewDir, `${safeSlug}-${safeDigest.slice(0, 12)}.html`);
  fs.writeFileSync(previewPath, result.stdout ?? '', 'utf8');
  return previewPath;
}

function readRecord(recordPath) {
  if (!fs.existsSync(recordPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(recordPath, 'utf8'));
  } catch (error) {
    fail(`公众号发布记录格式损坏：${recordPath}。请人工检查后再继续。`);
  }
}

function writeJson(file, value) {
  fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function commitAndPush(paths, message) {
  run('git', ['add', ...paths]);
  const staged = outputOf('git', ['diff', '--cached', '--name-only']);
  if (!staged) fail(`没有可提交的变更：${message}`);
  run('git', ['commit', '-m', message]);
  const commit = outputOf('git', ['rev-parse', 'HEAD']);
  run('git', ['push', `ssh://git@ssh.github.com:443/${REPO}.git`, 'main']);
  return commit;
}

function printFindings(findings) {
  for (const finding of findings) {
    console.log(`[wechat-risk][${finding.severity}] 第 ${finding.line} 行：${finding.message}`);
  }
}

function updateRecordAfterUnknown(recordPath, record, message) {
  const failed = buildPublishRecord({
    ...record,
    status: 'unknown',
    submissionStatus: 'unknown',
    error: summarizeOutput(message),
    previous: record,
  });
  writeJson(recordPath, failed);
  try {
    const commit = commitAndPush([recordPath], `chore: record uncertain wechat submission for ${record.slug}`);
    console.error(`[wechat-sync] 已记录不确定状态并推送：${commit}`);
  } catch (error) {
    console.error(`[wechat-sync] 微信投递结果不确定，且状态记录未能推送：${error.message}`);
  }
}

function submitWechat({ publisher, safePath }) {
  const result = spawnSync(publisher, [path.resolve(safePath)], {
    encoding: 'utf8',
    env: process.env,
  });
  const output = `${result.stdout ?? ''}\n${result.stderr ?? ''}`.trim();
  return {
    status: result.status ?? 1,
    output,
    mediaId: extractMediaId(output),
    error: result.error,
  };
}

async function main() {
  const args = parseArgs(process.argv);
  const slug = args.slug && args.slug !== 'true' ? args.slug : null;
  if (!slug) fail('缺少 --slug <slug>。');

  const dryRun = args['dry-run'] === 'true';
  const force = args.force === 'true';
  const overwrite = args.overwrite === 'true';
  const allowRisk = args['allow-risk'] === 'true';
  const render = args['no-render'] !== 'true';
  const theme = args.theme && args.theme !== 'true' ? args.theme : 'lapis';
  const highlight = args.highlight && args.highlight !== 'true' ? args.highlight : 'solarized-light';
  const postDir = path.join('src/content/writing', slug);
  const postPath = path.join(postDir, 'index.md');
  const safePath = path.join(postDir, 'index-wechat-safe.md');
  const recordPath = path.join(postDir, RECORD_NAME);
  const publisher = publisherPath();

  if (!fs.existsSync(postPath)) fail(`文章不存在：${postPath}`);
  if (!dryRun) ensurePublisherAvailable(publisher);

  const releaseLock = acquireLock(slug);
  try {
    const sourceCommit = ensureMainIsCurrent();
    const raw = fs.readFileSync(postPath, 'utf8');
    const parsed = parseWritingMarkdown(raw);
    if (parsed.isDraft) fail('文章仍是 draft:true，请先正式发布博客后再同步公众号。');

    const { body, generatedPngs } = convertSvgRefs(parsed.body, postDir);
    const safeMarkdown = buildWechatMarkdown({
      title: parsed.title,
      cover: parsed.cover,
      author: parsed.author,
      sourceUrl: `https://jingkaitang.github.io/writing/${slug}/`,
      body,
    });
    const sourceDigest = sha256(raw);
    const safeDigest = sha256(safeMarkdown);
    const findings = scanWechatRisks(safeMarkdown);
    const highRisk = hasHighRisk(findings);
    if (findings.length) printFindings(findings);
    if (highRisk && !allowRisk && !dryRun) {
      fail('检测到高风险内容，已停止公众号投递。确认后可使用 --allow-risk 继续。');
    }

    if (fs.existsSync(safePath)) {
      const existingSafe = fs.readFileSync(safePath, 'utf8');
      if (existingSafe !== safeMarkdown && !overwrite) {
        fail(`已有人工修改过的 ${safePath}，默认不覆盖。确认后请使用 --overwrite。`);
      }
    }

    const existingRecord = readRecord(recordPath);
    if (existingRecord && sameSource(existingRecord, { sourceDigest, safeDigest }) && !force) {
      if (existingRecord.status === 'submitted' && existingRecord.mediaId) {
        console.log(`[wechat-sync] 已投递过同一版本，Media ID: ${existingRecord.mediaId}`);
        console.log(`[wechat-sync] 如需重新生成草稿，请显式使用 --force。`);
        return 0;
      }
      fail(`该版本已有公众号投递记录（状态：${existingRecord.status}），请先检查记录后使用 --force 重试。`);
    }

    fs.writeFileSync(safePath, safeMarkdown, 'utf8');
    const previewPath = render ? renderWechat(safePath, slug, theme, highlight, safeDigest) : null;
    if (previewPath) console.log(`[wechat-sync] 微信排版预览：${previewPath}`);

    if (highRisk && !allowRisk) {
      fail('dry-run 发现高风险内容，未进入投递阶段。确认后可使用 --allow-risk。');
    }

    if (dryRun) {
      console.log(`[wechat-sync] dry-run 完成，安全版已生成：${safePath}`);
      console.log('[wechat-sync] 未调用微信 API，也未提交或推送 Git。');
      return 0;
    }

    const pending = buildPublishRecord({
      slug,
      sourceCommit,
      sourceDigest,
      safeDigest,
      status: 'pending',
      previous: existingRecord,
    });
    writeJson(recordPath, pending);

    const pathsToAdd = [safePath, recordPath, ...generatedPngs];
    const preparedCommit = commitAndPush(pathsToAdd, `chore: prepare wechat draft for ${slug}`);
    console.log(`[wechat-sync] 已准备并推送安全版：${preparedCommit}`);

    const submission = submitWechat({ publisher, safePath });
    if (submission.status !== 0 || !submission.mediaId) {
      const detail = submission.error?.message || submission.output || `exit ${submission.status}`;
      updateRecordAfterUnknown(recordPath, pending, detail);
      fail(
        submission.status !== 0
          ? `微信投递失败，结果可能不确定：${summarizeOutput(detail)}`
          : '微信命令返回成功但没有找到 Media ID，已按不确定状态处理。',
        1,
      );
    }

    const submitted = buildPublishRecord({
      ...pending,
      status: 'submitted',
      submissionStatus: 'submitted',
      mediaId: submission.mediaId,
      previous: pending,
    });
    writeJson(recordPath, submitted);
    const resultCommit = commitAndPush([recordPath], `chore: record wechat draft for ${slug}`);
    console.log(`[wechat-sync] 微信草稿投递成功，Media ID: ${submission.mediaId}`);
    console.log(`[wechat-sync] 发布记录已推送：${resultCommit}`);
    console.log('[wechat-sync] 请前往微信公众号后台审核并手动发布。');
    return 0;
  } finally {
    releaseLock();
  }
}

main().then((code) => {
  process.exitCode = code;
}).catch((error) => {
  console.error(`[wechat-sync] ${error.message}`);
  process.exitCode = error.exitCode ?? 1;
});
