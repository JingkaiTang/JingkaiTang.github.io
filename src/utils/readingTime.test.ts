import { describe, it, expect } from 'vitest';
import { calculateReadingTime } from './readingTime';

describe('calculateReadingTime', () => {
  it('should count Chinese characters correctly', () => {
    const result = calculateReadingTime('你好世界');
    expect(result.words).toBe(4);
    expect(result.minutes).toBe(1);
  });

  it('should count English words correctly', () => {
    const result = calculateReadingTime('Hello world test');
    expect(result.words).toBe(3);
    expect(result.minutes).toBe(1);
  });

  it('should handle mixed content', () => {
    const result = calculateReadingTime('你好 Hello 世界 world');
    expect(result.words).toBe(6);
  });

  it('should calculate reading time for longer content', () => {
    // 400 Chinese characters should be ~2 minutes
    const longText = '你'.repeat(400);
    const result = calculateReadingTime(longText);
    expect(result.words).toBe(400);
    expect(result.minutes).toBe(2);
  });

  it('should return at least 1 minute', () => {
    const result = calculateReadingTime('');
    expect(result.words).toBe(0);
    expect(result.minutes).toBe(1);
  });

  it('should ignore HTML tags', () => {
    const result = calculateReadingTime('<p>Hello</p> <div>World</div>');
    expect(result.words).toBe(2);
  });
});
