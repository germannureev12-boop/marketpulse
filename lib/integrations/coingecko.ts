import type { CryptoLiveProvider, CryptoRecord } from "@/lib/types";

import { mapBinancePrices, mapCoinGeckoPrices, mapCoinbasePrices } from "@/lib/integrations/mappers";

const COINGECKO_URL =
  "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,solana&vs_currencies=usd&include_market_cap=true&include_24hr_change=true&include_last_updated_at=true";

const coinbaseProducts = [
  { symbol: "BTC", productId: "BTC-USD" },
  { symbol: "ETH", productId: "ETH-USD" },
  { symbol: "SOL", productId: "SOL-USD" }
] as const;

const binanceSymbols = ["BTCUSDT", "ETHUSDT", "SOLUSDT"] as const;

type CryptoLiveFeed = {
  crypto: CryptoRecord[];
  provider: Exclude<CryptoLiveProvider, "fallback">;
  usdRubRate: number | null;
  fxUpdatedAt: string | null;
};

async function fetchCoinGeckoPrices() {
  const response = await fetch(COINGECKO_URL, {
    headers: {
      accept: "application/json"
    },
    next: {
      revalidate: 10
    }
  });

  if (!response.ok) {
    throw new Error(`CoinGecko request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Record<string, { usd?: number }>;
  return mapCoinGeckoPrices(payload);
}

async function fetchCoinbasePrices() {
  const entries = await Promise.all(
    coinbaseProducts.map(async ({ symbol, productId }) => {
      const [tickerResponse, statsResponse] = await Promise.all([
        fetch(`https://api.exchange.coinbase.com/products/${productId}/ticker`, {
          headers: {
            accept: "application/json"
          },
          next: {
            revalidate: 10
          }
        }),
        fetch(`https://api.exchange.coinbase.com/products/${productId}/stats`, {
          headers: {
            accept: "application/json"
          },
          next: {
            revalidate: 30
          }
        })
      ]);

      if (!tickerResponse.ok || !statsResponse.ok) {
        throw new Error(`Coinbase request failed for ${productId}`);
      }

      return [
        symbol,
        {
          ticker: (await tickerResponse.json()) as { price?: string; time?: string },
          stats: (await statsResponse.json()) as { open?: string }
        }
      ] as const;
    })
  );

  return mapCoinbasePrices(Object.fromEntries(entries));
}

async function fetchBinancePrices() {
  const symbols = encodeURIComponent(JSON.stringify(binanceSymbols));
  const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbols=${symbols}`, {
    headers: {
      accept: "application/json"
    },
    next: {
      revalidate: 10
    }
  });

  if (!response.ok) {
    throw new Error(`Binance request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as Array<{
    symbol?: string;
    lastPrice?: string;
    priceChangePercent?: string;
    closeTime?: number;
  }>;

  const bySymbol = Object.fromEntries(
    payload
      .filter((item) => item.symbol)
      .map((item) => [item.symbol as string, item])
  );

  return mapBinancePrices(bySymbol);
}

async function fetchUsdRubRate() {
  try {
    const response = await fetch("https://api.frankfurter.app/latest?from=USD&to=RUB", {
      headers: {
        accept: "application/json"
      },
      next: {
        revalidate: 300
      }
    });

    if (!response.ok) {
      throw new Error(`Frankfurter FX request failed with status ${response.status}`);
    }

    const payload = (await response.json()) as {
      date?: string;
      rates?: {
        RUB?: number;
      };
    };

    if (payload.rates?.RUB) {
      return {
        usdRubRate: payload.rates.RUB,
        fxUpdatedAt: payload.date ? new Date(`${payload.date}T00:00:00Z`).toISOString() : null
      };
    }
  } catch {
    // Fall through to a second FX provider if the primary one is unavailable.
  }

  const fallbackResponse = await fetch("https://open.er-api.com/v6/latest/USD", {
    headers: {
      accept: "application/json"
    },
    next: {
      revalidate: 300
    }
  });

  if (!fallbackResponse.ok) {
    throw new Error(`Fallback FX request failed with status ${fallbackResponse.status}`);
  }

  const fallbackPayload = (await fallbackResponse.json()) as {
    result?: string;
    rates?: {
      RUB?: number;
    };
    time_last_update_utc?: string;
  };

  return {
    usdRubRate: fallbackPayload.rates?.RUB ?? null,
    fxUpdatedAt: fallbackPayload.time_last_update_utc ? new Date(fallbackPayload.time_last_update_utc).toISOString() : null
  };
}

async function withFx(
  loader: () => Promise<CryptoRecord[]>,
  provider: Exclude<CryptoLiveProvider, "fallback">
): Promise<CryptoLiveFeed> {
  const [crypto, fx] = await Promise.all([
    loader(),
    fetchUsdRubRate().catch(() => ({ usdRubRate: null, fxUpdatedAt: null }))
  ]);

  return {
    crypto,
    provider,
    usdRubRate: fx.usdRubRate,
    fxUpdatedAt: fx.fxUpdatedAt
  };
}

export async function fetchLiveCryptoFeed(): Promise<CryptoLiveFeed> {
  try {
    const live = await withFx(fetchBinancePrices, "binance");
    if (live.crypto.length > 0) {
      return live;
    }
  } catch {
    // Fall through to the next live provider if Binance is unavailable.
  }

  try {
    const live = await withFx(fetchCoinGeckoPrices, "coingecko");
    if (live.crypto.length > 0) {
      return live;
    }
  } catch {
    // Fall through to the next live provider if CoinGecko is unavailable.
  }

  const coinbaseLive = await withFx(fetchCoinbasePrices, "coinbase");
  if (coinbaseLive.crypto.length > 0) {
    return coinbaseLive;
  }

  throw new Error("No live crypto providers returned usable prices");
}

export async function fetchLiveCryptoPrices(): Promise<CryptoRecord[]> {
  return (await fetchLiveCryptoFeed()).crypto;
}
