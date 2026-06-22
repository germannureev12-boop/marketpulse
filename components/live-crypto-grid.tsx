"use client";

import { startTransition, useCallback, useEffect, useState } from "react";

import { CryptoCard } from "@/components/crypto-card";
import { getMarketHref } from "@/lib/market-data";
import type { CryptoLiveProvider, CryptoRecord } from "@/lib/types";
import { formatDate, formatTime } from "@/lib/utils";

type LiveCryptoGridProps = {
  initialItems: CryptoRecord[];
};

type LiveCryptoResponse = {
  crypto: CryptoRecord[];
  source: "live" | "fallback";
  provider: CryptoLiveProvider;
  usdRubRate: number | null;
  fxUpdatedAt: string | null;
};

const providerLabels: Record<CryptoLiveProvider, string> = {
  binance: "Binance Spot",
  coingecko: "CoinGecko",
  coinbase: "Coinbase",
  fallback: "Fallback"
};

export function LiveCryptoGrid({ initialItems }: LiveCryptoGridProps) {
  const [items, setItems] = useState(initialItems);
  const [source, setSource] = useState<LiveCryptoResponse["source"]>("live");
  const [provider, setProvider] = useState<CryptoLiveProvider>("fallback");
  const [currency, setCurrency] = useState<"USD" | "RUB">("USD");
  const [usdRubRate, setUsdRubRate] = useState<number | null>(null);
  const [fxUpdatedAt, setFxUpdatedAt] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(initialItems[0]?.recordedAt ?? null);

  const refreshPrices = useCallback(async () => {
  try {
    const response = await fetch("/api/crypto/live", { cache: "no-store" });
    if (!response.ok) {
      return;
    }

    const data = (await response.json()) as LiveCryptoResponse;
    if (!Array.isArray(data.crypto) || data.crypto.length === 0) {
      return;
    }

    startTransition(() => {
      setItems(data.crypto);
      setSource(data.source);
      setProvider(data.provider);
      setUsdRubRate(data.usdRubRate);
      setFxUpdatedAt(data.fxUpdatedAt);
      setLastUpdated(new Date(data.crypto[0]?.recordedAt ?? Date.now()));
    });
  } catch {
    // Keep the last known values on screen if polling fails.
  }
}, []);

  useEffect(() => {
    void refreshPrices();
    const interval = window.setInterval(() => {
      void refreshPrices();
    }, 15000);

    return () => {
      window.clearInterval(interval);
    };
  }, [refreshPrices]);

  return (
    <section className="space-y-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <p className="eyebrow">Live prices</p>
          <span
            className={`rounded-full px-2.5 py-1 text-xs font-medium ${
              source === "live"
                ? "border border-emerald-400/20 bg-emerald-400/10 text-emerald-300"
                : "border border-amber-400/20 bg-amber-400/10 text-amber-200"
            }`}
          >
            {source === "live" ? "Auto-refreshing" : "Fallback mode"}
          </span>
          <span className="rounded-full border border-slate-700 bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-slate-300">
            {providerLabels[provider]}
          </span>
          <div className="flex rounded-full border border-slate-700 bg-slate-900/80 p-1">
            {(["USD", "RUB"] as const).map((option) => {
              const active = currency === option;
              const disabled = option === "RUB" && !usdRubRate;

              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => !disabled && setCurrency(option)}
                  aria-pressed={active}
                  disabled={disabled}
                  title={disabled ? "USD/RUB rate is temporarily unavailable" : `Show prices in ${option}`}
                  className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                    active
                      ? "cursor-default bg-cyan-300/15 text-cyan-200"
                      : disabled
                        ? "cursor-not-allowed text-slate-600"
                        : "cursor-pointer text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
          {!usdRubRate ? <span className="text-xs text-amber-300/80">RUB rate is loading or unavailable</span> : null}
        </div>
        <div className="text-right text-sm text-slate-400">
          <p>{lastUpdated ? `Price tick ${formatTime(lastUpdated)}` : "Waiting for update"}</p>
          <p>{fxUpdatedAt ? `USD/RUB daily ref ${formatDate(fxUpdatedAt)}` : "USD/RUB unavailable"}</p>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {items.map((item) => (
          <div key={item.symbol} className="group block">
            <CryptoCard item={item} currency={currency} usdRubRate={usdRubRate} href={getMarketHref(item.symbol)} />
          </div>
        ))}
      </div>
    </section>
  );
}
