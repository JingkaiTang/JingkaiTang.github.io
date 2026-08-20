import fs from 'node:fs';
import path from 'node:path';

const JPEG_SIZE_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3,
  0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb,
  0xcd, 0xce, 0xcf,
]);

function detectContext(filePath) {
  // Expect:
  //  - .../src/content/writing/<slug>/index.md
  //  - .../src/content/now/<id>/index.md
  const parts = filePath.split(path.sep);

  const writingIdx = parts.lastIndexOf('writing');
  if (writingIdx >= 0 && parts[parts.length - 1] === 'index.md' && parts.length >= writingIdx + 3) {
    return { kind: 'writing', slug: parts[writingIdx + 1] };
  }

  const nowIdx = parts.lastIndexOf('now');
  if (nowIdx >= 0 && parts[parts.length - 1] === 'index.md' && parts.length >= nowIdx + 3) {
    return { kind: 'now', slug: parts[nowIdx + 1] };
  }

  // Fallback: flat files (legacy)
  if (writingIdx >= 0) {
    const base = path.basename(filePath, path.extname(filePath));
    if (base) return { kind: 'writing', slug: base };
  }

  return null;
}

function isRelativeUrl(url) {
  return (
    typeof url === 'string' &&
    url.length > 0 &&
    !url.startsWith('/') &&
    !url.startsWith('http://') &&
    !url.startsWith('https://') &&
    !url.startsWith('#')
  );
}

function validDimensions(width, height) {
  if (!Number.isFinite(width) || !Number.isFinite(height) || width <= 0 || height <= 0) return null;
  return { width: Math.round(width), height: Math.round(height) };
}

export function detectImageDimensions(filePath) {
  try {
    const buffer = fs.readFileSync(filePath);
    const extension = path.extname(filePath).toLowerCase();

    if (extension === '.png' && buffer.length >= 24) {
      return validDimensions(buffer.readUInt32BE(16), buffer.readUInt32BE(20));
    }

    if (extension === '.gif' && buffer.length >= 10) {
      return validDimensions(buffer.readUInt16LE(6), buffer.readUInt16LE(8));
    }

    if (extension === '.jpg' || extension === '.jpeg') {
      let offset = 2;
      while (offset + 9 < buffer.length) {
        if (buffer[offset] !== 0xff) {
          offset += 1;
          continue;
        }
        const marker = buffer[offset + 1];
        if (JPEG_SIZE_MARKERS.has(marker)) {
          return validDimensions(buffer.readUInt16BE(offset + 7), buffer.readUInt16BE(offset + 5));
        }
        if (marker === 0xd8 || marker === 0xd9 || (marker >= 0xd0 && marker <= 0xd7)) {
          offset += 2;
          continue;
        }
        const segmentLength = buffer.readUInt16BE(offset + 2);
        if (segmentLength < 2) return null;
        offset += segmentLength + 2;
      }
    }

    if (extension === '.svg') {
      const svg = buffer.toString('utf8');
      const viewBox = svg.match(/viewBox=["']\s*[-\d.]+\s+[-\d.]+\s+([\d.]+)\s+([\d.]+)\s*["']/i);
      if (viewBox) return validDimensions(Number(viewBox[1]), Number(viewBox[2]));

      const width = svg.match(/\bwidth=["']([\d.]+)(?:px)?["']/i);
      const height = svg.match(/\bheight=["']([\d.]+)(?:px)?["']/i);
      if (width && height) return validDimensions(Number(width[1]), Number(height[1]));
    }
  } catch {
    // Missing or unsupported images are handled by the publishing validator.
  }

  return null;
}

export function remarkRewriteLocalAssets() {
  return function transformer(tree, file) {
    const filePath = file?.path ? String(file.path) : '';
    if (!filePath) return;

    const ctx = detectContext(filePath);
    if (!ctx) return;

    const basePath = ctx.kind === 'now' ? `/now/${ctx.slug}/` : `/writing/${ctx.slug}/`;

    /** @type {import('unist').Node[]} */
    const stack = [tree];

    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;

      // rewrite markdown images: ![alt](url)
      if (node.type === 'image' && isRelativeUrl(node.url)) {
        node.url = basePath + node.url;
      }

      // rewrite links that look like local assets too
      if (node.type === 'link' && isRelativeUrl(node.url)) {
        // Don't rewrite links to other pages like ../something (we only rewrite same-folder files)
        if (!node.url.startsWith('../') && !node.url.startsWith('./')) {
          node.url = basePath + node.url;
        }
      }

      const children = node.children;
      if (Array.isArray(children)) {
        for (const c of children) stack.push(c);
      }
    }
  };
}
