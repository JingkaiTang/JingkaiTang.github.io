/**
 * Utility functions for scripts - extracted for testing
 * These mirror the functions used in scripts/*.mjs files
 */

/**
 * Converts a string to a URL-friendly slug
 */
export function slugify(s: string | undefined | null): string {
  return String(s ?? '')
    .trim()
    .toLowerCase()
    .replace(/['"`]/g, '')
    .replace(/[^a-z0-9\u4e00-\u9fa5]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/--+/g, '-');
}

/**
 * Parses command-line arguments in --key value format
 */
export function parseArgs(argv: string[]): Record<string, string> {
  const out: Record<string, string> = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (!a.startsWith('--')) continue;
    const key = a.slice(2);
    const val = argv[i + 1] && !argv[i + 1].startsWith('--') ? argv[++i] : 'true';
    out[key] = val;
  }
  return out;
}

/**
 * Normalizes comma-separated tags into an array
 */
export function normalizeTags(raw: string | undefined | null): string[] {
  return String(raw ?? '')
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
}

/**
 * Returns today's date in ISO format (YYYY-MM-DD)
 */
export function todayISO(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}

/**
 * Checks if frontmatter contains draft: true
 */
export function isDraft(content: string): boolean {
  return /\n\s*draft:\s*true\s*\n/i.test(content);
}