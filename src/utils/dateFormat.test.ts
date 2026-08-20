import { describe, it, expect } from 'vitest';
import { formatShanghai, formatShanghaiDate } from './dateFormat';

describe('formatShanghai', () => {
  it('formats a date in Asia/Shanghai timezone with seconds by default', () => {
    // Create a date that would be 2024-01-15 08:30:45 in Shanghai (UTC+8)
    // UTC time would be 2024-01-15 00:30:45
    const date = new Date('2024-01-15T00:30:45Z');
    const result = formatShanghai(date);
    expect(result).toBe('2024-01-15 08:30:45');
  });

  it('formats a date without seconds when withSeconds is false', () => {
    const date = new Date('2024-01-15T00:30:45Z');
    const result = formatShanghai(date, { withSeconds: false });
    expect(result).toBe('2024-01-15 08:30');
  });

  it('formats a date with seconds when withSeconds is true', () => {
    const date = new Date('2024-01-15T00:30:45Z');
    const result = formatShanghai(date, { withSeconds: true });
    expect(result).toBe('2024-01-15 08:30:45');
  });

  it('handles midnight correctly', () => {
    // UTC: 2024-06-20 16:00:00 -> Shanghai: 2024-06-21 00:00:00
    const date = new Date('2024-06-20T16:00:00Z');
    const result = formatShanghai(date);
    expect(result).toBe('2024-06-21 00:00:00');
  });

  it('handles end of day correctly', () => {
    // UTC: 2024-06-20 15:59:59 -> Shanghai: 2024-06-20 23:59:59
    const date = new Date('2024-06-20T15:59:59Z');
    const result = formatShanghai(date);
    expect(result).toBe('2024-06-20 23:59:59');
  });

  it('handles year boundary correctly', () => {
    // UTC: 2024-12-31 16:00:00 -> Shanghai: 2025-01-01 00:00:00
    const date = new Date('2024-12-31T16:00:00Z');
    const result = formatShanghai(date);
    expect(result).toBe('2025-01-01 00:00:00');
  });

  it('handles leap day correctly', () => {
    // UTC: 2024-02-28 16:00:00 -> Shanghai: 2024-02-29 00:00:00 (2024 is leap year)
    const date = new Date('2024-02-28T16:00:00Z');
    const result = formatShanghai(date);
    expect(result).toBe('2024-02-29 00:00:00');
  });

  it('pads single digits with zeros', () => {
    // UTC: 2024-01-01 00:01:05 -> Shanghai: 2024-01-01 08:01:05
    const date = new Date('2024-01-01T00:01:05Z');
    const result = formatShanghai(date);
    expect(result).toBe('2024-01-01 08:01:05');
  });

  it('handles current date', () => {
    const now = new Date();
    const result = formatShanghai(now);
    // Result should match pattern: YYYY-MM-DD HH:MM:SS
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });

  it('handles date in DST transition period', () => {
    // Shanghai doesn't observe DST, but test edge cases anyway
    const date = new Date('2024-03-10T10:30:00Z');
    const result = formatShanghai(date);
    expect(result).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/);
  });
});

describe('formatShanghaiDate', () => {
  it('formats a date-only value using the Shanghai calendar day', () => {
    const date = new Date('2024-06-20T16:00:00Z');
    expect(formatShanghaiDate(date)).toBe('2024-06-21');
  });
});
