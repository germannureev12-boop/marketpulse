import type { ArticleRecord } from "@/lib/types";

function CryptoArt() {
  return (
    <>
      <div className="absolute -left-6 top-8 h-36 w-36 rounded-full border border-cyan-300/20 bg-cyan-300/10 shadow-[0_0_80px_rgba(34,211,238,0.22)]" />
      <div className="absolute left-10 top-16 h-20 w-20 rounded-full border border-cyan-200/35 bg-slate-950/35" />
      <div className="absolute left-[3.35rem] top-[5.35rem] text-4xl font-semibold text-cyan-100/90">₿</div>
      <div className="absolute right-10 top-10 h-24 w-24 rotate-12 rounded-[1.75rem] border border-emerald-300/15 bg-emerald-300/10" />
      <div className="absolute bottom-8 right-8 h-16 w-32 rounded-full border border-white/10 bg-gradient-to-r from-cyan-300/5 via-emerald-300/10 to-transparent" />
    </>
  );
}

function MarketsArt() {
  return (
    <>
      <div className="absolute inset-x-0 bottom-0 top-0 opacity-80 [background-image:linear-gradient(rgba(148,163,184,0.08)_1px,transparent_1px),linear-gradient(90deg,rgba(148,163,184,0.08)_1px,transparent_1px)] [background-size:24px_24px]" />
      <div className="absolute left-0 right-0 top-1/2 h-px bg-cyan-300/10" />
      <div className="absolute bottom-10 left-10 right-10">
        <div className="relative h-24">
          <div className="absolute left-0 top-16 h-12 w-3 rounded-full bg-cyan-300/45" />
          <div className="absolute left-8 top-10 h-18 w-3 rounded-full bg-emerald-300/50" />
          <div className="absolute left-16 top-14 h-14 w-3 rounded-full bg-rose-300/45" />
          <div className="absolute left-24 top-5 h-24 w-3 rounded-full bg-cyan-200/55" />
          <div className="absolute left-32 top-11 h-17 w-3 rounded-full bg-emerald-300/45" />
          <div className="absolute left-40 top-7 h-21 w-3 rounded-full bg-cyan-300/50" />
          <div className="absolute left-48 top-13 h-15 w-3 rounded-full bg-rose-300/45" />
          <div className="absolute left-56 top-2 h-26 w-3 rounded-full bg-cyan-200/60" />
        </div>
      </div>
      <div className="absolute inset-x-10 top-12 h-px -rotate-6 bg-gradient-to-r from-transparent via-cyan-300/40 to-transparent" />
    </>
  );
}

function MacroArt() {
  return (
    <>
      <div className="absolute -right-10 top-8 h-44 w-44 rounded-full bg-cyan-300/10 blur-2xl" />
      <div className="absolute left-10 top-10 h-28 w-28 rounded-full border border-white/10" />
      <div className="absolute left-24 top-24 h-28 w-28 rounded-full border border-emerald-300/15" />
      <div className="absolute left-16 top-16 h-px w-48 rotate-12 bg-gradient-to-r from-cyan-300/10 via-cyan-300/55 to-transparent" />
      <div className="absolute bottom-10 left-10 right-10 flex items-end gap-3">
        <div className="h-8 flex-1 rounded-t-xl bg-cyan-300/15" />
        <div className="h-14 flex-1 rounded-t-xl bg-cyan-300/25" />
        <div className="h-20 flex-1 rounded-t-xl bg-emerald-300/25" />
        <div className="h-11 flex-1 rounded-t-xl bg-rose-300/20" />
      </div>
    </>
  );
}

function FinanceArt() {
  return (
    <>
      <div className="absolute -left-8 top-8 h-32 w-48 rounded-[2rem] border border-emerald-300/15 bg-emerald-300/10" />
      <div className="absolute left-6 top-14 h-20 w-36 rounded-[1.5rem] border border-white/10 bg-slate-950/35" />
      <div className="absolute right-10 top-10 h-28 w-20 rounded-2xl border border-cyan-300/20 bg-cyan-300/10" />
      <div className="absolute right-[3.4rem] top-[4.25rem] text-3xl font-semibold text-cyan-100/80">$</div>
      <div className="absolute bottom-8 left-8 right-8 flex gap-3">
        <div className="h-3 flex-1 rounded-full bg-emerald-300/20" />
        <div className="h-3 w-20 rounded-full bg-cyan-300/25" />
        <div className="h-3 w-12 rounded-full bg-white/10" />
      </div>
    </>
  );
}

function BreakingArt() {
  return (
    <>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(251,191,36,0.18),_transparent_28%),radial-gradient(circle_at_bottom_right,_rgba(244,63,94,0.14),_transparent_28%)]" />
      <div className="absolute left-8 top-8 rounded-full border border-amber-300/20 bg-amber-300/10 px-4 py-2 text-xs uppercase tracking-[0.28em] text-amber-200">
        Alert
      </div>
      <div className="absolute left-8 top-24 h-2 w-44 rounded-full bg-rose-300/30" />
      <div className="absolute left-8 top-32 h-2 w-28 rounded-full bg-cyan-300/20" />
      <div className="absolute right-10 bottom-10 h-24 w-24 rounded-full border border-rose-300/15 bg-rose-300/10 shadow-[0_0_80px_rgba(244,63,94,0.18)]" />
    </>
  );
}

function CategoryScene({ category }: { category: ArticleRecord["category"]["slug"] }) {
  switch (category) {
    case "crypto":
      return <CryptoArt />;
    case "finance":
      return <FinanceArt />;
    case "macro":
      return <MacroArt />;
    case "breaking":
      return <BreakingArt />;
    case "markets":
    default:
      return <MarketsArt />;
  }
}

export function ArticleFallbackArt({
  article,
  compact = false
}: {
  article: ArticleRecord;
  compact?: boolean;
}) {
  return (
    <div className="relative h-full min-h-[220px] overflow-hidden bg-[linear-gradient(135deg,_rgba(9,19,35,1)_0%,_rgba(10,20,39,1)_55%,_rgba(7,14,28,1)_100%)]">
      <CategoryScene category={article.category.slug} />
      <div className="absolute inset-0 bg-gradient-to-t from-[#08101f] via-transparent to-transparent" />
      <div className={`${compact ? "absolute bottom-5 left-5 right-5" : "absolute bottom-8 left-7 right-7"}`}>
        <div className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1 text-[11px] uppercase tracking-[0.24em] text-cyan-200">
          {article.category.slug}
        </div>
        <p className={`${compact ? "mt-4 text-xl" : "mt-5 text-3xl"} max-w-[18rem] font-semibold leading-tight text-white/86`}>
          {article.source.name}
        </p>
        <p className="mt-2 text-sm text-slate-400">Live briefing preview</p>
      </div>
    </div>
  );
}
