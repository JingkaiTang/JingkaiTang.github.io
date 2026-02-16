#!/usr/bin/env node
/**
 * Build footer gallery data + ensure public assets exist.
 *
 * - Copies Huolin mood images from .huolin_image_bank/ -> public/huolin/
 * - Collects writing cover images from public/writing/<slug>/cover.(jpg|png|webp)
 * - Writes src/data/footer-gallery.json
 *
 * Designed to run during `npm run build` after sync:assets.
 *
 * Note: To avoid dirty working trees from timestamp-only churn, we ONLY rewrite
 * the JSON file when the (counts/items) payload actually changes.
 */

import fs from 'node:fs/promises';
import fssync from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const BANK_DIR = path.join(ROOT, '.huolin_image_bank');
const PUBLIC_HUOLIN_DIR = path.join(ROOT, 'public', 'huolin');
const PUBLIC_WRITING_DIR = path.join(ROOT, 'public', 'writing');
const OUT_JSON = path.join(ROOT, 'src', 'data', 'footer-gallery.json');

const IMG_EXT = new Set(['.jpg', '.jpeg', '.png', '.webp', '.gif']);

async function ensureDir(p) {
  await fs.mkdir(p, { recursive: true });
}

function isImage(p) {
  return IMG_EXT.has(path.extname(p).toLowerCase());
}

async function listFilesRecursive(dir) {
  const out = [];
  async function walk(d) {
    let entries = [];
    try {
      entries = await fs.readdir(d, { withFileTypes: true });
    } catch {
      return;
    }
    for (const e of entries) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) await walk(p);
      else out.push(p);
    }
  }
  await walk(dir);
  return out;
}

async function copyBankImages() {
  if (!fssync.existsSync(BANK_DIR)) return [];
  await ensureDir(PUBLIC_HUOLIN_DIR);

  const files = await fs.readdir(BANK_DIR);
  const imgs = files.filter((f) => isImage(f));

  const urls = [];
  for (const f of imgs) {
    const src = path.join(BANK_DIR, f);
    const dst = path.join(PUBLIC_HUOLIN_DIR, f);
    await fs.copyFile(src, dst);
    urls.push(`/huolin/${encodeURIComponent(f)}`);
  }
  return urls;
}

async function collectWritingCovers() {
  // Expect sync:assets has populated public/writing/<slug>/cover.jpg
  if (!fssync.existsSync(PUBLIC_WRITING_DIR)) return [];
  const files = await listFilesRecursive(PUBLIC_WRITING_DIR);
  const covers = files.filter((p) => /\/cover\.(jpg|jpeg|png|webp|gif)$/i.test(p));

  // Convert to public URLs
  return covers
    .map((p) => {
      const rel = path.relative(path.join(ROOT, 'public'), p).split(path.sep).join('/');
      return `/${rel}`;
    })
    .sort();
}

async function readJsonIfExists(p) {
  try {
    const raw = await fs.readFile(p, 'utf8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function stableKey({ counts, items }) {
  // Only include fields that affect UI.
  return JSON.stringify({ counts, items });
}

async function main() {
  await ensureDir(path.dirname(OUT_JSON));

  const [huolin, writing] = await Promise.all([copyBankImages(), collectWritingCovers()]);

  // Keep a reasonable upper bound; front-end can further sample.
  const items = [
    ...writing.map((url) => ({ url, kind: 'writing-cover' })),
    ...huolin.map((url) => ({ url, kind: 'huolin-mood' })),
  ];

  const counts = { writing: writing.length, huolin: huolin.length, total: items.length };

  const prev = await readJsonIfExists(OUT_JSON);
  const prevKey = prev ? stableKey({ counts: prev.counts, items: prev.items }) : null;
  const nextKey = stableKey({ counts, items });

  if (prevKey === nextKey) {
    console.log('[gallery] unchanged; keep existing:', path.relative(ROOT, OUT_JSON));
    return;
  }

  const out = {
    builtAt: new Date().toISOString(),
    counts,
    items,
  };

  await fs.writeFile(OUT_JSON, JSON.stringify(out, null, 2) + '\n', 'utf8');
  console.log(`[gallery] wrote ${items.length} items -> ${path.relative(ROOT, OUT_JSON)}`);
}

await main();
