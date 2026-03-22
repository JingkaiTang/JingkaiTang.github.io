import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

function toUrl(site: URL, pathname: string) {
  return new URL(pathname.replace(/^\//, ''), site).toString();
}

export const GET: APIRoute = async ({ site }) => {
  if (!site) {
    return new Response('Missing Astro.site (configure `site` in astro.config.mjs)', { status: 500 });
  }

  const nowPosts = (await getCollection('now')).filter((p) => !p.data.draft);
  const writingPosts = (await getCollection('writing')).filter((p) => !p.data.draft);

  const staticPaths = [
    '/',
    '/writing/',
    '/now/',
    '/tags/',
    '/search/',
    '/games/',
    '/life/',
    '/rss.xml',
  ];

  const urls: Array<{ loc: string; lastmod?: string }> = [];

  for (const p of staticPaths) {
    urls.push({ loc: toUrl(site, p) });
  }

  for (const post of writingPosts) {
    const slug = post.id;
    urls.push({
      loc: toUrl(site, `/writing/${slug}/`),
      lastmod: (post.data.updatedDate ?? post.data.pubDate).toISOString(),
    });
  }

  for (const post of nowPosts) {
    const slug = post.id;
    urls.push({
      loc: toUrl(site, `/now/${slug}/`),
      lastmod: (post.data.updatedDate ?? post.data.pubDate).toISOString(),
    });
  }

  const xml = `<?xml version="1.0" encoding="UTF-8"?>\n` +
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
    urls
      .map((u) => {
        const lastmod = u.lastmod ? `\n    <lastmod>${u.lastmod}</lastmod>` : '';
        return `  <url>\n    <loc>${u.loc}</loc>${lastmod}\n  </url>`;
      })
      .join('\n') +
    `\n</urlset>\n`;

  return new Response(xml, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600',
    },
  });
};
