import { describe, expect, it } from "vitest";

import {
  mapBinancePrices,
  mapCoinbasePrices,
  mapCoinGeckoPrices,
  mapGNewsArticle,
  mapNewsCategoryQuery
} from "../lib/integrations/mappers";
import { getArticleCtaLabel, getArticleHref, isExternalArticle } from "../lib/articles";
import { getCryptoPatternRows, getCryptoPatternVariant } from "../lib/crypto-patterns";
import { getMarketHref, getMarketMeta, getMarketInterval, isMarketInterval, isMarketSymbol } from "../lib/market-data";

describe("mapCoinGeckoPrices", () => {
  it("maps CoinGecko simple price payload into dashboard records", () => {
    const mapped = mapCoinGeckoPrices(
      {
        bitcoin: {
          usd: 106420.42,
          usd_market_cap: 2100000000000,
          usd_24h_change: 2.54,
          last_updated_at: 1779092258
        },
        ethereum: {
          usd: 5988.1,
          usd_market_cap: 720000000000,
          usd_24h_change: 1.67,
          last_updated_at: 1779092258
        },
        solana: {
          usd: 241.18,
          usd_market_cap: 112000000000,
          usd_24h_change: 4.83,
          last_updated_at: 1779092258
        }
      },
      new Date("2026-06-20T10:00:00Z")
    );

    expect(mapped).toHaveLength(3);
    expect(mapped[0]?.symbol).toBe("BTC");
    expect(mapped[0]?.price).toBe(106420.42);
    expect(mapped[0]?.marketCap).toBe("$2.10T");
  });
});

describe("mapCoinbasePrices", () => {
  it("maps Coinbase ticker and stats payloads into live dashboard records", () => {
    const mapped = mapCoinbasePrices(
      {
        BTC: {
          ticker: {
            price: "104250.50",
            time: "2026-06-20T12:10:00Z"
          },
          stats: {
            open: "101000.00"
          }
        },
        ETH: {
          ticker: {
            price: "5820.25",
            time: "2026-06-20T12:10:00Z"
          },
          stats: {
            open: "5700.00"
          }
        },
        SOL: {
          ticker: {
            price: "235.10",
            time: "2026-06-20T12:10:00Z"
          },
          stats: {
            open: "229.00"
          }
        }
      },
      new Date("2026-06-20T12:10:00Z")
    );

    expect(mapped).toHaveLength(3);
    expect(mapped[0]?.symbol).toBe("BTC");
    expect(mapped[0]?.price).toBe(104250.5);
    expect(mapped[0]?.change24h).toBeCloseTo(3.22, 2);
    expect(mapped[0]?.marketCap).toBe("$2.10T");
  });
});

describe("mapBinancePrices", () => {
  it("maps Binance 24hr ticker payload into live dashboard records", () => {
    const mapped = mapBinancePrices(
      {
        BTCUSDT: {
          lastPrice: "104250.50",
          priceChangePercent: "3.22",
          closeTime: 1781961000000
        },
        ETHUSDT: {
          lastPrice: "5820.25",
          priceChangePercent: "2.11",
          closeTime: 1781961000000
        },
        SOLUSDT: {
          lastPrice: "235.10",
          priceChangePercent: "4.67",
          closeTime: 1781961000000
        }
      },
      new Date("2026-06-20T12:10:00Z")
    );

    expect(mapped).toHaveLength(3);
    expect(mapped[0]?.symbol).toBe("BTC");
    expect(mapped[0]?.price).toBe(104250.5);
    expect(mapped[0]?.change24h).toBe(3.22);
    expect(mapped[0]?.recordedAt.toISOString()).toBe("2026-06-20T12:30:00.000Z");
  });
});

describe("mapGNewsArticle", () => {
  it("maps a GNews article into the local article shape", () => {
    const article = mapGNewsArticle(
      {
        title: "Bitcoin rallies as ETF inflows rebound",
        description: "Traders watch support and renewed institutional demand.",
        content: "Bitcoin rallied in early trading as ETF inflows resumed and risk appetite improved.",
        url: "https://news.example.com/bitcoin-rallies",
        image: "https://images.example.com/bitcoin.jpg",
        publishedAt: "2026-06-20T09:15:00Z",
        source: {
          name: "News Wire",
          url: "https://news.example.com"
        }
      },
      "crypto",
      1
    );

    expect(article.slug).toContain("bitcoin-rallies");
    expect(article.category.slug).toBe("crypto");
    expect(article.externalUrl).toBe("https://news.example.com/bitcoin-rallies");
    expect(article.source.url).toBe("https://news.example.com");
    expect(article.content.length).toBeGreaterThan(20);
  });
});

describe("mapNewsCategoryQuery", () => {
  it("returns a focused keyword query for each dashboard category", () => {
    expect(mapNewsCategoryQuery("crypto")).toContain("crypto");
    expect(mapNewsCategoryQuery("macro")).toContain("inflation");
  });
});

describe("article link helpers", () => {
  const localArticle = {
    id: 1,
    title: "Desk note",
    slug: "desk-note",
    excerpt: "Internal copy",
    content: "Internal copy content",
    coverImage: null,
    isFeatured: false,
    externalUrl: null,
    publishedAt: new Date("2026-06-20T10:00:00Z"),
    createdAt: new Date("2026-06-20T10:00:00Z"),
    updatedAt: new Date("2026-06-20T10:00:00Z"),
    sourceId: 1,
    categoryId: 1,
    category: { id: 1, name: "Crypto", slug: "crypto" },
    source: { id: 1, name: "Desk", slug: "desk", url: "https://desk.example.com" }
  };

  it("prefers external article links when the live feed provides an original URL", () => {
    const article = {
      ...localArticle,
      externalUrl: "https://wire.example.com/story"
    };

    expect(isExternalArticle(article)).toBe(true);
    expect(getArticleHref(article)).toBe("https://wire.example.com/story");
    expect(getArticleCtaLabel(article)).toBe("Open source");
  });

  it("keeps internal links for editorial articles stored in the app", () => {
    expect(isExternalArticle(localArticle)).toBe(false);
    expect(getArticleHref(localArticle)).toBe("/article/desk-note");
    expect(getArticleCtaLabel(localArticle)).toBe("Open briefing");
  });
});

describe("crypto card patterns", () => {
  it("uses a diagonal bitcoin watermark and a diamond grid for ethereum", () => {
    expect(getCryptoPatternVariant("BTC")).toBe("btc");
    expect(getCryptoPatternVariant("ETH")).toBe("eth");
    expect(getCryptoPatternRows("BTC")[0]).toContain("\u20BF");
    expect(getCryptoPatternRows("ETH")[0]).toContain("\u25C7");
  });

  it("uses the dedicated solana visual variant instead of text rows", () => {
    expect(getCryptoPatternVariant("SOL")).toBe("sol");
    expect(getCryptoPatternRows("SOL")).toHaveLength(0);
  });
});

describe("market routes", () => {
  it("maps supported asset slugs to the expected trading pairs", () => {
    expect(isMarketSymbol("btc")).toBe(true);
    expect(isMarketSymbol("eth")).toBe(true);
    expect(isMarketSymbol("sol")).toBe(true);
    expect(isMarketSymbol("xrp")).toBe(false);
    expect(getMarketMeta("btc").pair).toBe("BTCUSDT");
    expect(getMarketMeta("eth").pair).toBe("ETHUSDT");
    expect(getMarketMeta("sol").pair).toBe("SOLUSDT");
  });

  it("builds detail page links for supported dashboard symbols", () => {
    expect(getMarketHref("BTC")).toBe("/markets/btc");
    expect(getMarketHref("ETH")).toBe("/markets/eth");
    expect(getMarketHref("SOL")).toBe("/markets/sol");
  });

  it("accepts only supported market intervals and falls back to 15m", () => {
    expect(isMarketInterval("15m")).toBe(true);
    expect(isMarketInterval("1h")).toBe(true);
    expect(isMarketInterval("4h")).toBe(true);
    expect(isMarketInterval("5m")).toBe(false);
    expect(getMarketInterval("1h")).toBe("1h");
    expect(getMarketInterval("bad-value")).toBe("15m");
  });
});
