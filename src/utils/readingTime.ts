/**
 * Calculate reading time for content
 * Based on average reading speed: ~200 Chinese characters per minute
 */

export function calculateReadingTime(content: string): { words: number; minutes: number } {
  // Remove HTML tags and extra whitespace
  const text = content
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  // Count Chinese characters and words
  // Chinese characters count as 1 word each
  // English words are counted by splitting on whitespace
  const chineseChars = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const englishWords = (text.match(/[a-zA-Z0-9]+/g) || []).length;

  const totalWords = chineseChars + englishWords;

  // Average reading speed: 200 characters/words per minute
  const minutes = Math.ceil(totalWords / 200);

  return {
    words: totalWords,
    minutes: Math.max(1, minutes), // At least 1 minute
  };
}
