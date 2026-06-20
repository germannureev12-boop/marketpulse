import type { Prisma } from "@prisma/client";

import { fallbackArticles, fallbackCrypto, fallbackSources, fallbackSummary } from "@/lib/fallback-data";
import { getArticleAssetSignals } from "@/lib/article-insights";
import { fetchLiveCryptoPrices } from "@/lib/integrations/coingecko";
import { prisma } from "@/lib/prisma";
import type { ArticleRecord, CategorySlug, CryptoRecord, MarketSymbol, SiteStatusRecord, SourceRecord, SummaryRecord } from "@/lib/types";

const articleInclude = {
  category: true,
  source: true
} satisfies Prisma.ArticleInclude;

const categorySlugs = new Set<CategorySlug>(["crypto", "finance", "macro", "markets", "breaking"]);

function isCategorySlug(value: string): value is CategorySlug {
  return categorySlugs.has(value as CategorySlug);
}

function normalizeArticle(article: Prisma.ArticleGetPayload<{ include: typeof articleInclude }>): ArticleRecord {
  return {
    ...article,
    category: {
      id: article.category.id,
      name: article.category.name,
      slug: article.category.slug
    },
    source: {
      id: article.source.id,
      name: article.source.name,
      slug: article.source.slug,
      url: article.source.url
    }
  };
}

function normalizeCrypto(snapshot: {
  id: number;
  symbol: string;
  name: string;
  price: { toNumber(): number };
  change24h: { toNumber(): number };
  marketCap: string;
  recordedAt: Date;
}): CryptoRecord {
  return {
    id: snapshot.id,
    symbol: snapshot.symbol,
    name: snapshot.name,
    price: snapshot.price.toNumber(),
    change24h: snapshot.change24h.toNumber(),
    marketCap: snapshot.marketCap,
    recordedAt: snapshot.recordedAt
  };
}

export async function getHomepageData() {
  const liveCryptoPromise = fetchLiveCryptoPrices();

  try {
    const [articles, latestSnapshots, summary, liveCrypto] = await Promise.all([
      prisma.article.findMany({
        include: articleInclude,
        where: {
          isPublished: true,
          isArchived: false
        },
        orderBy: [{ publishedAt: "desc" }, { importanceScore: "desc" }],
        take: 12
      }),
      prisma.cryptoSnapshot.findMany({
        orderBy: { recordedAt: "desc" }
      }),
      prisma.dailySummary.findFirst({
        orderBy: { summaryDate: "desc" }
      }),
      liveCryptoPromise.catch(() => null)
    ]);

    const snapshotsBySymbol = new Map<string, CryptoRecord>();
    for (const snapshot of latestSnapshots) {
      if (!snapshotsBySymbol.has(snapshot.symbol)) {
        snapshotsBySymbol.set(snapshot.symbol, normalizeCrypto(snapshot));
      }
    }

    return {
      articles: articles.length > 0 ? articles.map(normalizeArticle) : fallbackArticles,
      crypto:
        liveCrypto && liveCrypto.length > 0
          ? liveCrypto
          : Array.from(snapshotsBySymbol.values()).filter((item) => ["BTC", "ETH", "SOL"].includes(item.symbol)),
      summary: summary ?? fallbackSummary
    };
  } catch {
    const liveCrypto = await liveCryptoPromise.catch(() => null);

    return {
      articles: fallbackArticles,
      crypto: liveCrypto && liveCrypto.length > 0 ? liveCrypto : fallbackCrypto,
      summary: fallbackSummary
    };
  }
}

export async function getCategories() {
  try {
    return await prisma.category.findMany({
      orderBy: { id: "asc" }
    });
  } catch {
    return [
      { id: 1, name: "Crypto", slug: "crypto", createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: "Finance", slug: "finance", createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: "Macro", slug: "macro", createdAt: new Date(), updatedAt: new Date() },
      { id: 4, name: "Markets", slug: "markets", createdAt: new Date(), updatedAt: new Date() },
      { id: 5, name: "Breaking", slug: "breaking", createdAt: new Date(), updatedAt: new Date() }
    ];
  }
}

export async function getArticles(category?: string) {
  try {
    const articles = await prisma.article.findMany({
      include: articleInclude,
      where: {
        ...(category && isCategorySlug(category) ? { category: { slug: category } } : {}),
        isPublished: true,
        isArchived: false
      },
      orderBy: [{ publishedAt: "desc" }, { importanceScore: "desc" }]
    });

    return articles.length > 0
      ? articles.map(normalizeArticle)
      : category
        ? fallbackArticles.filter((article) => article.category.slug === category)
        : fallbackArticles;
  } catch {
    return category
      ? fallbackArticles.filter((article) => article.category.slug === category)
      : fallbackArticles;
  }
}

export async function getArticleBySlug(slug: string) {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: articleInclude
    });

    return article ? normalizeArticle(article) : null;
  } catch {
    return fallbackArticles.find((article) => article.slug === slug) ?? null;
  }
}

export async function getRelatedArticles(categorySlug: string, excludeSlug: string) {
  const articles = await getArticles(categorySlug);
  return articles.filter((article) => article.slug !== excludeSlug).slice(0, 3);
}

export async function getBreakingTickerArticles(limit = 8) {
  const articles = await getArticles();
  return articles
    .filter((article) => article.category.slug === "breaking" || article.importanceScore >= 80)
    .slice(0, limit);
}

export async function getAssetLinkedNews(symbol: MarketSymbol, limit = 4) {
  try {
    const articles = await prisma.article.findMany({
      include: articleInclude,
      where: {
        isPublished: true,
        isArchived: false
      },
      orderBy: [{ publishedAt: "desc" }, { importanceScore: "desc" }],
      take: 40
    });

    const matched = articles
      .map(normalizeArticle)
      .filter((article) => getArticleAssetSignals(article).includes(symbol))
      .slice(0, limit);

    if (matched.length > 0) {
      return matched;
    }
  } catch {
    // Fall back to headline heuristics below.
  }

  const fallbackSymbolLabel = symbol.toUpperCase();
  return fallbackArticles.filter((article) => `${article.title} ${article.excerpt}`.includes(fallbackSymbolLabel)).slice(0, limit);
}

export async function getSources(): Promise<SourceRecord[]> {
  try {
    const sources = await prisma.source.findMany({
      orderBy: [{ isActive: "desc" }, { priority: "asc" }, { name: "asc" }]
    });

    return sources.map((source) => ({
      ...source,
      categorySlug: (source.categorySlug as CategorySlug | null) ?? null,
      configJson:
        source.configJson && typeof source.configJson === "object" && !Array.isArray(source.configJson)
          ? (source.configJson as Record<string, unknown>)
          : null
    }));
  } catch {
    return fallbackSources;
  }
}

export async function getCryptoSnapshots() {
  try {
    const liveCrypto = await fetchLiveCryptoPrices();
    if (liveCrypto.length > 0) {
      return liveCrypto;
    }
  } catch {
    // Fall through to persisted snapshots or local fallback data.
  }

  try {
    const snapshots = await prisma.cryptoSnapshot.findMany({
      orderBy: { recordedAt: "desc" }
    });

    const latest = new Map<string, CryptoRecord>();
    for (const snapshot of snapshots) {
      if (!latest.has(snapshot.symbol)) {
        latest.set(snapshot.symbol, normalizeCrypto(snapshot));
      }
    }
    return Array.from(latest.values()).filter((item) => ["BTC", "ETH", "SOL"].includes(item.symbol));
  } catch {
    return fallbackCrypto;
  }
}

export async function getTodaySummary(): Promise<SummaryRecord> {
  try {
    return (
      (await prisma.dailySummary.findFirst({
        orderBy: { summaryDate: "desc" }
      })) ?? fallbackSummary
    );
  } catch {
    return fallbackSummary;
  }
}

export async function getSiteStatus(): Promise<SiteStatusRecord> {
  try {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const [latestSource, importedToday, activeSources, latestSnapshot] = await Promise.all([
      prisma.source.findFirst({
        where: {
          isActive: true,
          kind: {
            not: "manual"
          },
          lastFetchedAt: {
            not: null
          }
        },
        orderBy: {
          lastFetchedAt: "desc"
        },
        select: {
          lastFetchedAt: true
        }
      }),
      prisma.article.count({
        where: {
          origin: "imported",
          createdAt: {
            gte: startOfToday
          }
        }
      }),
      prisma.source.count({
        where: {
          isActive: true
        }
      }),
      prisma.cryptoSnapshot.findFirst({
        orderBy: {
          recordedAt: "desc"
        },
        select: {
          recordedAt: true
        }
      })
    ]);

    const ageMs = latestSnapshot ? Date.now() - latestSnapshot.recordedAt.getTime() : Number.POSITIVE_INFINITY;
    const marketStatus = ageMs < 60_000 ? "Live" : ageMs < 10 * 60_000 ? "Delayed" : "Fallback";

    return {
      lastNewsRefresh: latestSource?.lastFetchedAt ?? null,
      importedToday,
      activeSources,
      marketStatus
    };
  } catch {
    return {
      lastNewsRefresh: null,
      importedToday: 0,
      activeSources: fallbackSources.filter((source) => source.isActive).length,
      marketStatus: "Fallback"
    };
  }
}
