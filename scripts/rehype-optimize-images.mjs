import path from 'node:path';
import { detectImageDimensions } from './remark-rewrite-local-assets.mjs';

function contentImagePrefix(filePath) {
  const parts = filePath.split(path.sep);
  for (const kind of ['writing', 'now']) {
    const index = parts.lastIndexOf(kind);
    if (index >= 0 && parts[index + 1]) return `/${kind}/${parts[index + 1]}/`;
  }
  return null;
}

function sourceImagePath(markdownPath, publicUrl, prefix) {
  if (typeof publicUrl !== 'string') return null;
  const matchedPrefix = [prefix, encodeURI(prefix)].find((candidate) => publicUrl.startsWith(candidate));
  if (!matchedPrefix) return null;

  const relativeUrl = publicUrl.slice(matchedPrefix.length).split(/[?#]/, 1)[0];
  let decoded = relativeUrl;
  try {
    decoded = decodeURIComponent(relativeUrl);
  } catch {
    // Keep the original path when it contains a malformed escape sequence.
  }
  return path.resolve(path.dirname(markdownPath), decoded);
}

export function rehypeOptimizeImages() {
  return function transformer(tree, file) {
    const filePath = file?.path ? String(file.path) : '';
    const prefix = filePath ? contentImagePrefix(filePath) : null;
    if (!prefix) return;

    const stack = [tree];
    while (stack.length) {
      const node = stack.pop();
      if (!node || typeof node !== 'object') continue;

      if (node.type === 'element' && node.tagName === 'img') {
        const properties = node.properties ?? {};
        const sourcePath = sourceImagePath(filePath, properties.src, prefix);
        const dimensions = sourcePath ? detectImageDimensions(sourcePath) : null;
        node.properties = {
          loading: 'lazy',
          decoding: 'async',
          ...(dimensions ?? {}),
          ...properties,
        };
      }

      if (Array.isArray(node.children)) {
        for (const child of node.children) stack.push(child);
      }
    }
  };
}
