import type { Source } from "@prisma/client";

import { fetchSourceArticles } from "@/lib/news-ingestion/fetchers";
import { buildImportedSlug } from "@/lib/news-ingestion/helpers";
import { shouldSyncSourceNow } from "@/lib/news-ingestion/source-timing";
import { prisma } from "@/lib/prisma";
import type { CategorySlug, SourceRecord } from "@/lib/types";
import type { SourceSyncResult } from "@/lib/news-ingestion/types";

function normalizeSource(source: Source): SourceRecord {
  return {
    ...source,
    categorySlug: (source.categorySlug as CategorySlug | null) ?? null,
    configJson:
      source.configJson && typeof source.configJson === "object" && !Array.isArray(source.configJson)
        ? (source.configJson as Record<string, unknown>)
        : null
  };
}

async function getCategoryIdBySlug(slug: CategorySlug) {
  const category = await prisma.category.findUnique({
    where: { slug },
    select: { id: true }
  });

  if (!category) {
    throw new Error(`Category "${slug}" is missing`);
  }

  return category.id;
}

async function createOrUpdateImportedArticle(source: SourceRecord, item: Awaited<ReturnType<typeof fetchSourceArticles>>[number]) {
  const categoryId = await getCategoryIdBySlug(item.categorySlug);
  const slug = buildImportedSlug(item.title, item.publishedAt, source.slug);

  const existing =
    (item.externalId
      ? await prisma.article.findUnique({
          where: {
            sourceId_externalId: {
              sourceId: source.id,
              externalId: item.externalId
            }
          }
        }).catch(() => null)
      : null) ??
    (await prisma.article.findFirst({
      where: {
        sourceId: source.id,
        externalUrl: item.externalUrl
      }
    }));

  if (existing) {
    await prisma.article.update({
      where: { id: existing.id },
      data: {
        title: item.title,
        excerpt: item.excerpt,
        content: item.content,
        coverImage: item.coverImage,
        externalUrl: item.externalUrl,
        categoryId,
        isFeatured: item.importanceScore >= 90,
        importanceScore: item.importanceScore,
        publishedAt: item.publishedAt,
        fetchedAt: new Date(),
        isPublished: true,
        isArchived: false
      }
    });

    return "updated" as const;
  }

  await prisma.article.create({
    data: {
      title: item.title,
      slug,
      excerpt: item.excerpt,
      content: item.content,
      coverImage: item.coverImage,
      externalUrl: item.externalUrl,
      externalId: item.externalId,
      origin: "imported",
      isFeatured: item.importanceScore >= 90,
      isPublished: true,
      isArchived: false,
      importanceScore: item.importanceScore,
      publishedAt: item.publishedAt,
      fetchedAt: new Date(),
      categoryId,
      sourceId: source.id
    }
  });

  return "created" as const;
}

export async function syncSourceById(sourceId: number, options?: { force?: boolean }): Promise<SourceSyncResult> {
  const rawSource = await prisma.source.findUnique({
    where: { id: sourceId }
  });

  if (!rawSource) {
    throw new Error(`Source ${sourceId} not found`);
  }

  const source = normalizeSource(rawSource);
  const result: SourceSyncResult = {
    sourceId: source.id,
    sourceName: source.name,
    fetched: 0,
    created: 0,
    updated: 0,
    skipped: 0,
    errors: []
  };

  if (!source.isActive || source.kind === "manual") {
    result.skipped = 1;
    return result;
  }

  if (!options?.force && !shouldSyncSourceNow(source.lastFetchedAt, source.pollIntervalMinutes)) {
    result.skipped = 1;
    return result;
  }

  try {
    const items = await fetchSourceArticles(source);
    result.fetched = items.length;

    for (const item of items) {
      try {
        const mode = await createOrUpdateImportedArticle(source, item);
        result[mode] += 1;
      } catch (error) {
        result.errors.push(error instanceof Error ? error.message : "Unknown article save error");
      }
    }

    await prisma.source.update({
      where: { id: source.id },
      data: {
        lastFetchedAt: new Date(),
        lastError: result.errors.length > 0 ? result.errors.join(" | ").slice(0, 400) : null
      }
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown sync error";
    result.errors.push(message);

    await prisma.source.update({
      where: { id: source.id },
      data: {
        lastFetchedAt: new Date(),
        lastError: message
      }
    });
  }

  return result;
}

export async function syncAllSources(options?: { force?: boolean }) {
  const rawSources = await prisma.source.findMany({
    where: { isActive: true },
    orderBy: [{ priority: "asc" }, { id: "asc" }]
  });

  const results: SourceSyncResult[] = [];
  for (const source of rawSources) {
    results.push(await syncSourceById(source.id, options));
  }

  return {
    syncedAt: new Date().toISOString(),
    sources: results,
    totals: results.reduce(
      (acc, item) => {
        acc.fetched += item.fetched;
        acc.created += item.created;
        acc.updated += item.updated;
        acc.skipped += item.skipped;
        acc.errors += item.errors.length;
        return acc;
      },
      { fetched: 0, created: 0, updated: 0, skipped: 0, errors: 0 }
    )
  };
}

export async function syncDueSources() {
  return syncAllSources({ force: false });
}

export async function getImportedArticlesCount() {
  return prisma.article.count({
    where: {
      origin: "imported",
      isPublished: true,
      isArchived: false
    }
  });
}
