import { describe, expect, it } from 'vitest';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { detectImageDimensions, remarkRewriteLocalAssets } from './remark-rewrite-local-assets.mjs';
import { rehypeOptimizeImages } from './rehype-optimize-images.mjs';

describe('remarkRewriteLocalAssets', () => {
  it('adds lazy-loading metadata and intrinsic dimensions to local images', () => {
    const root = mkdtempSync(join(tmpdir(), 'jingkaitang-remark-test-'));
    try {
      const postDir = join(root, 'src', 'content', 'writing', 'demo');
      const markdownPath = join(postDir, 'index.md');
      const imagePath = join(postDir, 'cover.png');
      mkdirSync(postDir, { recursive: true });

      const png = Buffer.alloc(24);
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(png);
      png.writeUInt32BE(640, 16);
      png.writeUInt32BE(360, 20);
      writeFileSync(imagePath, png);

      const image = { type: 'image', url: './cover.png', alt: '封面' };
      const tree = { type: 'root', children: [image] };
      remarkRewriteLocalAssets()(tree, { path: markdownPath });

      expect(image.url).toBe('/writing/demo/./cover.png');

      const htmlImage = {
        type: 'element',
        tagName: 'img',
        properties: { src: image.url, alt: image.alt },
        children: [],
      };
      rehypeOptimizeImages()({ type: 'root', children: [htmlImage] }, { path: markdownPath });
      expect(htmlImage.properties).toEqual({
        loading: 'lazy',
        decoding: 'async',
        width: 640,
        height: 360,
        src: '/writing/demo/./cover.png',
        alt: '封面',
      });
    } finally {
      rmSync(root, { recursive: true, force: true });
    }
  });

  it('keeps external URLs while still adding loading metadata', () => {
    const image = {
      type: 'element',
      tagName: 'img',
      properties: { src: 'https://example.com/image.jpg', alt: '示例' },
      children: [],
    };
    const tree = { type: 'root', children: [image] };
    rehypeOptimizeImages()(tree, {
      path: '/tmp/src/content/writing/demo/index.md',
    });

    expect(image.properties).toEqual({
      loading: 'lazy',
      decoding: 'async',
      src: 'https://example.com/image.jpg',
      alt: '示例',
    });
  });

  it('detects JPEG dimensions from file signatures and progressive markers', () => {
    expect(detectImageDimensions(resolve(
      'src/content/writing/agent-short-term-memory-management/cover.png',
    ))).toEqual({ width: 1376, height: 768 });

    expect(detectImageDimensions(resolve(
      'src/content/writing/anthropic说mythos太强了不敢发布-我觉得是太贵了/cover.jpg',
    ))).toEqual({ width: 1280, height: 698 });
  });

  it('resolves encoded content URLs for non-ASCII slugs', () => {
    const slug = 'anthropic说mythos太强了不敢发布-我觉得是太贵了';
    const markdownPath = resolve(`src/content/writing/${slug}/index.md`);
    const image = {
      type: 'element',
      tagName: 'img',
      properties: { src: `/writing/${encodeURIComponent(slug)}/./cover.jpg`, alt: '封面' },
      children: [],
    };

    rehypeOptimizeImages()({ type: 'root', children: [image] }, { path: markdownPath });

    expect(image.properties).toEqual({
      loading: 'lazy',
      decoding: 'async',
      width: 1280,
      height: 698,
      src: `/writing/${encodeURIComponent(slug)}/./cover.jpg`,
      alt: '封面',
    });
  });
});
