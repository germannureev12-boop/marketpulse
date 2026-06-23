import { fallbackCrypto } from "@/lib/fallback-data";
import type {
  MarketCandle,
  MarketInterval,
  MarketOrderLevel,
  MarketSnapshot,
  MarketStats,
  MarketSymbol,
  MarketTrade
} from "@/lib/types";

const marketMeta = {
  btc: { symbol: "btc", pair: "BTCUSDT", coinbasePair: "BTC-USD", assetName: "Bitcoin", displayTicker: "BTC/USDT" },
  eth: { symbol: "eth", pair: "ETHUSDT", coinbasePair: "ETH-USD", assetName: "Ethereum", displayTicker: "ETH/USDT" },
  sol: { symbol: "sol", pair: "SOLUSDT", coinbasePair: "SOL-USD", assetName: "Solana", displayTicker: "SOL/USDT" }
} as const;

const marketIntervals = ["15m", "1h", "4h"] as const;

type BinanceDepthPayload = {
  bids: [string, string][];
  asks: [string, string][];
};

type BinanceTickerPayload = {
  lastPrice: string;
  priceChangePercent: string;
  highPrice: string;
  lowPrice: string;
  volume: string;
  quoteVolume: string;
  closeTime: number;
};

type BinanceKlinePayload = [
  number,
  string,
  string,
  string,
  string,
  string,
  number,
  string,
  number,
  string,
  string,
  string
];

type BinanceTradePayload = {
  p: string;
  q: string;
  T: number;
  m: boolean;
};

type CoinbaseBookPayload = {
  bids: Array<[string, string, string?]>;
  asks: Array<[string, string, string?]>;
};

type CoinbaseTickerPayload = {
  price?: string;
  time?: string;
};

type CoinbaseStatsPayload = {
  open?: string;
  high?: string;
  low?: string;
  volume?: string;
  last?: string;
};

type CoinbaseCandlePayload = [number, number, number, number, number, number];

type CoinbaseTradePayload = {
  price?: string;
  size?: string;
  time?: string;
  side?: "buy" | "sell";
};

export function isMarketSymbol(value: string): value is MarketSymbol {
  return value in marketMeta;
}

export function getMarketMeta(symbol: MarketSymbol) {
  return marketMeta[symbol];
}

export function getMarketHref(symbol: string) {
  return `/markets/${symbol.toLowerCase()}`;
}

export function isMarketInterval(value: string): value is MarketInterval {
  return (marketIntervals as readonly string[]).includes(value);
}

export function getMarketInterval(value: string | null | undefined): MarketInterval {
  return value && isMarketInterval(value) ? value : "15m";
}

function toNumber(value: string) {
  return Number.parseFloat(value);
}

function buildDepthLevels(levels: Array<[string, string] | [string, string, string?]>) {
  let runningTotal = 0;

  return levels.map((level) => {
    const [price, quantity] = level;
    const parsedPrice = toNumber(price);
    const parsedQuantity = toNumber(quantity);
    runningTotal += parsedQuantity;

    return {
      price: parsedPrice,
      quantity: parsedQuantity,
      total: runningTotal
    } satisfies MarketOrderLevel;
  });
}

function buildStats(payload: BinanceTickerPayload): MarketStats {
  return {
    lastPrice: toNumber(payload.lastPrice),
    change24h: toNumber(payload.priceChangePercent),
    high24h: toNumber(payload.highPrice),
    low24h: toNumber(payload.lowPrice),
    baseVolume24h: toNumber(payload.volume),
    quoteVolume24h: toNumber(payload.quoteVolume)
  };
}

function buildCandles(payload: BinanceKlinePayload[]) {
  return payload.map((candle) => ({
    time: new Date(candle[0]).toISOString(),
    open: toNumber(candle[1]),
    high: toNumber(candle[2]),
    low: toNumber(candle[3]),
    close: toNumber(candle[4]),
    volume: toNumber(candle[5])
  })) satisfies MarketCandle[];
}

function buildRecentTrades(payload: BinanceTradePayload[]) {
  return payload.map((trade) => ({
    price: toNumber(trade.p),
    quantity: toNumber(trade.q),
    time: new Date(trade.T).toISOString(),
    side: trade.m ? "sell" : "buy"
  })) satisfies MarketTrade[];
}

function getCoinbaseGranularity(interval: MarketInterval) {
  if (interval === "1h") {
    return 3600;
  }

  if (interval === "4h") {
    return 14400;
  }

  return 900;
}

function buildCoinbaseCandles(payload: CoinbaseCandlePayload[]) {
  return payload
    .slice()
    .sort((left, right) => left[0] - right[0])
    .map((candle) => ({
      time: new Date(candle[0] * 1000).toISOString(),
      low: candle[1],
      high: candle[2],
      open: candle[3],
      close: candle[4],
      volume: candle[5]
    })) satisfies MarketCandle[];
}

function buildCoinbaseTrades(payload: CoinbaseTradePayload[]) {
  return payload
    .map((trade) => ({
      price: toNumber(trade.price ?? "0"),
      quantity: toNumber(trade.size ?? "0"),
      time: trade.time ? new Date(trade.time).toISOString() : new Date().toISOString(),
      side: trade.side === "sell" ? "sell" : "buy"
    } satisfies MarketTrade))
    .sort((left, right) => left.time.localeCompare(right.time));
}

function getFallbackBasePrice(symbol: MarketSymbol) {
  const fallbackSymbol = symbol.toUpperCase();
  return fallbackCrypto.find((asset) => asset.symbol === fallbackSymbol)?.price ?? 100;
}

function buildFallbackMarketSnapshot(symbol: MarketSymbol, interval: MarketInterval): MarketSnapshot {
  const meta = getMarketMeta(symbol);
  const basePrice = getFallbackBasePrice(symbol);
  const now = Date.now();
  const stepMs =
    interval === "15m"
      ? 15 * 60 * 1000
      : interval === "1h"
        ? 60 * 60 * 1000
        : 4 * 60 * 60 * 1000;
  const candleCount = 72;

  const candles: MarketCandle[] = Array.from({ length: candleCount }, (_, index) => {
    const drift = Math.sin(index / 5) * basePrice * 0.006;
    const open = basePrice + drift + ((index % 6) - 3) * basePrice * 0.0014;
    const close = open + (((index % 5) - 2) * basePrice * 0.0011);
    const high = Math.max(open, close) + basePrice * (0.002 + (index % 3) * 0.0006);
    const low = Math.min(open, close) - basePrice * (0.002 + ((index + 1) % 3) * 0.0006);
    const volume = 220 + (index % 9) * 34 + (index % 4) * 12;

    return {
      time: new Date(now - (candleCount - 1 - index) * stepMs).toISOString(),
      open: Number(open.toFixed(2)),
      high: Number(high.toFixed(2)),
      low: Number(low.toFixed(2)),
      close: Number(close.toFixed(2)),
      volume: Number(volume.toFixed(2))
    };
  });

  const lastCandle = candles.at(-1) ?? candles[0];
  const firstCandle = candles[0] ?? lastCandle;
  const lastPrice = lastCandle?.close ?? basePrice;
  const open24h = firstCandle?.open ?? lastPrice;
  const change24h = open24h ? ((lastPrice - open24h) / open24h) * 100 : 0;
  const high24h = Math.max(...candles.map((candle) => candle.high));
  const low24h = Math.min(...candles.map((candle) => candle.low));
  const baseVolume24h = candles.reduce((sum, candle) => sum + candle.volume, 0);
  const quoteVolume24h = baseVolume24h * lastPrice;

  const asks: MarketOrderLevel[] = Array.from({ length: 18 }, (_, index) => {
    const price = lastPrice + (index + 1) * basePrice * 0.0008;
    const quantity = 0.08 + index * 0.015;
    return {
      price: Number(price.toFixed(2)),
      quantity: Number(quantity.toFixed(6)),
      total: Number((0.08 * (index + 1) + (index * (index + 1) * 0.015) / 2).toFixed(6))
    };
  });

  const bids: MarketOrderLevel[] = Array.from({ length: 18 }, (_, index) => {
    const price = lastPrice - (index + 1) * basePrice * 0.0008;
    const quantity = 0.09 + index * 0.014;
    return {
      price: Number(price.toFixed(2)),
      quantity: Number(quantity.toFixed(6)),
      total: Number((0.09 * (index + 1) + (index * (index + 1) * 0.014) / 2).toFixed(6))
    };
  });

  const trades: MarketTrade[] = Array.from({ length: 12 }, (_, index) => {
    const side = index % 2 === 0 ? "buy" : "sell";
    const priceShift = (index - 6) * basePrice * 0.00035;

    return {
      price: Number((lastPrice + priceShift).toFixed(2)),
      quantity: Number((0.04 + index * 0.01).toFixed(6)),
      time: new Date(now - index * 45_000).toISOString(),
      side
    };
  }).reverse();

  return {
    symbol,
    pair: meta.displayTicker,
    assetName: meta.assetName,
    interval,
    provider: "fallback",
    updatedAt: new Date(now).toISOString(),
    stats: {
      lastPrice: Number(lastPrice.toFixed(2)),
      change24h: Number(change24h.toFixed(2)),
      high24h: Number(high24h.toFixed(2)),
      low24h: Number(low24h.toFixed(2)),
      baseVolume24h: Number(baseVolume24h.toFixed(2)),
      quoteVolume24h: Number(quoteVolume24h.toFixed(2))
    },
    bids,
    asks,
    trades,
    candles
  };
}

async function fetchCoinbaseMarketSnapshot(symbol: MarketSymbol, interval: MarketInterval): Promise<MarketSnapshot> {
  const meta = getMarketMeta(symbol);
  const productId = meta.coinbasePair;
  const granularity = getCoinbaseGranularity(interval);

  const [tickerResponse, statsResponse, bookResponse, candlesResponse, tradesResponse] = await Promise.all([
    fetch(`https://api.exchange.coinbase.com/products/${productId}/ticker`, {
      headers: { accept: "application/json" },
      next: { revalidate: 8 }
    }),
    fetch(`https://api.exchange.coinbase.com/products/${productId}/stats`, {
      headers: { accept: "application/json" },
      next: { revalidate: 20 }
    }),
    fetch(`https://api.exchange.coinbase.com/products/${productId}/book?level=2`, {
      headers: { accept: "application/json" },
      next: { revalidate: 3 }
    }),
    fetch(`https://api.exchange.coinbase.com/products/${productId}/candles?granularity=${granularity}`, {
      headers: { accept: "application/json" },
      next: { revalidate: interval === "15m" ? 5 : interval === "1h" ? 20 : 45 }
    }),
    fetch(`https://api.exchange.coinbase.com/products/${productId}/trades?limit=12`, {
      headers: { accept: "application/json" },
      next: { revalidate: 4 }
    })
  ]);

  if (!tickerResponse.ok || !statsResponse.ok || !bookResponse.ok || !candlesResponse.ok || !tradesResponse.ok) {
    throw new Error(`Coinbase market request failed for ${productId}`);
  }

  const ticker = (await tickerResponse.json()) as CoinbaseTickerPayload;
  const stats = (await statsResponse.json()) as CoinbaseStatsPayload;
  const book = (await bookResponse.json()) as CoinbaseBookPayload;
  const candles = (await candlesResponse.json()) as CoinbaseCandlePayload[];
  const trades = (await tradesResponse.json()) as CoinbaseTradePayload[];
  const lastPrice = toNumber(ticker.price ?? stats.last ?? "0");
  const baseVolume = toNumber(stats.volume ?? "0");

  return {
    symbol,
    pair: meta.displayTicker,
    assetName: meta.assetName,
    interval,
    provider: "coinbase",
    updatedAt: ticker.time ? new Date(ticker.time).toISOString() : new Date().toISOString(),
    stats: {
      lastPrice,
      change24h: (() => {
        const open = toNumber(stats.open ?? "0");
        if (!open) {
          return 0;
        }
        return ((lastPrice - open) / open) * 100;
      })(),
      high24h: toNumber(stats.high ?? String(lastPrice)),
      low24h: toNumber(stats.low ?? String(lastPrice)),
      baseVolume24h: baseVolume,
      quoteVolume24h: baseVolume * lastPrice
    },
    bids: buildDepthLevels(book.bids),
    asks: buildDepthLevels(book.asks),
    trades: buildCoinbaseTrades(trades),
    candles: buildCoinbaseCandles(candles)
  };
}

export async function fetchMarketSnapshot(symbol: MarketSymbol, interval: MarketInterval = "15m"): Promise<MarketSnapshot> {
  const meta = getMarketMeta(symbol);
  const pair = meta.pair;

  try {
    const [tickerResponse, depthResponse, klinesResponse, tradesResponse] = await Promise.all([
      fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`, {
        headers: { accept: "application/json" },
        next: { revalidate: 8 }
      }),
      fetch(`https://api.binance.com/api/v3/depth?symbol=${pair}&limit=100`, {
        headers: { accept: "application/json" },
        next: { revalidate: 3 }
      }),
      fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=${interval}&limit=720`, {
        headers: { accept: "application/json" },
        next: { revalidate: interval === "15m" ? 5 : interval === "1h" ? 20 : 45 }
      }),
      fetch(`https://api.binance.com/api/v3/aggTrades?symbol=${pair}&limit=12`, {
        headers: { accept: "application/json" },
        next: { revalidate: 2 }
      })
    ]);

    if (!tickerResponse.ok || !depthResponse.ok || !klinesResponse.ok || !tradesResponse.ok) {
      throw new Error(`Market request failed for ${pair}`);
    }

    const ticker = (await tickerResponse.json()) as BinanceTickerPayload;
    const depth = (await depthResponse.json()) as BinanceDepthPayload;
    const klines = (await klinesResponse.json()) as BinanceKlinePayload[];
    const trades = (await tradesResponse.json()) as BinanceTradePayload[];

    return {
      symbol,
      pair: meta.displayTicker,
      assetName: meta.assetName,
      interval,
      provider: "binance",
      updatedAt: new Date(ticker.closeTime).toISOString(),
      stats: buildStats(ticker),
      bids: buildDepthLevels(depth.bids),
      asks: buildDepthLevels(depth.asks),
      trades: buildRecentTrades(trades).reverse(),
      candles: buildCandles(klines)
    };
  } catch {
    try {
      return await fetchCoinbaseMarketSnapshot(symbol, interval);
    } catch {
      return buildFallbackMarketSnapshot(symbol, interval);
    }
  }
}
