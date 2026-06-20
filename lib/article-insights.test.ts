import { describe, expect, it } from "vitest";

import { buildArticleImpactLabels, getArticleAssetSignals } from "./article-insights";
import type { ArticleRecord } from "./types";

const article = {
  id: 1,
  title: "Breaking: Bitcoin and Ethereum rally as Fed signals softer path",
  slug: "test",
  excerpt: "BTC and ETH jump while macro traders reprice rates.",
  content: "BTC ETH macro",
  coverImage: null,
  externalUrl: null,
  externalId: null,
  origin: "imported",
  isFeatured: true,
  isPublished: true,
  isArchived: false,
  importanceScore: 92,
  publishedAt: new Date("2026-06-21T00:00:00Z"),
  fetchedAt: null,
  createdAt: new Date("2026-06-21T00:00:00Z"),
  updatedAt: new Date("2026-06-21T00:00:00Z"),
  sourceId: 1,
  categoryId: 1,
  category: { id: 1, name: "Breaking", slug: "breaking" },
  source: { id: 1, name: "Feed", slug: "feed", url: "https://example.com" }
} satisfies ArticleRecord;

describe("article insights", () => {
  it("builds impact labels from article content and priority", () => {
    const labels = buildArticleImpactLabels(article).map((item) => item.label);
    expect(labels).toContain("Breaking");
    expect(labels).toContain("High impact");
    expect(labels).toContain("BTC");
    expect(labels).toContain("ETH");
    expect(labels).toContain("Macro");
  });

  it("extracts asset signals for related news linking", () => {
    expect(getArticleAssetSignals(article)).toEqual(expect.arrayContaining(["btc", "eth"]));
  });
});
