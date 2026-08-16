import { describe, expect, it } from 'vitest';
import { formatStatus } from './wechat-status.mjs';

describe('wechat status output', () => {
  it('reports the latest submission state without exposing credentials', () => {
    const output = formatStatus({
      slug: 'test',
      status: 'submitted',
      submissionStatus: 'submitted',
      sourceCommit: 'abc123',
      sourceDigest: 'source-digest',
      safeDigest: 'safe-digest',
      updatedAt: '2026-08-16T00:00:00.000Z',
      submittedAt: '2026-08-16T00:00:00.000Z',
      mediaId: 'media-123',
    });

    expect(output).toContain('status: submitted');
    expect(output).toContain('mediaId: media-123');
    expect(output).not.toContain('WECHAT_APP_SECRET');
  });

  it('makes a missing record explicit', () => {
    expect(formatStatus(null)).toBe('暂无公众号投递记录。');
  });
});
