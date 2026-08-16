import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

function shOut(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) {
    throw new Error(r.stderr || `Command failed: ${cmd} ${args.join(' ')}`);
  }
  return String(r.stdout).trim();
}

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function parseArgs(argv) {
  const out = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    out[key] = val;
  }
  return out;
}

export function evaluateRun(run, headSha) {
  if (!run) return { state: 'missing', reason: '没有找到对应的 workflow run' };
  if (run.head_sha !== headSha) return { state: 'mismatch', reason: `head_sha=${run.head_sha}` };
  if (run.status !== 'completed') return { state: 'pending', reason: `status=${run.status}` };
  if (run.conclusion !== 'success') return { state: 'failed', reason: `conclusion=${run.conclusion}` };
  return { state: 'success', reason: 'workflow 已成功完成' };
}

export function findRunForHead(runs, headSha) {
  return runs.find((run) => run.head_sha === headSha) ?? null;
}

const repo = 'JingkaiTang/JingkaiTang.github.io';

function getRuns(workflow, branch) {
  const raw = shOut('gh', [
    'api',
    `repos/${repo}/actions/workflows/${workflow}/runs?branch=${branch}&per_page=20`,
    '--jq',
    '.workflow_runs | map({id, head_sha, status, conclusion, html_url})',
  ]);
  return JSON.parse(raw);
}

function waitSeconds(seconds) {
  spawnSync('sleep', [String(seconds)]);
}

function checkUrl(url) {
  if (!url) return true;
  const result = spawnSync('curl', [
    '--fail',
    '--silent',
    '--show-error',
    '--location',
    '--max-time',
    '20',
    '--retry',
    '3',
    '--retry-delay',
    '2',
    url,
  ], { stdio: 'ignore' });
  if (result.status === 0) {
    console.log(`[ensure-pages-deploy] smoke check OK: ${url}`);
    return true;
  }
  console.error(`[ensure-pages-deploy] smoke check failed: ${url}`);
  return false;
}

function verifyCompletedRun(branch, headSha, run, url) {
  const state = evaluateRun(run, headSha);
  if (state.state === 'success') {
    console.log(`[ensure-pages-deploy] OK: ${branch}@${headSha} deployed successfully`);
    if (run.html_url) console.log(`[ensure-pages-deploy] run: ${run.html_url}`);
    return checkUrl(url);
  }
  console.error(`[ensure-pages-deploy] ${state.state}: ${state.reason}`);
  if (run.html_url) console.error(`[ensure-pages-deploy] run: ${run.html_url}`);
  return false;
}

function main() {
  const args = parseArgs(process.argv);
  const workflow = args.workflow && args.workflow !== 'true' ? args.workflow : 'pages.yml';
  const branch = args.branch && args.branch !== 'true' ? args.branch : 'main';
  const wait = args.wait === 'true' || args.w === 'true';
  const url = args.url && args.url !== 'true' ? args.url : null;
  const headSha = shOut('gh', ['api', `repos/${repo}/commits/${branch}`, '--jq', '.sha']);

  let run = findRunForHead(getRuns(workflow, branch), headSha);
  if (run) {
    const state = evaluateRun(run, headSha);
    if (state.state === 'success') {
      return verifyCompletedRun(branch, headSha, run, url) ? 0 : 1;
    }
    if (!wait) {
      console.error(`[ensure-pages-deploy] ${state.state}: ${state.reason}`);
      console.error('[ensure-pages-deploy] 请使用 --wait 等待部署完成。');
      return 3;
    }
    if (run.status !== 'completed') {
      sh('gh', ['run', 'watch', String(run.id), '--repo', repo, '--exit-status']);
    }
    run = findRunForHead(getRuns(workflow, branch), headSha);
    return verifyCompletedRun(branch, headSha, run, url) ? 0 : 1;
  }

  console.log(`[ensure-pages-deploy] ${branch}@${headSha} 尚未有对应 workflow run，触发 ${workflow}...`);
  sh('gh', ['workflow', 'run', workflow, '--repo', repo, '--ref', branch]);
  if (!wait) {
    console.log('[ensure-pages-deploy] workflow 已触发；需要 --wait 才能确认最终结果。');
    return 3;
  }

  for (let attempt = 0; attempt < 20; attempt++) {
    run = findRunForHead(getRuns(workflow, branch), headSha);
    if (run) break;
    waitSeconds(1);
  }
  if (!run) {
    console.error('[ensure-pages-deploy] 已触发 workflow，但在等待窗口内没有找到对应 run。');
    return 1;
  }
  if (run.status !== 'completed') {
    sh('gh', ['run', 'watch', String(run.id), '--repo', repo, '--exit-status']);
  }
  run = findRunForHead(getRuns(workflow, branch), headSha);
  return verifyCompletedRun(branch, headSha, run, url) ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  process.exitCode = main();
}
