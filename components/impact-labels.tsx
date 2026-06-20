import type { ArticleImpactLabel } from "@/lib/article-insights";

const toneClasses: Record<ArticleImpactLabel["tone"], string> = {
  cyan: "border-cyan-300/20 bg-cyan-300/10 text-cyan-200",
  emerald: "border-emerald-300/20 bg-emerald-300/10 text-emerald-200",
  rose: "border-rose-300/20 bg-rose-300/10 text-rose-200",
  amber: "border-amber-300/20 bg-amber-300/10 text-amber-200",
  slate: "border-white/10 bg-white/5 text-slate-300"
};

export function ImpactLabels({ items }: { items: ArticleImpactLabel[] }) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={`${item.label}-${item.tone}`}
          className={`rounded-full border px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.18em] ${toneClasses[item.tone]}`}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}
