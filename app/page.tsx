import { unstable_noStore as noStore } from "next/cache";

import { AnimatedHeroTitle } from "@/components/animated-hero-title";
import { WatchlistPanel } from "@/components/watchlist-panel";
import { CategoryPills } from "@/components/category-pills";
import { DailySummary } from "@/components/daily-summary";
import { FeaturedArticle } from "@/components/featured-article";
import { LiveCryptoGrid } from "@/components/live-crypto-grid";
import { LiveStatusBar } from "@/components/live-status-bar";
import { NewsGrid } from "@/components/news-grid";
import { PageAutoRefresh } from "@/components/page-auto-refresh";
import { getHomepageData, getSiteStatus, getSources } from "@/lib/data";

export default async function HomePage() {
  noStore();

  const [{ articles, crypto, summary }, siteStatus, sources] = await Promise.all([
    getHomepageData(),
    getSiteStatus(),
    getSources()
  ]);
  const [featured, ...rest] = articles;
  const availableSources = sources
    .filter((source) => source.isActive)
    .map((source) => ({ slug: source.slug, name: source.name, url: source.url }));

  return (
    <main className="space-y-6">
      <PageAutoRefresh intervalMs={60_000} />
      <section className="space-y-4">
        <p className="eyebrow">Global dashboard</p>
        <div className="min-w-0">
          <AnimatedHeroTitle text="Financial and crypto news built for traders, operators, and macro obsessives.TEST" />
          <p className="mt-4 max-w-2xl text-lg leading-8 text-slate-300">
            Scan the tape fast, catch the narrative early, and drill into the stories moving markets.
          </p>
        </div>
        <div className="flex justify-end">
          <CategoryPills compact title="News sectors" align="end" />
        </div>
      </section>

      <LiveStatusBar status={siteStatus} />
      <LiveCryptoGrid initialItems={crypto} />
      <WatchlistPanel crypto={crypto} availableSources={availableSources} />

      <section className="grid gap-6 xl:grid-cols-[1.45fr_0.75fr]">
        {featured ? <FeaturedArticle article={featured} /> : null}
        <DailySummary summary={summary} />
      </section>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Latest coverage</h2>
          <p className="text-sm text-slate-400">Curated across crypto, finance, macro, and breaking stories.</p>
        </div>
        <NewsGrid articles={rest} />
      </section>
    </main>
  );
}
