import { z } from "zod";

const categorySlugSchema = z.enum(["crypto", "finance", "macro", "markets", "breaking"]);

export const sourceSchema = z.object({
  name: z.string().min(2),
  slug: z.string().min(2),
  url: z.url(),
  description: z.string().max(240).nullable().optional(),
  kind: z.enum(["manual", "rss", "api"]).optional(),
  feedUrl: z.url().nullable().optional().or(z.literal("")),
  categorySlug: categorySlugSchema.nullable().optional(),
  priority: z.number().int().min(1).max(999).optional(),
  pollIntervalMinutes: z.number().int().min(5).max(1440).optional(),
  configJson: z.record(z.string(), z.unknown()).nullable().optional(),
  isActive: z.boolean().optional()
});

export const articleSchema = z.object({
  title: z.string().min(8),
  slug: z.string().min(4),
  excerpt: z.string().min(20).max(240),
  content: z.string().min(80),
  coverImage: z.url().nullable().optional().or(z.literal("")),
  externalUrl: z.url().nullable().optional().or(z.literal("")),
  externalId: z.string().max(200).nullable().optional().or(z.literal("")),
  origin: z.enum(["manual", "imported"]).optional(),
  isFeatured: z.boolean().optional(),
  isPublished: z.boolean().optional(),
  isArchived: z.boolean().optional(),
  importanceScore: z.number().int().min(0).max(100).optional(),
  publishedAt: z.iso.datetime(),
  fetchedAt: z.iso.datetime().nullable().optional(),
  sourceId: z.number().int().positive(),
  categoryId: z.number().int().positive()
});
