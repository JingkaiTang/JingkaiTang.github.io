import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

function normalizeTag(input: string) {
  return input.trim().toLowerCase();
}

const tagsSchema = z.preprocess((val) => {
  if (Array.isArray(val)) {
    return val.map((t) => (typeof t === 'string' ? normalizeTag(t) : '')).filter(Boolean);
  }
  if (typeof val === 'string') {
    return val
      .split(',')
      .map((t) => normalizeTag(t))
      .filter(Boolean);
  }
  return [];
}, z.array(z.string()).default([]));

const baseSchema = z.object({
  title: z.string(),
  description: z.string().optional(),
  pubDate: z.coerce.date(),
  updatedDate: z.coerce.date().optional(),
  tags: tagsSchema,
  draft: z.boolean().default(false),

  // Preview image for list/OG (preferred)
  cover: z.string().optional(),

  // Authorship
  by: z
    .object({
      role: z.enum(['owner', 'assistant', 'coauthored']),
      name: z.string(),
      note: z.string().optional(),
    })
    .optional(),

  // Source / attribution
  source: z
    .object({
      kind: z.enum(['original', 'repost', 'translation', 'notes']).default('original'),
      title: z.string().optional(),
      url: z.string().url().optional(),
      author: z.string().optional(),
      license: z.string().optional(),
      accessedAt: z.string().optional(),
    })
    .optional(),
});

// Writing collection - blog posts
const writing = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/writing' }),
  schema: baseSchema,
});

// Now collection - short updates
const now = defineCollection({
  loader: glob({ pattern: '**/index.md', base: './src/content/now' }),
  schema: baseSchema,
});

export const collections = {
  writing,
  now,
};