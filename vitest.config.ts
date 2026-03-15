import { getViteConfig } from 'astro/config';

export default getViteConfig({
  // @ts-expect-error - Vitest extends Vite config with test property
  test: {
    include: ['**/*.{test,spec}.{ts,js,mjs}'],
    exclude: ['node_modules', 'dist'],
  },
});