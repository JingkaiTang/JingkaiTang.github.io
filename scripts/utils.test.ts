import { describe, it, expect } from 'vitest';
import { slugify, parseArgs, normalizeTags, todayISO, isDraft } from './utils.test-utils';

describe('slugify', () => {
  describe('basic transformations', () => {
    it('converts to lowercase', () => {
      expect(slugify('Hello World')).toBe('hello-world');
    });

    it('trims whitespace', () => {
      expect(slugify('  hello world  ')).toBe('hello-world');
    });

    it('handles null input', () => {
      expect(slugify(null)).toBe('');
    });

    it('handles undefined input', () => {
      expect(slugify(undefined)).toBe('');
    });

    it('handles empty string', () => {
      expect(slugify('')).toBe('');
    });

    it('handles whitespace only', () => {
      expect(slugify('   ')).toBe('');
    });
  });

  describe('special characters', () => {
    it('removes quotes', () => {
      expect(slugify("it's a test")).toBe('its-a-test');
    });

    it('removes double quotes', () => {
      expect(slugify('say "hello"')).toBe('say-hello');
    });

    it('removes backticks', () => {
      expect(slugify('code `example`')).toBe('code-example');
    });

    it('replaces multiple non-alphanumeric with single dash', () => {
      expect(slugify('hello!!!world')).toBe('hello-world');
    });

    it('removes leading dashes', () => {
      expect(slugify('---hello')).toBe('hello');
    });

    it('removes trailing dashes', () => {
      expect(slugify('hello---')).toBe('hello');
    });

    it('collapses multiple dashes', () => {
      expect(slugify('hello---world')).toBe('hello-world');
    });
  });

  describe('Chinese characters', () => {
    it('preserves Chinese characters', () => {
      expect(slugify('你好世界')).toBe('你好世界');
    });

    it('handles mixed Chinese and English', () => {
      expect(slugify('Hello 世界')).toBe('hello-世界');
    });

    it('handles Chinese with punctuation', () => {
      expect(slugify('测试，文章')).toBe('测试-文章');
    });
  });

  describe('realistic titles', () => {
    it('handles a blog post title', () => {
      expect(slugify('My First Blog Post')).toBe('my-first-blog-post');
    });

    it('handles title with numbers', () => {
      expect(slugify('2024 Year in Review')).toBe('2024-year-in-review');
    });

    it('handles technical title', () => {
      expect(slugify("React's New Features")).toBe('reacts-new-features');
    });

    it('handles Chinese blog title', () => {
      expect(slugify('我的第一篇博客')).toBe('我的第一篇博客');
    });
  });
});

describe('parseArgs', () => {
  describe('basic parsing', () => {
    it('parses single flag', () => {
      expect(parseArgs(['node', 'script.mjs', '--flag'])).toEqual({ flag: 'true' });
    });

    it('parses flag with value', () => {
      expect(parseArgs(['node', 'script.mjs', '--name', 'value'])).toEqual({ name: 'value' });
    });

    it('parses multiple flags', () => {
      expect(parseArgs(['node', 'script.mjs', '--a', '1', '--b', '2'])).toEqual({
        a: '1',
        b: '2',
      });
    });

    it('ignores non-flag arguments', () => {
      expect(parseArgs(['node', 'script.mjs', 'positional', '--flag', 'value'])).toEqual({
        flag: 'value',
      });
    });
  });

  describe('edge cases', () => {
    it('returns empty object for no args', () => {
      expect(parseArgs(['node', 'script.mjs'])).toEqual({});
    });

    it('treats value starting with dashes as new flag', () => {
    // Note: the parser treats --value as a new flag, not as url's value
    expect(parseArgs(['node', 'script.mjs', '--url', '--value'])).toEqual({
      url: 'true',
      value: 'true',
    });
  });

    it('handles empty value after flag', () => {
      expect(parseArgs(['node', 'script.mjs', '--flag', '--other'])).toEqual({
        flag: 'true',
        other: 'true',
      });
    });

    it('handles boolean-like string values', () => {
      expect(parseArgs(['node', 'script.mjs', '--enabled', 'true'])).toEqual({
        enabled: 'true',
      });
    });

    it('handles numeric string values', () => {
      expect(parseArgs(['node', 'script.mjs', '--count', '42'])).toEqual({ count: '42' });
    });

    it('handles --key=value format (treats entire string as key)', () => {
    // Note: this parser treats --key=value as a flag named "key=value" with value true
    expect(parseArgs(['node', 'script.mjs', '--key=value'])).toEqual({ 'key=value': 'true' });
  });
  });

  describe('realistic use cases', () => {
    it('parses new-post args', () => {
      expect(
        parseArgs([
          'node',
          'new-post.mjs',
          '--title',
          'My Post',
          '--slug',
          'my-post',
          '--tags',
          'life',
        ])
      ).toEqual({
        title: 'My Post',
        slug: 'my-post',
        tags: 'life',
      });
    });

    it('parses publish args', () => {
      expect(
        parseArgs(['node', 'publish.mjs', '--slug', 'test-post', '--draft-ok', 'true'])
      ).toEqual({
        slug: 'test-post',
        'draft-ok': 'true',
      });
    });
  });
});

describe('normalizeTags', () => {
  describe('basic transformations', () => {
    it('splits comma-separated tags', () => {
      expect(normalizeTags('life, tech, travel')).toEqual(['life', 'tech', 'travel']);
    });

    it('trims whitespace', () => {
      expect(normalizeTags('  life  ,  tech  ')).toEqual(['life', 'tech']);
    });

    it('converts to lowercase', () => {
      expect(normalizeTags('Life, TECH, Travel')).toEqual(['life', 'tech', 'travel']);
    });

    it('filters empty strings', () => {
      expect(normalizeTags('life,,tech,')).toEqual(['life', 'tech']);
    });
  });

  describe('edge cases', () => {
    it('handles null', () => {
      expect(normalizeTags(null)).toEqual([]);
    });

    it('handles undefined', () => {
      expect(normalizeTags(undefined)).toEqual([]);
    });

    it('handles empty string', () => {
      expect(normalizeTags('')).toEqual([]);
    });

    it('handles whitespace only', () => {
      expect(normalizeTags('   ')).toEqual([]);
    });

    it('handles single tag', () => {
      expect(normalizeTags('life')).toEqual(['life']);
    });

    it('handles Chinese tags', () => {
      expect(normalizeTags('生活, 技术')).toEqual(['生活', '技术']);
    });

    it('handles mixed Chinese and English', () => {
      expect(normalizeTags('生活, tech, 旅行')).toEqual(['生活', 'tech', '旅行']);
    });
  });
});

describe('todayISO', () => {
  it('returns date in YYYY-MM-DD format', () => {
    const result = todayISO();
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('returns current date', () => {
    const result = todayISO();
    const expected = new Date().toISOString().split('T')[0];
    expect(result).toBe(expected);
  });
});

describe('isDraft', () => {
  describe('detecting draft status', () => {
    it('returns true for draft: true', () => {
      const content = '---\ntitle: Test\ndraft: true\n---\nContent';
      expect(isDraft(content)).toBe(true);
    });

    it('returns false for draft: false', () => {
      const content = '---\ntitle: Test\ndraft: false\n---\nContent';
      expect(isDraft(content)).toBe(false);
    });

    it('returns false when draft is not present', () => {
      const content = '---\ntitle: Test\n---\nContent';
      expect(isDraft(content)).toBe(false);
    });
  });

  describe('formatting variations', () => {
    it('handles draft with spaces', () => {
      const content = '---\ntitle: Test\ndraft:  true  \n---\nContent';
      expect(isDraft(content)).toBe(true);
    });

    it('handles Draft with capital D', () => {
      const content = '---\ntitle: Test\nDraft: true\n---\nContent';
      expect(isDraft(content)).toBe(true);
    });

    it('handles DRAFT uppercase', () => {
      const content = '---\ntitle: Test\nDRAFT: true\n---\nContent';
      expect(isDraft(content)).toBe(true);
    });

    it('handles draft anywhere in frontmatter', () => {
      const content = '---\ntitle: Test\nauthor: Me\ndraft: true\ndate: 2024-01-01\n---\nContent';
      expect(isDraft(content)).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('returns false for empty content', () => {
      expect(isDraft('')).toBe(false);
    });

    it('returns false for content without frontmatter', () => {
      expect(isDraft('Just some content')).toBe(false);
    });

    it('does not match draft in body (requires trailing newline)', () => {
      // Note: the regex requires \n after the value, so it won't match in body
      const content = '---\ntitle: Test\n---\ndraft: true is in the body';
      expect(isDraft(content)).toBe(false);
    });

    it('returns false for draft-like strings', () => {
      const content = '---\ntitle: Test\ndraft: yes\n---\nContent';
      expect(isDraft(content)).toBe(false);
    });

    it('returns false for draft: "true" (string)', () => {
      const content = '---\ntitle: Test\ndraft: "true"\n---\nContent';
      expect(isDraft(content)).toBe(false);
    });
  });
});