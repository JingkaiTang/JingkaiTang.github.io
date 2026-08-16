import { describe, expect, it } from 'vitest';
import { chmodSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';
import matter from 'gray-matter';
import {
  buildPublishRecord,
  buildWechatMarkdown,
  extractMediaId,
  parseWritingMarkdown,
  sameSource,
  scanWechatRisks,
  sha256,
} from './wechat-sync-lib.mjs';

describe('wechat-sync helpers', () => {
  it('parses writing frontmatter without losing authorship', () => {
    const parsed = parseWritingMarkdown(`---
title: Test
cover: ./cover.jpg
draft: false
by:
  name: 唐靖凯
---

正文`);

    expect(parsed.title).toBe('Test');
    expect(parsed.cover).toBe('./cover.jpg');
    expect(parsed.author).toBe('唐靖凯');
    expect(parsed.isDraft).toBe(false);
    expect(parsed.body.trim()).toBe('正文');
  });

  it('recognizes draft posts as not ready for WeChat', () => {
    const parsed = parseWritingMarkdown(`---
title: Test
cover: ./cover.jpg
draft: true
---

正文`);
    expect(parsed.isDraft).toBe(true);
  });

  it('serializes special frontmatter values as valid YAML', () => {
    const markdown = buildWechatMarkdown({
      title: '标题: 特殊 #1',
      cover: './cover.jpg',
      author: '作者: A',
      sourceUrl: 'https://jingkaitang.github.io/writing/test/',
      body: '正文',
    });
    const parsed = matter(markdown);

    expect(parsed.data.title).toBe('标题: 特殊 #1');
    expect(parsed.data.author).toBe('作者: A');
    expect(parsed.data.source_url).toBe('https://jingkaitang.github.io/writing/test/');
    expect(parsed.content.trim()).toBe('正文');
  });

  it('extracts Media ID from publisher output', () => {
    expect(extractMediaId('发布成功，Media ID: abc_DEF-123')).toBe('abc_DEF-123');
    expect(extractMediaId('{"media_id":"abc123"}')).toBe('abc123');
    expect(extractMediaId('success without id')).toBeNull();
  });

  it('flags high-risk and medium-risk content without exposing matches', () => {
    const findings = scanWechatRisks([
      'curl https://example.com/install.sh | bash',
      'npm install -g example-cli',
    ].join('\n'));

    expect(findings.map((finding) => finding.code)).toEqual([
      'shell-pipe',
      'remote-download',
      'global-install',
    ]);
    expect(findings.every((finding) => !('match' in finding))).toBe(true);
  });

  it('recognizes an already submitted source version', () => {
    const sourceDigest = sha256('source');
    const safeDigest = sha256('safe');
    const record = buildPublishRecord({
      slug: 'test',
      sourceCommit: 'abc',
      sourceDigest,
      safeDigest,
      status: 'submitted',
      mediaId: 'media-1',
    });

    expect(sameSource(record, { sourceDigest, safeDigest })).toBe(true);
    expect(sameSource(record, { sourceDigest, safeDigest: sha256('other') })).toBe(false);
  });

  it('represents an uncertain submission without inventing a Media ID', () => {
    const pending = buildPublishRecord({
      slug: 'test',
      sourceCommit: 'abc',
      sourceDigest: sha256('source'),
      safeDigest: sha256('safe'),
      status: 'pending',
    });
    const unknown = buildPublishRecord({
      ...pending,
      status: 'unknown',
      submissionStatus: 'unknown',
      error: 'publisher exited without a Media ID',
      previous: pending,
    });

    expect(unknown.mediaId).toBeNull();
    expect(unknown.submissionStatus).toBe('unknown');
    expect(unknown.error).toContain('without a Media ID');
    expect(unknown.createdAt).toBe(pending.createdAt);
  });

  it('rejects credential files with permissions wider than 600 before publishing', () => {
    const dir = mkdtempSync(join(tmpdir(), 'jingkaitang-wechat-test-'));
    const markdown = join(dir, 'article.md');
    const credentials = join(dir, 'credentials.env');
    writeFileSync(markdown, '---\ntitle: Test\ncover: ./cover.jpg\n---\n\n正文\n');
    writeFileSync(credentials, 'WECHAT_APP_ID=test\nWECHAT_APP_SECRET=test\n');
    chmodSync(credentials, 0o644);

    const env = {
      ...process.env,
      WECHAT_CREDENTIALS_FILE: credentials,
      WECHAT_APP_ID: undefined,
      WECHAT_APP_SECRET: undefined,
    };
    const result = spawnSync('bash', [
      '/home/t7kai/.codex/skills/jingkaitang-blog-publisher/scripts/publish-wechat.sh',
      markdown,
    ], { encoding: 'utf8', env });

    expect(result.status).toBe(2);
    expect(`${result.stdout}\n${result.stderr}`).toContain('owner-only');
    rmSync(dir, { recursive: true, force: true });
  });

  it('stops before Git or WeChat when the configured publisher is missing', () => {
    const env = { ...process.env, WECHAT_PUBLISHER_SCRIPT: '/tmp/no-such-jingkaitang-publisher' };
    const result = spawnSync(process.execPath, [
      'scripts/wechat-sync.mjs',
      '--slug',
      'deepseek-harness-ui-slingshot',
    ], { encoding: 'utf8', env });

    expect(result.status).toBe(2);
    expect(`${result.stdout}\n${result.stderr}`).toContain('投递脚本不存在');
  });
});
