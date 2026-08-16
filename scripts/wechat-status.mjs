import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from './wechat-sync-lib.mjs';

export function loadPublishRecord(recordPath) {
  if (!fs.existsSync(recordPath)) return null;
  try {
    return JSON.parse(fs.readFileSync(recordPath, 'utf8'));
  } catch (error) {
    throw new Error(`公众号发布记录格式损坏：${recordPath}：${error.message}`);
  }
}

export function formatStatus(record) {
  if (!record) return '暂无公众号投递记录。';
  const lines = [
    `slug: ${record.slug ?? '(unknown)'}`,
    `status: ${record.status ?? '(unknown)'}`,
    `submissionStatus: ${record.submissionStatus ?? '(unknown)'}`,
    `sourceCommit: ${record.sourceCommit ?? '(unknown)'}`,
    `sourceDigest: ${record.sourceDigest ?? '(unknown)'}`,
    `safeDigest: ${record.safeDigest ?? '(unknown)'}`,
    `updatedAt: ${record.updatedAt ?? '(unknown)'}`,
    `submittedAt: ${record.submittedAt ?? '(not submitted)'}`,
    `mediaId: ${record.mediaId ?? '(none)'}`,
  ];
  if (record.error) lines.push(`error: ${record.error}`);
  return lines.join('\n');
}

function main() {
  const args = parseArgs(process.argv);
  const slug = args.slug && args.slug !== 'true' ? args.slug : null;
  if (!slug) {
    console.error('缺少 --slug <slug>。');
    return 2;
  }

  const recordPath = path.join('src/content/writing', slug, 'wechat-publish.json');
  const record = loadPublishRecord(recordPath);
  if (args.json === 'true') {
    console.log(JSON.stringify(record, null, 2));
  } else {
    console.log(formatStatus(record));
  }
  return record ? 0 : 1;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) {
  try {
    process.exitCode = main();
  } catch (error) {
    console.error(`[wechat-status] ${error.message}`);
    process.exitCode = 2;
  }
}
