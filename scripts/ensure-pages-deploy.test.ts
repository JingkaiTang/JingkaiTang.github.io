import { describe, expect, it } from 'vitest';
import { evaluateRun, findRunForHead } from './ensure-pages-deploy.mjs';

describe('Pages deployment status', () => {
  it('only considers a completed successful matching run deployed', () => {
    const headSha = 'abc123';
    expect(evaluateRun({ head_sha: headSha, status: 'completed', conclusion: 'success' }, headSha).state)
      .toBe('success');
    expect(evaluateRun({ head_sha: headSha, status: 'in_progress', conclusion: null }, headSha).state)
      .toBe('pending');
    expect(evaluateRun({ head_sha: headSha, status: 'completed', conclusion: 'failure' }, headSha).state)
      .toBe('failed');
    expect(evaluateRun({ head_sha: 'other', status: 'completed', conclusion: 'success' }, headSha).state)
      .toBe('mismatch');
  });

  it('finds the run matching the deployed commit', () => {
    const run = { id: 2, head_sha: 'target', status: 'queued', conclusion: null };
    expect(findRunForHead([
      { id: 1, head_sha: 'old' },
      run,
    ], 'target')).toEqual(run);
    expect(findRunForHead([], 'target')).toBeNull();
  });
});
