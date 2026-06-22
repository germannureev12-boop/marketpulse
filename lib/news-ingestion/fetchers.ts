import type { CategorySlug, SourceRecord } from "@/lib/types";

import { fetchLiveNews, hasGNewsKey } from "@/lib/integrations/gnews";
import { clampImportance, dedupeImportedArticles, parseRssItems, resolveCategorySlug } from "@/lib/news-ingestion/helpers";
import type { ImportedArticleCandidate } from "@/lib/news-ingestion/types";

function toSourceRef(source: SourceRecord) {
  return {
    id: source.id,
    name: source.name,
    slug: source.slug,
    url: source.url
  } as const;
}

async function fetchRssSource(source: SourceRecord): Promise<ImportedArticleCandidate[]> {
  if (!source.feedUrl) {
    throw new Error("RSS source is missing feedUrl");
  }

  const response = await fetch(source.feedUrl, {
    headers: {
      accept: "application/rss+xml, application/xml, text/xml"
    },
    next: {
      revalidate: Math.max(300, source.pollIntervalMinutes * 60)
    }
  });

  if (!response.ok) {
    throw new Error(`RSS request failed with status ${response.status}`);
  }

  const xml = await response.text();

  return dedupeImportedArticles(
    parseRssItems(xml)
      .filter((item) => item.externalUrl)
      .map((item) => {
        const categorySlug = resolveCategorySlug(source, item.title, item.excerpt);

        return {
          ...item,
          categorySlug,
          importanceScore: clampImportance({
            title: item.title,
            categorySlug,
            publishedAt: item.publishedAt
          }),
          source: toSourceRef(source)
        };
      })
  );
}

async function fetchApiSource(source: SourceRecord): Promise<ImportedArticleCandidate[]> {
  const provider = typeof source.configJson?.provider === "string" ? source.configJson.provider : null;

  if (provider === "gnews" || source.slug === "gnews-wire") {
    if (!hasGNewsKey()) {
      return [];
    }

    const category = source.categorySlug ?? undefined;
    const articles = await fetchLiveNews(category);

    return dedupeImportedArticles(
  articles.map((article) => ({
    title: article.title,
    excerpt: article.excerpt,
    content: article.content,
    coverImage: article.coverImage,
    externalUrl: article.externalUrl ?? article.source.url,
    externalId: article.externalUrl ?? article.slug,
    publishedAt: new Date(article.publishedAt),
    importanceScore: article.importanceScore,
    categorySlug: article.category.slug as CategorySlug,
    source: toSourceRef(source)
  }))
);
  }

  throw new Error(`Unsupported API provider for source ${source.slug}`);
}

export async function fetchSourceArticles(source: SourceRecord) {
  if (source.kind === "rss") {
    return fetchRssSource(source);
  }

  if (source.kind === "api") {
    return fetchApiSource(source);
  }

  return [];
}
