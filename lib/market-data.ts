import type { MarketCandle, MarketInterval, MarketOrderLevel, MarketSnapshot, MarketStats, MarketSymbol, MarketTrade } from "@/lib/types";

const marketMeta = {
  btc: { symbol: "btc", pair: "BTCUSDT", assetName: "Bitcoin", displayTicker: "BTC/USDT" },
  eth: { symbol: "eth", pair: "ETHUSDT", assetName: "Ethereum", displayTicker: "ETH/USDT" },
  sol: { symbol: "sol", pair: "SOLUSDT", assetName: "Solana", displayTicker: "SOL/USDT" }
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

function buildDepthLevels(levels: [string, string][]) {
  let runningTotal = 0;
  return levels.map(([price, quantity]) => {
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

export async function fetchMarketSnapshot(symbol: MarketSymbol, interval: MarketInterval = "15m"): Promise<MarketSnapshot> {
  const meta = getMarketMeta(symbol);
  const pair = meta.pair;

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
}
