import { defineCollection, z } from 'astro:content';

const tutorials = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    author: z.string().default('Kiang'),
    tags: z.array(z.string()).default([]),
    order: z.number().default(99),
    draft: z.boolean().default(false),
  }),
});

const docs = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    source: z.string().url(),
    sourceUpdated: z.coerce.date(),
    category: z.enum(['intro', 'primitives', 'concepts', 'patterns', 'sdk', 'cookbook', 'rules', 'reference']),
    order: z.number().default(99),
  }),
});

const cookbooks = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    source: z.string().url(),
    sourceUpdated: z.coerce.date(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('intermediate'),
    tags: z.array(z.string()).default([]),
    primaryQuestion: z.enum(['Choice', 'Score', 'Noul']).default('Choice'),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    author: z.string(),
    authorUrl: z.string().url().optional(),
    publisher: z.string(),
    publisherUrl: z.string().url().optional(),
    pubDate: z.coerce.date(),
    description: z.string(),
    category: z.enum(['tutorial', 'analysis', 'benchmark', 'experiment', 'critique', 'news']),
    language: z.enum(['zh', 'en', 'ja']).default('en'),
    tags: z.array(z.string()).default([]),
  }),
});

const faqs = defineCollection({
  type: 'content',
  schema: z.object({
    question: z.string(),
    answer: z.string(),
    category: z.enum(['general', 'pricing', 'sdk', 'limits', 'training', 'comparison']).default('general'),
    order: z.number().default(99),
  }),
});

const glossary = defineCollection({
  type: 'content',
  schema: z.object({
    term: z.string(),
    aliases: z.array(z.string()).default([]),
    category: z.string().default('general'),
    short: z.string(),
  }),
});

const versions = defineCollection({
  type: 'content',
  schema: z.object({
    version: z.string(),
    releaseDate: z.coerce.date(),
    summary: z.string(),
    highlights: z.array(z.string()).default([]),
    knownIssues: z.array(z.string()).default([]),
  }),
});

export const collections = { tutorials, docs, cookbooks, articles, faqs, glossary, versions };
