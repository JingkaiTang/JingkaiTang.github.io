export function pickFirstImageFromMarkdown(md: string): string | null {
  // Markdown image: ![alt](url "title")
  const m1 = md.match(/!\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/);
  if (m1?.[1]) return m1[1];

  // HTML image: <img src="...">
  const m2 = md.match(/<img[^>]*\ssrc=["']([^"']+)["'][^>]*>/i);
  if (m2?.[1]) return m2[1];

  return null;
}

export function pickCover(input: { data: { cover?: string | undefined }; body?: string | undefined }): string | null {
  const raw = input.data.cover ?? pickFirstImageFromMarkdown(input.body ?? '');
  return raw && raw.trim().length ? raw.trim() : null;
}

export function resolveMaybeRelativeUrl(url: string, basePath: string): string {
  // If it's already absolute (or root-absolute), keep it.
  if (url.startsWith('//') || /^https?:\/\//.test(url) || url.startsWith('/') || url.startsWith('data:')) return url;

  // Ensure basePath ends with a trailing slash so relative URLs resolve under it, not as siblings.
  const normalizedBasePath = basePath.endsWith('/') ? basePath : `${basePath}/`;

  // Resolve relative to a base path like "/writing/<slug>/".
  // Use a dummy origin for URL resolution.
  return new URL(url, `https://example.com${normalizedBasePath}`).pathname;
}
