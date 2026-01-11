import { defineCollection, z } from "astro:content";

const changelog = defineCollection({
  type: "content",
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    version: z.string(),
    type: z.enum(["major", "minor", "patch"]),
    description: z.string().optional(),
    added: z.array(z.string()).optional(),
    improved: z.array(z.string()).optional(),
    fixed: z.array(z.string()).optional(),
    removed: z.array(z.string()).optional(),
  }),
});

export const collections = { changelog };
