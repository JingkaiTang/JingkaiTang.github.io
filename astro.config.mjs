// @ts-check
import { readFile } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'astro/config';
import { remarkRewriteLocalAssets } from './scripts/remark-rewrite-local-assets.mjs';
import { remarkResponsiveTables } from './scripts/remark-responsive-tables.mjs';

const PAGEFIND_ROUTE = '/pagefind/';
const PAGEFIND_DEV_DIR = resolve(fileURLToPath(new URL('./dist/pagefind/', import.meta.url)));
const PAGEFIND_DEV_PREFIX = `${PAGEFIND_DEV_DIR}${sep}`;
const PAGEFIND_CONTENT_TYPES = new Map([
  ['.css', 'text/css; charset=utf-8'],
  ['.js', 'text/javascript; charset=utf-8'],
  ['.json', 'application/json; charset=utf-8'],
  ['.wasm', 'application/wasm'],
]);

/** @returns {import('vite').Plugin} */
function servePagefindInDev() {
  return {
    name: 'serve-pagefind-in-dev',
    configureServer(server) {
      server.middlewares.use(async (request, response, next) => {
        if (!request.url || !['GET', 'HEAD'].includes(request.method || '')) return next();

        const pathname = new URL(request.url, 'http://localhost').pathname;
        if (!pathname.startsWith(PAGEFIND_ROUTE)) return next();

        let relativePath;
        try {
          relativePath = decodeURIComponent(pathname.slice(PAGEFIND_ROUTE.length));
        } catch {
          return next();
        }

        const filePath = resolve(PAGEFIND_DEV_DIR, relativePath);
        if (!relativePath || !filePath.startsWith(PAGEFIND_DEV_PREFIX)) return next();

        try {
          const content = await readFile(filePath);
          const contentType = PAGEFIND_CONTENT_TYPES.get(extname(filePath)) || 'application/octet-stream';
          response.statusCode = 200;
          response.setHeader('Content-Type', contentType);
          response.setHeader('Content-Length', content.byteLength);
          response.setHeader('Cache-Control', 'no-store');
          response.end(request.method === 'HEAD' ? undefined : content);
        } catch {
          next();
        }
      });
    },
  };
}

// https://astro.build/config
export default defineConfig({
  site: 'https://jingkaitang.github.io',
  vite: {
    plugins: [servePagefindInDev()],
  },
  markdown: {
    remarkPlugins: [remarkRewriteLocalAssets, remarkResponsiveTables],
  },
});
