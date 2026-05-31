import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

function sh(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { stdio: 'inherit', ...opts });
  if (r.status !== 0) process.exit(r.status ?? 1);
}

function shOut(cmd, args, opts = {}) {
  const r = spawnSync(cmd, args, { encoding: 'utf8', ...opts });
  if (r.status !== 0) throw new Error(r.stderr || `Command failed: ${cmd} ${args.join(' ')}`);
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

function escapeRegExp(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const args = parseArgs(process.argv);
const slug = args.slug && args.slug !== 'true' ? args.slug : null;
const repo = 'JingkaiTang/JingkaiTang.github.io';
const publisher = '/home/t7kai/.openclaw/workspace-JingkaiTang.github.io/skills/wechat-publisher/scripts/publish.sh';

if (!slug) {
  console.error('Missing --slug <slug>.');
  process.exit(2);
}

const postDir = path.join('src/content/writing', slug);
const postPath = path.join(postDir, 'index.md');
const wechatPath = path.join(postDir, 'index-wechat-safe.md');
if (!fs.existsSync(postPath)) {
  console.error(`Post not found: ${postPath}`);
  process.exit(2);
}
if (!fs.existsSync(publisher)) {
  console.error(`Publisher script not found: ${publisher}`);
  process.exit(2);
}

const beforeStatus = shOut('git', ['status', '--short']);
if (beforeStatus) {
  console.error('Working tree not clean. Commit or stash unrelated changes before running sync:wechat.');
  process.exit(2);
}

const raw = fs.readFileSync(postPath, 'utf8');
const fmMatch = raw.match(/^---\n([\s\S]*?)\n---\n\n?/);
if (!fmMatch) {
  console.error('Missing frontmatter in index.md');
  process.exit(2);
}
const fm = fmMatch[1];
const bodyStart = fmMatch[0].length;
let body = raw.slice(bodyStart);

const title = (fm.match(/^title:\s*"?(.+?)"?\s*$/m) || [])[1];
const cover = (fm.match(/^cover:\s*"?(.+?)"?\s*$/m) || [])[1];
const byName = (fm.match(/^\s*name:\s*(.+)\s*$/m) || [])[1];
const isDraft = /(^|\n)\s*draft:\s*true\s*($|\n)/m.test(fm);

if (!title || !cover) {
  console.error('Missing title or cover in frontmatter.');
  process.exit(2);
}
if (isDraft) {
  console.error('Post is still draft:true. Publish blog first, then sync WeChat.');
  process.exit(2);
}

const svgRefs = [...body.matchAll(/!\[[^\]]*\]\(([^)]+\.svg)\)/g)].map((m) => m[1]);
for (const svgRef of svgRefs) {
  const normalized = svgRef.replace(/^\.\//, '');
  const absSvg = path.join(postDir, normalized);
  const pngRef = svgRef.replace(/\.svg$/i, '.png');
  const absPng = path.join(postDir, pngRef.replace(/^\.\//, ''));
  if (!fs.existsSync(absPng)) {
    const mmd = absSvg.replace(/\.svg$/i, '.mmd');
    if (fs.existsSync(mmd)) {
      sh('npx', ['-y', '@mermaid-js/mermaid-cli', '-i', mmd, '-o', absPng, '-b', 'white']);
    }
  }
  if (!fs.existsSync(absPng)) {
    console.error(`Missing PNG fallback for SVG: ${svgRef}`);
    process.exit(2);
  }
  body = body.replace(new RegExp(escapeRegExp(svgRef), 'g'), pngRef);
}

const author = byName ? byName.trim() : '唐靖凯';
const derived = `---\ntitle: ${title}\ncover: ${cover}\nauthor: ${author}\nsource_url: https://jingkaitang.github.io/writing/${slug}/\n---\n\n${body}`;
fs.writeFileSync(wechatPath, derived, 'utf8');

const result = spawnSync(publisher, [path.resolve(wechatPath)], { encoding: 'utf8' });
process.stdout.write(result.stdout || '');
process.stderr.write(result.stderr || '');
if (result.status !== 0) process.exit(result.status ?? 1);

const pathsToAdd = [wechatPath];
const diagramsDir = path.join(postDir, 'diagrams');
if (fs.existsSync(diagramsDir)) {
  pathsToAdd.push(diagramsDir);
}
sh('git', ['add', ...pathsToAdd]);
const staged = shOut('git', ['diff', '--cached', '--name-only']);
if (staged) {
  sh('git', ['commit', '-m', `chore: sync wechat assets for ${slug}`]);
  sh('git', ['push', `ssh://git@ssh.github.com:443/${repo}.git`, 'main']);
}

const mediaIdMatch = String(result.stdout || '').match(/Media ID:\s*([^\s]+)/);
if (mediaIdMatch) {
  console.log(`WeChat draft ready. Media ID: ${mediaIdMatch[1]}`);
}
