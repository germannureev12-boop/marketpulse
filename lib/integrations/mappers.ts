import type { ArticleRecord, CategorySlug, CryptoRecord } from "@/lib/types";
import { slugify } from "@/lib/utils";

const categoryMeta: Record<CategorySlug, { id: number; name: string }> = {
  crypto: { id: 1, name: "Crypto" },
  finance: { id: 2, name: "Finance" },
  macro: { id: 3, name: "Macro" },
  markets: { id: 4, name: "Markets" },
  breaking: { id: 5, name: "Breaking" }
};

const coinMeta = [
  {
    apiId: "bitcoin",
    productId: "BTC-USD",
    binanceSymbol: "BTCUSDT",
    symbol: "BTC",
    name: "Bitcoin",
    fallbackMarketCap: "$2.10T"
  },
  {
    apiId: "ethereum",
    productId: "ETH-USD",
    binanceSymbol: "ETHUSDT",
    symbol: "ETH",
    name: "Ethereum",
    fallbackMarketCap: "$720B"
  },
  {
    apiId: "solana",
    productId: "SOL-USD",
    binanceSymbol: "SOLUSDT",
    symbol: "SOL",
    name: "Solana",
    fallbackMarketCap: "$112B"
  }
] as const;

function formatCompactCurrency(value: number) {
  if (value >= 1_000_000_000_000) {
    return `$${(value / 1_000_000_000_000).toFixed(2)}T`;
  }

  if (value >= 1_000_000_000) {
    return `$${(value / 1_000_000_000).toFixed(0)}B`;
  }

  if (value >= 1_000_000) {
    return `$${(value / 1_000_000).toFixed(0)}M`;
  }

  return `$${value.toFixed(0)}`;
}

export function mapNewsCategoryQuery(category: CategorySlug) {
  switch (category) {
    case "crypto":
      return "crypto OR bitcoin OR ethereum OR solana";
    case "finance":
      return "banking OR finance OR earnings OR credit";
    case "macro":
      return "inflation OR federal reserve OR rates OR economy";
    case "markets":
      return "stocks OR bonds OR markets OR equities";
    case "breaking":
      return "breaking markets OR urgent crypto OR market shock";
    default:
      return "markets";
  }
}

type GNewsArticle = {
  title: string;
  description?: string | null;
  content?: string | null;
  url: string;
  image?: string | null;
  publishedAt: string;
  source: {
    name: string;
    url: string;
  };
};

export function mapGNewsArticle(article: GNewsArticle, category: CategorySlug, id: number): ArticleRecord {
  const categoryInfo = categoryMeta[category];
  const publishedAt = new Date(article.publishedAt);
  const safeTitle = article.title?.trim() || "Untitled market update";
  const summary = article.description?.trim() || article.content?.trim() || "Open the source story for full coverage.";
  const body = article.content?.trim() || article.description?.trim() || summary;
  const slugSuffix = Number.isNaN(publishedAt.getTime()) ? id : publishedAt.getTime();

  return {
    id,
    title: safeTitle,
    slug: `${slugify(safeTitle)}-${slugSuffix}`,
    excerpt: summary,
    content: body,
    coverImage: article.image ?? null,
    externalUrl: article.url,
    externalId: article.url,
    origin: "imported",
    isFeatured: id === 1,
    isPublished: true,
    isArchived: false,
    importanceScore: id === 1 ? 92 : 74,
    publishedAt,
    fetchedAt: publishedAt,
    createdAt: publishedAt,
    updatedAt: publishedAt,
    sourceId: id,
    categoryId: categoryInfo.id,
    category: {
      id: categoryInfo.id,
      name: categoryInfo.name,
      slug: category
    },
    source: {
      id,
      name: article.source.name,
      slug: slugify(article.source.name),
      url: article.source.url
    }
  };
}

type CoinGeckoEntry = {
  usd?: number;
  usd_market_cap?: number;
  usd_24h_change?: number | null;
  last_updated_at?: number;
};

export function mapCoinGeckoPrices(
  payload: Record<string, CoinGeckoEntry>,
  fallbackDate = new Date()
): CryptoRecord[] {
  return coinMeta
    .map((coin, index) => {
      const item = payload[coin.apiId];
      if (!item?.usd) {
        return null;
      }

      const recordedAt = item.last_updated_at ? new Date(item.last_updated_at * 1000) : fallbackDate;
      return {
        id: index + 1,
        symbol: coin.symbol,
        name: coin.name,
        price: item.usd,
        change24h: item.usd_24h_change ?? 0,
        marketCap: formatCompactCurrency(item.usd_market_cap ?? 0),
        recordedAt
      } satisfies CryptoRecord;
    })
    .filter((item): item is CryptoRecord => Boolean(item));
}

type CoinbaseTickerEntry = {
  price?: string;
  time?: string;
};

type CoinbaseStatsEntry = {
  open?: string;
};

export function mapCoinbasePrices(
  payload: Record<string, { ticker?: CoinbaseTickerEntry; stats?: CoinbaseStatsEntry }>,
  fallbackDate = new Date()
): CryptoRecord[] {
  return coinMeta
    .map((coin, index) => {
      const item = payload[coin.symbol];
      const price = Number(item?.ticker?.price ?? NaN);
      if (Number.isNaN(price) || price <= 0) {
        return null;
      }

      const open = Number(item?.stats?.open ?? NaN);
      const change24h = !Number.isNaN(open) && open > 0 ? ((price - open) / open) * 100 : 0;
      const recordedAt = item?.ticker?.time ? new Date(item.ticker.time) : fallbackDate;

      return {
        id: index + 1,
        symbol: coin.symbol,
        name: coin.name,
        price,
        change24h,
        marketCap: coin.fallbackMarketCap,
        recordedAt
      } satisfies CryptoRecord;
    })
    .filter((item): item is CryptoRecord => Boolean(item));
}

type BinanceTickerEntry = {
  lastPrice?: string;
  priceChangePercent?: string;
  closeTime?: number;
};

export function mapBinancePrices(
  payload: Record<string, BinanceTickerEntry>,
  fallbackDate = new Date()
): CryptoRecord[] {
  return coinMeta
    .map((coin, index) => {
      const item = payload[coin.binanceSymbol];
      const price = Number(item?.lastPrice ?? NaN);
      if (Number.isNaN(price) || price <= 0) {
        return null;
      }

      const change24h = Number(item?.priceChangePercent ?? 0);
      const recordedAt = item?.closeTime ? new Date(item.closeTime) : fallbackDate;

      return {
        id: index + 1,
        symbol: coin.symbol,
        name: coin.name,
        price,
        change24h: Number.isNaN(change24h) ? 0 : change24h,
        marketCap: coin.fallbackMarketCap,
        recordedAt
      } satisfies CryptoRecord;
    })
    .filter((item): item is CryptoRecord => Boolean(item));
}
