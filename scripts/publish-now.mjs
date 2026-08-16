import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function shOut(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) throw new Error(r.stderr || `Command failed: ${cmd}`);
  return String(r.stdout).trim();
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

const repo = 'JingkaiTang/JingkaiTang.github.io';
const args = parseArgs(process.argv);

const slug = args.slug && args.slug !== 'true' ? args.slug : null;
const message = args.message && args.message !== 'true' ? args.message : null;

if (!slug) {
  console.error('Missing --slug <now-slug> (folder name under src/content/now/)');
  process.exit(2);
}

const nowPath = `src/content/now/${slug}/index.md`;
if (!fs.existsSync(nowPath)) {
  console.error(`Now entry not found: ${nowPath}`);
  process.exit(2);
}

// Must be clean; we will commit directly to main.
const porcelain = shOut('git', ['status', '--porcelain']);
if (porcelain) {
  console.error('Working tree not clean. Commit/stash your changes first.');
  process.exit(2);
}

sh('git', ['checkout', 'main']);
sh('git', ['pull', '--ff-only', 'origin', 'main']);

sh('npm', ['run', 'build']);

sh('git', ['add', `src/content/now/${slug}/`]);

const msg = message ? message : `Now: ${slug}`;
sh('git', ['commit', '-m', msg]);

// Push main using ssh over 443
sh('git', ['push', `ssh://git@ssh.github.com:443/${repo}.git`, 'main']);

// Ensure Pages deploy catches up (GitHub Actions may occasionally miss/delay pushes)
sh('node', [
  'scripts/ensure-pages-deploy.mjs',
  '--workflow',
  'pages.yml',
  '--branch',
  'main',
  '--wait',
  '--url',
  `https://jingkaitang.github.io/now/${slug}/`,
]);

console.log(`Published Now: /now/${slug}/`);
