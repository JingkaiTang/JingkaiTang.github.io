import { describe, expect, it } from 'vitest';
import { resolve } from 'node:path';
import { resolveLocalAssetPath } from './validate-publish.mjs';

describe('resolveLocalAssetPath', () => {
  it('maps root-relative site assets to public', () => {
    expect(resolveLocalAssetPath('/huolin/cover.jpg', '/tmp/post/index.md')).toBe(
      resolve(process.cwd(), 'public/huolin/cover.jpg'),
    );
  });

  it('decodes URL-encoded relative asset names', () => {
    expect(resolveLocalAssetPath('./Pasted%20image.png', '/tmp/post/index.md')).toBe(
      '/tmp/post/Pasted image.png',
    );
  });
});
