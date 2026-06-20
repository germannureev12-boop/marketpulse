import { LiveRelativeTime } from "@/components/live-relative-time";
import type { SiteStatusRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";

const marketStatusTone: Record<SiteStatusRecord["marketStatus"], string> = {
  Live: "text-emerald-300 border-emerald-300/20 bg-emerald-300/10",
  Delayed: "text-amber-200 border-amber-300/20 bg-amber-300/10",
  Fallback: "text-rose-200 border-rose-300/20 bg-rose-300/10"
};

export function LiveStatusBar({ status }: { status: SiteStatusRecord }) {
  return (
    <section className="panel flex flex-col gap-4 px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="grid flex-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Last news refresh</p>
          <p className="mt-2 text-sm font-medium text-white">
            {status.lastNewsRefresh ? formatDate(status.lastNewsRefresh) : "Waiting for first sync"}
          </p>
          <div className="mt-2">
            <LiveRelativeTime value={status.lastNewsRefresh} />
          </div>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Articles imported today</p>
          <p className="mt-2 text-sm font-medium text-white">{status.importedToday}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Active sources</p>
          <p className="mt-2 text-sm font-medium text-white">{status.activeSources}</p>
        </div>
        <div>
          <p className="text-[11px] uppercase tracking-[0.18em] text-slate-500">Market status</p>
          <div className="mt-2">
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${marketStatusTone[status.marketStatus]}`}>
              {status.marketStatus}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
