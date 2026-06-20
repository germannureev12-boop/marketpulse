import { AdminShell } from "@/components/admin/admin-shell";
import { getArticles, getCryptoSnapshots, getSources, getTodaySummary } from "@/lib/data";
import { getImportedArticlesCount } from "@/lib/news-ingestion/sync";
import { getAutoSyncIntervalMs, shouldEnableAutoSync } from "@/lib/news-ingestion/scheduler";

export default async function AdminHomePage() {
  const [articles, sources, crypto, summary, importedArticles] = await Promise.all([
    getArticles(),
    getSources(),
    getCryptoSnapshots(),
    getTodaySummary(),
    getImportedArticlesCount().catch(() => 0)
  ]);

  const autoSources = sources.filter((source) => source.isActive && source.kind !== "manual").length;
  const autoSyncEnabled = shouldEnableAutoSync(process.env.NEWS_AUTO_SYNC_ENABLED);
  const autoSyncMinutes = Math.round(getAutoSyncIntervalMs(process.env.NEWS_AUTO_SYNC_INTERVAL_MINUTES) / 60000);

  return (
    <AdminShell title="Editorial Overview">
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-5">
        <div className="panel p-6">
          <p className="eyebrow">Articles</p>
          <p className="mt-4 text-4xl font-semibold text-white">{articles.length}</p>
        </div>
        <div className="panel p-6">
          <p className="eyebrow">Sources</p>
          <p className="mt-4 text-4xl font-semibold text-white">{sources.length}</p>
        </div>
        <div className="panel p-6">
          <p className="eyebrow">Auto feeds</p>
          <p className="mt-4 text-4xl font-semibold text-white">{autoSources}</p>
          <p className="mt-2 text-sm text-slate-400">
            RSS and API sources ready for sync.
            {autoSyncEnabled ? ` Auto-sync runs every ${autoSyncMinutes}m.` : " Auto-sync is disabled."}
          </p>
        </div>
        <div className="panel p-6">
          <p className="eyebrow">Tracked assets</p>
          <p className="mt-4 text-4xl font-semibold text-white">{crypto.length}</p>
        </div>
        <div className="panel p-6">
          <p className="eyebrow">Imported</p>
          <p className="mt-4 text-4xl font-semibold text-white">{importedArticles}</p>
          <p className="mt-2 text-sm text-slate-400">Live stories already persisted in the database.</p>
        </div>
        <div className="panel p-6">
          <p className="eyebrow">Summary</p>
          <p className="mt-4 text-base leading-7 text-slate-300">{summary.title}</p>
        </div>
      </div>
    </AdminShell>
  );
}
