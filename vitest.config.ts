import { getViteConfig } from 'astro/config';

export default getViteConfig({
  test: {
    include: ['**/*.{test,spec}.{ts,js,mjs}'],
    exclude: ['node_modules', 'dist'],
  },
});