import fs from 'node:fs/promises';
import path from 'node:path';
import readline from 'node:readline/promises';
import { stdin as input, stdout as output } from 'node:process';

const ROOT = process.cwd();
const SRC_WRITING_DIR = path.join(ROOT, 'src', 'content', 'writing');
const SRC_NOW_DIR = path.join(ROOT, 'src', 'content', 'now');

const PUBLIC_WRITING_DIR = path.join(ROOT, 'public', 'writing');
const PUBLIC_NOW_DIR = path.join(ROOT, 'public', 'now');

const ASSET_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.svg', '.mp4']);

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

async function exists(p) {
  try {
    await fs.access(p);
    return true;
  } catch {
    return false;
  }
}

async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

function slugFromIndexMd(indexMdPath) {
  // src/content/writing/<slug>/index.md => <slug>
  const rel = path.relative(SRC_WRITING_DIR, indexMdPath);
  const parts = rel.split(path.sep);
  if (parts.length >= 2 && parts[parts.length - 1] === 'index.md') {
    return parts[parts.length - 2];
  }
  // fallback: src/content/writing/<slug>.md
  return path.basename(indexMdPath, path.extname(indexMdPath));
}

async function confirmClean(args) {
  if (args.yes === 'true') return true;
  if (!process.stdin.isTTY) return false;
  const rl = readline.createInterface({ input, output });
  const answer = await rl.question('确认执行清理？这会删除 public 里多余的资源文件。输入 y 继续：');
  await rl.close();
  return /^y(es)?$/i.test(answer.trim());
}

async function syncOnePostDir({ postDir, indexName = 'index.md', publicBaseDir, slugFn, clean }) {
  const indexMd = path.join(postDir, indexName);
  if (!(await exists(indexMd))) return;

  const slug = slugFn(indexMd);
  const outDir = path.join(publicBaseDir, slug);
  await ensureDir(outDir);

  const desired = new Set();
  const entries = await fs.readdir(postDir, { withFileTypes: true });
  for (const e of entries) {
    // copy single-file assets at post root
    if (e.isFile()) {
      if (e.name === 'index.md') continue;

      const ext = path.extname(e.name).toLowerCase();
      if (!ASSET_EXTS.has(ext)) continue;

      const src = path.join(postDir, e.name);
      const dst = path.join(outDir, e.name);
      await fs.copyFile(src, dst);
      desired.add(e.name);
      continue;
    }

    // copy common nested asset folders (e.g. diagrams/*)
    if (e.isDirectory() && ['diagrams'].includes(e.name)) {
      const dirName = e.name;
      const srcDir = path.join(postDir, dirName);
      const dstDir = path.join(outDir, dirName);
      await ensureDir(dstDir);

      const nested = await fs.readdir(srcDir, { withFileTypes: true });
      for (const ne of nested) {
        if (!ne.isFile()) continue;
        const ext = path.extname(ne.name).toLowerCase();
        if (!ASSET_EXTS.has(ext)) continue;
        const src = path.join(srcDir, ne.name);
        const dst = path.join(dstDir, ne.name);
        await fs.copyFile(src, dst);
        desired.add(`${dirName}/${ne.name}`);
      }
    }
  }

  let cleaned = 0;
  if (clean) {
    const outEntries = await fs.readdir(outDir, { withFileTypes: true });
    for (const e of outEntries) {
      if (e.isFile()) {
        const ext = path.extname(e.name).toLowerCase();
        if (!ASSET_EXTS.has(ext)) continue;
        if (desired.has(e.name)) continue;
        await fs.unlink(path.join(outDir, e.name));
        cleaned++;
        continue;
      }

      // clean common nested folders (diagrams/*)
      if (e.isDirectory() && ['diagrams'].includes(e.name)) {
        const dirName = e.name;
        const dirPath = path.join(outDir, dirName);
        const nested = await fs.readdir(dirPath, { withFileTypes: true });
        for (const ne of nested) {
          if (!ne.isFile()) continue;
          const ext = path.extname(ne.name).toLowerCase();
          if (!ASSET_EXTS.has(ext)) continue;
          const key = `${dirName}/${ne.name}`;
          if (desired.has(key)) continue;
          await fs.unlink(path.join(dirPath, ne.name));
          cleaned++;
        }
      }
    }
  }

  return { cleaned };
}

async function main() {
  const args = parseArgs(process.argv);
  const clean = args.clean === 'true';
  if (clean) {
    const ok = await confirmClean(args);
    if (!ok) {
      console.error('[sync:assets] Clean aborted. Pass --yes to skip confirmation.');
      process.exit(2);
    }
  }

  let total = 0;
  let cleanedTotal = 0;

  // writing
  if (await exists(SRC_WRITING_DIR)) {
    const top = await fs.readdir(SRC_WRITING_DIR, { withFileTypes: true });
    const postDirs = top.filter((e) => e.isDirectory()).map((e) => path.join(SRC_WRITING_DIR, e.name));
    for (const d of postDirs) {
      const result = await syncOnePostDir({
        postDir: d,
        publicBaseDir: PUBLIC_WRITING_DIR,
        slugFn: slugFromIndexMd,
        clean,
      });
      cleanedTotal += result?.cleaned ?? 0;
      total++;
    }
  }

  // now
  if (await exists(SRC_NOW_DIR)) {
    const top = await fs.readdir(SRC_NOW_DIR, { withFileTypes: true });
    const postDirs = top.filter((e) => e.isDirectory()).map((e) => path.join(SRC_NOW_DIR, e.name));

    const slugFromNowIndex = (indexMdPath) => {
      // src/content/now/<id>/index.md => <id>
      const rel = path.relative(SRC_NOW_DIR, indexMdPath);
      const parts = rel.split(path.sep);
      if (parts.length >= 2 && parts[parts.length - 1] === 'index.md') return parts[parts.length - 2];
      return path.basename(indexMdPath, path.extname(indexMdPath));
    };

    for (const d of postDirs) {
      const result = await syncOnePostDir({
        postDir: d,
        publicBaseDir: PUBLIC_NOW_DIR,
        slugFn: slugFromNowIndex,
        clean,
      });
      cleanedTotal += result?.cleaned ?? 0;
      total++;
    }
  }

  const cleanNote = clean ? `, cleaned ${cleanedTotal} stale files` : '';
  console.log(`[sync:assets] Synced assets for ${total} post folders -> public/{writing,now}/` + cleanNote);
}

await main();
