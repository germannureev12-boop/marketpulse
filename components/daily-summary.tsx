import type { SummaryRecord } from "@/lib/types";
import { NewsCardShell } from "@/components/news-card-shell";

export function DailySummary({ summary }: { summary: SummaryRecord }) {
  return (
    <NewsCardShell className="p-6" patternText="AI Summary" variant="summary">
      <div className="flex items-center justify-between">
        <p className="eyebrow">Daily AI Summary</p>
        <span className="rounded-full bg-white/5 px-3 py-1 text-xs text-slate-400">Refreshed daily</span>
      </div>
      <h2 className="mt-4 text-2xl font-semibold text-white">{summary.title}</h2>
      <p className="mt-4 text-sm leading-7 text-slate-300">{summary.content}</p>
      <div className="mt-6 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
        Use this block for a fast editorial read before scanning individual stories.
      </div>
    </NewsCardShell>
  );
}
