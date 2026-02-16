#!/usr/bin/env node
/**
 * Fetch GitHub pinned repositories for a user via GraphQL API.
 *
 * - Uses GITHUB_TOKEN / GH_TOKEN if available.
 * - If missing, tries to use `gh auth token` (local dev convenience).
 * - Writes JSON cache to src/data/github-pins.json.
 *
 * This is intended to run in CI before `astro build`.
 *
 * Note: To avoid dirty working trees from timestamp-only churn, we ONLY rewrite
 * the cache file when the pin payload actually changes.
 */

import fs from 'node:fs/promises';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const ROOT = process.cwd();
const OUT_PATH = path.join(ROOT, 'src', 'data', 'github-pins.json');

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

function shOut(cmd, args) {
  const r = spawnSync(cmd, args, { encoding: 'utf8' });
  if (r.status !== 0) return null;
  return String(r.stdout || '').trim();
}

async function ensureDir(p) {
  await fs.mkdir(path.dirname(p), { recursive: true });
}

async function readJsonIfExists(p) {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function stableStringify(x) {
  return JSON.stringify(x);
}

async function main() {
  const args = parseArgs(process.argv);
  const username = args.user && args.user !== 'true' ? args.user : 'JingkaiTang';
  const limit = Number(args.limit || 6);

  let token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN || process.env.GITHUB_PAT || null;

  if (!token) {
    // Local convenience if user is logged in with gh.
    token = shOut('gh', ['auth', 'token']);
  }

  if (!token) {
    console.warn('[pins] No token found; keeping existing cache:', OUT_PATH);
    process.exit(0);
  }

  const query = `query($login:String!, $n:Int!) {\n  user(login:$login) {\n    pinnedItems(first:$n, types:[REPOSITORY]) {\n      nodes {\n        ... on Repository {\n          name\n          nameWithOwner\n          description\n          url\n          homepageUrl\n          stargazerCount\n          forkCount\n          primaryLanguage { name color }\n          updatedAt\n          isArchived\n          isFork\n        }\n      }\n    }\n  }\n}`;

  const resp = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `bearer ${token}`,
      'user-agent': 'jingkaitang-github-io',
    },
    body: JSON.stringify({ query, variables: { login: username, n: limit } }),
  });

  if (!resp.ok) {
    const t = await resp.text().catch(() => '');
    console.warn('[pins] fetch failed:', resp.status, t.slice(0, 200));
    process.exit(0);
  }

  const json = await resp.json();
  const nodes = json?.data?.user?.pinnedItems?.nodes || [];

  const pins = nodes
    .filter(Boolean)
    .map((r) => ({
      name: r.name,
      fullName: r.nameWithOwner,
      description: r.description || '',
      url: r.url,
      homepageUrl: r.homepageUrl || '',
      stars: r.stargazerCount || 0,
      forks: r.forkCount || 0,
      language: r.primaryLanguage?.name || '',
      languageColor: r.primaryLanguage?.color || '',
      updatedAt: r.updatedAt,
      isArchived: !!r.isArchived,
      isFork: !!r.isFork,
    }));

  const prev = await readJsonIfExists(OUT_PATH);
  const prevKey = prev ? stableStringify({ user: prev.user, pins: prev.pins }) : null;
  const nextKey = stableStringify({ user: username, pins });

  if (prevKey === nextKey) {
    console.log('[pins] unchanged; keep existing cache:', path.relative(ROOT, OUT_PATH));
    return;
  }

  const out = {
    user: username,
    fetchedAt: new Date().toISOString(),
    pins,
  };

  await ensureDir(OUT_PATH);
  await fs.writeFile(OUT_PATH, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`[pins] wrote ${pins.length} pinned repos -> ${path.relative(ROOT, OUT_PATH)}`);
}

await main();
