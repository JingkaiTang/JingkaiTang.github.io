import { spawnSync } from 'node:child_process';
import fs from 'node:fs';

export function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

export function shOut(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) throw new Error(r.stderr || `Command failed: ${cmd} ${args.join(' ')}`);
  return String(r.stdout).trim();
}

function shOutRaw(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) throw new Error(r.stderr || `Command failed: ${cmd} ${args.join(' ')}`);
  return String(r.stdout);
}

export function parseArgs(argv) {
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

export function ensurePostExists(slug) {
  const postDir = `src/content/writing/${slug}`;
  const postPath = `${postDir}/index.md`;
  if (!fs.existsSync(postPath)) {
    console.error(`Post not found: ${postPath}`);
    process.exit(2);
  }
  return { postDir, postPath };
}

export function readPost(postPath) {
  return fs.readFileSync(postPath, 'utf8');
}

export function writePost(postPath, content) {
  fs.writeFileSync(postPath, content, 'utf8');
}

export function ensureDraftState(postPath, expectedDraft) {
  const md = readPost(postPath);
  const isDraft = /\n\s*draft:\s*true\s*\n/i.test(md);
  if (expectedDraft && !isDraft) {
    console.error('This command is for draft stage only. Set draft:true first.');
    process.exit(2);
  }
  if (!expectedDraft && isDraft) {
    console.error('Post is still draft:true. Change it to draft:false first, then run this command.');
    process.exit(2);
  }
  return md;
}

export function replaceDraftFlag(postPath, nextDraft) {
  const md = readPost(postPath);
  const next = nextDraft ? 'true' : 'false';
  const replaced = md.replace(/\n\s*draft:\s*(true|false)\s*\n/i, `\n\ndraft: ${next}\n`);
  if (replaced === md) {
    console.error(`Failed to update draft flag in ${postPath}`);
    process.exit(2);
  }
  writePost(postPath, replaced);
}

export function ensureOnMainAndUpToDate() {
  sh('git', ['checkout', 'main']);
  sh('git', ['pull', '--ff-only', 'origin', 'main']);
}

export function ensureCleanWorkingTree() {
  const status = shOut('git', ['status', '--porcelain=v1', '--untracked-files=all']);
  if (status) {
    console.error('Working tree not clean. Commit or stash changes before formal publishing.');
    process.exit(2);
  }
}

export function ensureOnlyAllowedChanges(allowedPrefixes) {
  // NUL-delimited status output avoids quote/encoding edge cases in paths.
  const status = shOutRaw('git', ['status', '--porcelain=v1', '-z', '--untracked-files=all']);
  if (!status.trim()) return;
  const paths = status
    .split('\0')
    .map((entry) => entry.slice(3))
    .filter(Boolean);
  const unrelated = paths.filter((file) => !allowedPrefixes.some((prefix) => file === prefix || file.startsWith(`${prefix}/`)));
  if (unrelated.length) {
    console.error('Working tree contains unrelated changes:');
    unrelated.forEach((file) => console.error(`  ${file}`));
    process.exit(2);
  }
}

export function buildSite() {
  sh('npm', ['run', 'build']);
}

export function commitIfNeeded(message, paths) {
  sh('git', ['add', ...paths]);
  const staged = shOut('git', ['diff', '--cached', '--name-only']);
  if (!staged) {
    console.error('No staged changes to commit. Nothing to publish.');
    process.exit(2);
  }
  sh('git', ['commit', '-m', message]);
}

export function pushMain(repo) {
  sh('git', ['push', `ssh://git@ssh.github.com:443/${repo}.git`, 'main']);
}

export function ensurePagesDeploy(pathname) {
  const args = ['scripts/ensure-pages-deploy.mjs', '--workflow', 'pages.yml', '--branch', 'main', '--wait'];
  if (pathname) args.push('--url', `https://jingkaitang.github.io${pathname}`);
  sh('node', args);
}

export function workingTreeStatus() {
  return shOut('git', ['status', '--short']);
}
