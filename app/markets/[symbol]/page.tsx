import Link from "next/link";
import { notFound } from "next/navigation";

import { MarketTerminal } from "@/components/market-terminal";
import { getMarketMeta, isMarketSymbol } from "@/lib/market-data";

export default async function MarketPage({ params }: { params: Promise<{ symbol: string }> }) {
  const { symbol } = await params;

  if (!isMarketSymbol(symbol)) {
    notFound();
  }

  const meta = getMarketMeta(symbol);

  return (
    <main className="space-y-4 xl:flex xl:h-[calc(100vh-8.5rem)] xl:flex-col xl:overflow-hidden">
      <section className="space-y-3 xl:shrink-0">
        <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
          <Link href="/" className="text-cyan-300">
            Dashboard
          </Link>
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <span>Markets</span>
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <span>{meta.displayTicker}</span>
        </div>
        <p className="eyebrow">Live trading view</p>
        <h1 className="text-4xl font-semibold text-white sm:text-5xl">{meta.assetName} terminal</h1>
        <p className="max-w-3xl text-base leading-7 text-slate-300">
          Track the {meta.displayTicker} chart, live depth, and session activity from a dedicated market page.
        </p>
      </section>

      <div className="xl:min-h-0 xl:flex-1">
        <MarketTerminal initialSymbol={symbol} />
      </div>
    </main>
  );
}
