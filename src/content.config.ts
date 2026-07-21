import { defineCollection, z } from 'astro:content';

const pages = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string().optional(),
    pageType: z.enum(['home', 'services', 'about']).optional(),
    category: z.enum(['home', 'business']).optional(),
    priceFrom: z.number().nullable().optional(),
    featured: z.boolean().optional(),
  }),
});

const articles = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
  }),
});

const legal = defineCollection({
  type: 'content',
  schema: z.object({
    title: z.string(),
    description: z.string(),
    slug: z.string(),
  }),
});

export const collections = { pages, articles, legal };
