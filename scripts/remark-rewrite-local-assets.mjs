import fs from 'node:fs';
import path from 'node:path';

const JPEG_SIZE_MARKERS = new Set([
  0xc0, 0xc1, 0xc2, 0xc3,
  0xc5, 0xc6, 0xc7,
  0xc9, 0xca, 0xcb,
  0xcd, 0xce, 0xcf,
]);
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

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

    if (buffer.length >= 24 && buffer.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) {
      return validDimensions(buffer.readUInt32BE(16), buffer.readUInt32BE(20));
    }

    const gifHeader = buffer.subarray(0, 6).toString('ascii');
    if (buffer.length >= 10 && (gifHeader === 'GIF87a' || gifHeader === 'GIF89a')) {
      return validDimensions(buffer.readUInt16LE(6), buffer.readUInt16LE(8));
    }

    if (buffer.length >= 4 && buffer[0] === 0xff && buffer[1] === 0xd8) {
      let offset = 2;
      while (offset < buffer.length) {
        while (offset < buffer.length && buffer[offset] !== 0xff) offset += 1;
        while (offset < buffer.length && buffer[offset] === 0xff) offset += 1;
        if (offset >= buffer.length) break;

        const marker = buffer[offset];
        offset += 1;

        if (marker === 0x00 || marker === 0x01 || marker === 0xd8 || (marker >= 0xd0 && marker <= 0xd7)) {
          continue;
        }
        if (marker === 0xd9 || marker === 0xda || offset + 1 >= buffer.length) break;

        const segmentLength = buffer.readUInt16BE(offset);
        if (segmentLength < 2 || offset + segmentLength > buffer.length) return null;

        if (JPEG_SIZE_MARKERS.has(marker)) {
          if (segmentLength < 7) return null;
          return validDimensions(buffer.readUInt16BE(offset + 5), buffer.readUInt16BE(offset + 3));
        }

        offset += segmentLength;
      }
    }

    const header = buffer.subarray(0, 512).toString('utf8');
    if (extension === '.svg' || /<svg\b/i.test(header)) {
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
