// @ts-check
import { defineConfig } from 'astro/config';
import { remarkRewriteLocalAssets } from './scripts/remark-rewrite-local-assets.mjs';
import { remarkResponsiveTables } from './scripts/remark-responsive-tables.mjs';

// https://astro.build/config
export default defineConfig({
  site: 'https://jingkaitang.github.io',
  markdown: {
    remarkPlugins: [remarkRewriteLocalAssets, remarkResponsiveTables],
  },
});
