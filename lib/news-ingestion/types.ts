import type { CategorySlug, SourceRecord } from "@/lib/types";

export type ImportedArticleCandidate = {
  title: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  externalUrl: string;
  externalId: string | null;
  publishedAt: Date;
  importanceScore: number;
  categorySlug: CategorySlug;
  source: Pick<SourceRecord, "id" | "name" | "slug" | "url">;
};

export type SourceSyncResult = {
  sourceId: number;
  sourceName: string;
  fetched: number;
  created: number;
  updated: number;
  skipped: number;
  errors: string[];
};
