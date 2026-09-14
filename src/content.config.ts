import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const changelog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/changelog' }),
  schema: z.object({
    title: z.any().optional().nullable(),
    date: z.any().optional().nullable(),
    version: z.any().optional().nullable(),
    type: z.any().optional().nullable(),
    description: z.any().optional().nullable(),
    added: z.any().optional().nullable(),
    improved: z.any().optional().nullable(),
    fixed: z.any().optional().nullable(),
    removed: z.any().optional().nullable(),
  }).passthrough(),
});

const diary = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/diary' }),
  schema: z.object({
    title: z.string().optional(),
    date: z.any().optional(),
    coverImage: z.string().optional(),
    tags: z.array(z.string()).optional().default([]),
  }).passthrough(),
});

export const collections = { changelog, diary };

