"use client";

import Link from "next/link";

import { useFavorites } from "@/lib/client-favorites";
import { getMarketHref } from "@/lib/market-data";
import type { CryptoRecord } from "@/lib/types";
import { formatMoney } from "@/lib/utils";

type WatchlistPanelProps = {
  crypto: CryptoRecord[];
  availableSources: Array<{ slug: string; name: string; url: string }>;
};

export function WatchlistPanel({ crypto, availableSources }: WatchlistPanelProps) {
  const { favorites } = useFavorites();
  const favoriteAssets = crypto.filter((item) => favorites.assets.includes(item.symbol.toLowerCase()));
  const favoriteCategories = favorites.categories;
  const favoriteSources = availableSources.filter((source) => favorites.sources.includes(source.slug));

  if (favoriteAssets.length === 0 && favoriteCategories.length === 0 && favoriteSources.length === 0) {
    return (
      <section className="panel p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="eyebrow">Watchlist</p>
            <h2 className="mt-2 text-xl font-semibold text-white">Build your personal desk</h2>
          </div>
        </div>
        <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-300">
          Pin favorite assets, categories, and sources. Your watchlist will appear here and turn the dashboard into a faster personal workflow.
        </p>
      </section>
    );
  }

  return (
    <section className="panel p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="eyebrow">Watchlist</p>
          <h2 className="mt-2 text-xl font-semibold text-white">Your personal desk</h2>
        </div>
        <span className="rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-xs text-cyan-200">
          {favoriteAssets.length + favoriteCategories.length + favoriteSources.length} pinned
        </span>
      </div>

      {favoriteAssets.length > 0 ? (
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Tracked assets</p>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {favoriteAssets.map((asset) => (
              <Link key={asset.symbol} href={getMarketHref(asset.symbol)} className="rounded-2xl border border-white/8 bg-white/5 px-4 py-4 transition hover:border-cyan-300/25">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-white">{asset.symbol}</span>
                  <span className={`text-xs ${asset.change24h >= 0 ? "text-emerald-300" : "text-rose-300"}`}>
                    {asset.change24h >= 0 ? "+" : ""}
                    {asset.change24h.toFixed(2)}%
                  </span>
                </div>
                <p className="mt-3 text-lg font-semibold text-white">{formatMoney(asset.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {favoriteCategories.length > 0 ? (
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Priority categories</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {favoriteCategories.map((category) => (
              <Link
                key={category}
                href={`/category/${category}`}
                className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm capitalize text-slate-200 transition hover:border-cyan-300/30 hover:text-white"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      ) : null}

      {favoriteSources.length > 0 ? (
        <div className="mt-5">
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Favorite sources</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {favoriteSources.map((source) => (
              <Link
                key={source.slug}
                href={source.url}
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-emerald-300/15 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-200 transition hover:border-cyan-300/30 hover:text-white"
              >
                {source.name}
              </Link>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}
