import { describe, it, expect } from 'vitest';
import {
  pickFirstImageFromMarkdown,
  pickCover,
  resolveMaybeRelativeUrl,
} from './contentPreview.js';

describe('pickFirstImageFromMarkdown', () => {
  describe('markdown image syntax', () => {
    it('extracts URL from basic markdown image', () => {
      const md = '![alt text](https://example.com/image.jpg)';
      expect(pickFirstImageFromMarkdown(md)).toBe('https://example.com/image.jpg');
    });

    it('extracts URL from markdown image with title', () => {
      const md = '![alt text](https://example.com/image.jpg "Image title")';
      expect(pickFirstImageFromMarkdown(md)).toBe('https://example.com/image.jpg');
    });

    it('extracts URL from markdown image with empty alt', () => {
      const md = '![](https://example.com/image.jpg)';
      expect(pickFirstImageFromMarkdown(md)).toBe('https://example.com/image.jpg');
    });

    it('extracts first image when multiple exist', () => {
      const md = '![first](first.jpg) some text ![second](second.jpg)';
      expect(pickFirstImageFromMarkdown(md)).toBe('first.jpg');
    });

    it('handles relative URLs', () => {
      const md = '![alt](./images/photo.jpg)';
      expect(pickFirstImageFromMarkdown(md)).toBe('./images/photo.jpg');
    });

    it('handles root-relative URLs', () => {
      const md = '![alt](/assets/image.png)';
      expect(pickFirstImageFromMarkdown(md)).toBe('/assets/image.png');
    });

    it('does not match URLs with spaces (not supported by regex)', () => {
      const md = '![alt](https://example.com/path with spaces.jpg)';
      // The regex doesn't match URLs with spaces
      expect(pickFirstImageFromMarkdown(md)).toBeNull();
    });

    it('handles data URLs', () => {
      const md = '![alt](data:image/png;base64,abc123)';
      expect(pickFirstImageFromMarkdown(md)).toBe('data:image/png;base64,abc123');
    });
  });

  describe('HTML image syntax', () => {
    it('extracts URL from HTML img tag with double quotes', () => {
      const md = '<img src="https://example.com/image.jpg" alt="test">';
      expect(pickFirstImageFromMarkdown(md)).toBe('https://example.com/image.jpg');
    });

    it('extracts URL from HTML img tag with single quotes', () => {
      const md = "<img src='https://example.com/image.jpg' alt='test'>";
      expect(pickFirstImageFromMarkdown(md)).toBe('https://example.com/image.jpg');
    });

    it('handles img tag with other attributes', () => {
      const md = '<img class="hero" src="image.png" width="800" height="600">';
      expect(pickFirstImageFromMarkdown(md)).toBe('image.png');
    });

    it('handles self-closing img tag', () => {
      const md = '<img src="photo.jpg" />';
      expect(pickFirstImageFromMarkdown(md)).toBe('photo.jpg');
    });

    it('handles uppercase IMG tag', () => {
      const md = '<IMG SRC="photo.jpg">';
      expect(pickFirstImageFromMarkdown(md)).toBe('photo.jpg');
    });
  });

  describe('priority and fallback', () => {
    it('prefers markdown syntax over HTML', () => {
      const md = '![markdown](md.jpg) <img src="html.jpg">';
      expect(pickFirstImageFromMarkdown(md)).toBe('md.jpg');
    });

    it('falls back to HTML when no markdown image exists', () => {
      const md = 'Some text <img src="html.jpg"> more text';
      expect(pickFirstImageFromMarkdown(md)).toBe('html.jpg');
    });
  });

  describe('no image cases', () => {
    it('returns null for plain text', () => {
      expect(pickFirstImageFromMarkdown('Just plain text')).toBeNull();
    });

    it('returns null for empty string', () => {
      expect(pickFirstImageFromMarkdown('')).toBeNull();
    });

    it('returns null for links without images', () => {
      expect(pickFirstImageFromMarkdown('[link](https://example.com)')).toBeNull();
    });

    it('returns null for malformed image syntax', () => {
      expect(pickFirstImageFromMarkdown('![missing closing paren')).toBeNull();
    });
  });
});

describe('pickCover', () => {
  it('returns cover from data if present', () => {
    const input = {
      data: { cover: 'https://example.com/cover.jpg' },
      body: '![body](body.jpg)',
    };
    expect(pickCover(input)).toBe('https://example.com/cover.jpg');
  });

  it('falls back to body image when cover is undefined', () => {
    const input = {
      data: {},
      body: '![body](body.jpg)',
    };
    expect(pickCover(input)).toBe('body.jpg');
  });

  it('returns null when cover is empty string (no fallback)', () => {
    // Note: empty string is not nullish, so ?? doesn't trigger fallback
    const input = {
      data: { cover: '' },
      body: '![body](body.jpg)',
    };
    expect(pickCover(input)).toBeNull();
  });

  it('returns null when cover is whitespace only (no fallback)', () => {
    // Note: whitespace string is not nullish, so ?? doesn't trigger fallback
    const input = {
      data: { cover: '   ' },
      body: '![body](body.jpg)',
    };
    expect(pickCover(input)).toBeNull();
  });

  it('returns null when no cover and no body image', () => {
    const input = {
      data: {},
      body: 'Just text, no image',
    };
    expect(pickCover(input)).toBeNull();
  });

  it('trims whitespace from cover URL', () => {
    const input = {
      data: { cover: '  https://example.com/cover.jpg  ' },
      body: '',
    };
    expect(pickCover(input)).toBe('https://example.com/cover.jpg');
  });

  it('does not match URLs with leading whitespace (regex excludes whitespace)', () => {
    const input = {
      data: {},
      body: '![alt](  image.jpg  )',
    };
    // Note: the regex [^\s)]+ excludes whitespace, so this doesn't match
    expect(pickCover(input)).toBeNull();
  });
});

describe('resolveMaybeRelativeUrl', () => {
  it('returns absolute URLs unchanged', () => {
    expect(resolveMaybeRelativeUrl('https://example.com/image.jpg', '/writing/test/')).toBe(
      'https://example.com/image.jpg'
    );
  });

  it('returns http URLs unchanged', () => {
    expect(resolveMaybeRelativeUrl('http://example.com/image.jpg', '/writing/test/')).toBe(
      'http://example.com/image.jpg'
    );
  });

  it('returns protocol-relative URLs unchanged', () => {
    expect(resolveMaybeRelativeUrl('//cdn.example.com/image.jpg', '/writing/test/')).toBe(
      '//cdn.example.com/image.jpg'
    );
  });

  it('returns root-relative URLs unchanged', () => {
    expect(resolveMaybeRelativeUrl('/assets/image.jpg', '/writing/test/')).toBe(
      '/assets/image.jpg'
    );
  });

  it('returns data URLs unchanged', () => {
    expect(
      resolveMaybeRelativeUrl('data:image/png;base64,abc123', '/writing/test/')
    ).toBe('data:image/png;base64,abc123');
  });

  it('resolves relative URL against basePath', () => {
    expect(resolveMaybeRelativeUrl('image.jpg', '/writing/test/')).toBe('/writing/test/image.jpg');
  });

  it('resolves relative URL with basePath without trailing slash', () => {
    expect(resolveMaybeRelativeUrl('image.jpg', '/writing/test')).toBe('/writing/test/image.jpg');
  });

  it('resolves relative URL with subdirectory', () => {
    expect(resolveMaybeRelativeUrl('./images/photo.jpg', '/writing/test/')).toBe(
      '/writing/test/images/photo.jpg'
    );
  });

  it('resolves parent directory reference', () => {
    expect(resolveMaybeRelativeUrl('../image.jpg', '/writing/test/')).toBe('/writing/image.jpg');
  });

  it('handles nested relative paths', () => {
    expect(resolveMaybeRelativeUrl('assets/img/cover.jpg', '/writing/test/')).toBe(
      '/writing/test/assets/img/cover.jpg'
    );
  });

  it('handles query strings in relative URLs (only pathname returned)', () => {
    // Note: function only returns pathname, query strings are stripped
    expect(resolveMaybeRelativeUrl('image.jpg?v=123', '/writing/test/')).toBe(
      '/writing/test/image.jpg'
    );
  });

  it('handles hash fragments in relative URLs (only pathname returned)', () => {
    // Note: function only returns pathname, hash fragments are stripped
    expect(resolveMaybeRelativeUrl('page.html#section', '/writing/test/')).toBe(
      '/writing/test/page.html'
    );
  });
});