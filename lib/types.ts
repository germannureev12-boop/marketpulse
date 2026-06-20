export type CategorySlug = "crypto" | "finance" | "macro" | "markets" | "breaking";
export type SourceKind = "manual" | "rss" | "api";
export type ArticleOrigin = "manual" | "imported";

export type SourceRecord = {
  id: number;
  name: string;
  slug: string;
  url: string;
  description: string | null;
  kind: SourceKind;
  feedUrl: string | null;
  categorySlug: CategorySlug | null;
  priority: number;
  pollIntervalMinutes: number;
  lastFetchedAt: Date | null;
  lastError: string | null;
  configJson: Record<string, unknown> | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type ArticleRecord = {
  id: number;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string | null;
  externalUrl: string | null;
  externalId: string | null;
  origin: ArticleOrigin;
  isFeatured: boolean;
  isPublished: boolean;
  isArchived: boolean;
  importanceScore: number;
  publishedAt: Date;
  fetchedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  sourceId: number;
  categoryId: number;
  category: {
    id: number;
    name: string;
    slug: string;
  };
  source: {
    id: number;
    name: string;
    slug: string;
    url: string;
  };
};

export type CryptoRecord = {
  id: number;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: string;
  recordedAt: Date;
};

export type CryptoLiveProvider = "binance" | "coingecko" | "coinbase" | "fallback";

export type MarketSymbol = "btc" | "eth" | "sol";
export type MarketInterval = "15m" | "1h" | "4h";

export type MarketOrderLevel = {
  price: number;
  quantity: number;
  total: number;
};

export type MarketTrade = {
  price: number;
  quantity: number;
  time: string;
  side: "buy" | "sell";
};

export type MarketCandle = {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
};

export type MarketStats = {
  lastPrice: number;
  change24h: number;
  high24h: number;
  low24h: number;
  baseVolume24h: number;
  quoteVolume24h: number;
};

export type MarketSnapshot = {
  symbol: MarketSymbol;
  pair: string;
  assetName: string;
  interval: MarketInterval;
  provider: "binance";
  updatedAt: string;
  stats: MarketStats;
  bids: MarketOrderLevel[];
  asks: MarketOrderLevel[];
  trades: MarketTrade[];
  candles: MarketCandle[];
};

export type SummaryRecord = {
  id: number;
  title: string;
  content: string;
  summaryDate: Date;
  createdAt: Date;
  updatedAt: Date;
};

export type SiteStatusRecord = {
  lastNewsRefresh: Date | null;
  importedToday: number;
  activeSources: number;
  marketStatus: "Live" | "Delayed" | "Fallback";
};
