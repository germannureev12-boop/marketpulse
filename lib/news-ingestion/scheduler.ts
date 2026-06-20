import { syncDueSources } from "@/lib/news-ingestion/sync";

declare global {
  var __marketpulseNewsSchedulerStarted__: boolean | undefined;
  var __marketpulseNewsSchedulerTimer__: ReturnType<typeof setInterval> | undefined;
  var __marketpulseNewsSchedulerRunning__: boolean | undefined;
}

export function shouldEnableAutoSync(value: string | undefined) {
  if (!value) {
    return true;
  }

  return !["0", "false", "off", "no"].includes(value.trim().toLowerCase());
}

export function getAutoSyncIntervalMs(value: string | undefined) {
  const minutes = Number(value ?? "15");
  const safeMinutes = Number.isFinite(minutes) ? Math.max(5, minutes) : 15;
  return safeMinutes * 60 * 1000;
}

async function runAutoSync(reason: string) {
  if (globalThis.__marketpulseNewsSchedulerRunning__) {
    return;
  }

  globalThis.__marketpulseNewsSchedulerRunning__ = true;

  try {
    const result = await syncDueSources();
    const totals = result.totals;
    console.log(
      `[news-auto-sync] ${reason}: fetched=${totals.fetched} created=${totals.created} updated=${totals.updated} errors=${totals.errors}`
    );
  } catch (error) {
    console.error("[news-auto-sync] sync failed", error);
  } finally {
    globalThis.__marketpulseNewsSchedulerRunning__ = false;
  }
}

export function startNewsAutoSync() {
  if (typeof window !== "undefined") {
    return;
  }

  if (!shouldEnableAutoSync(process.env.NEWS_AUTO_SYNC_ENABLED)) {
    return;
  }

  if (globalThis.__marketpulseNewsSchedulerStarted__) {
    return;
  }

  globalThis.__marketpulseNewsSchedulerStarted__ = true;

  const intervalMs = getAutoSyncIntervalMs(process.env.NEWS_AUTO_SYNC_INTERVAL_MINUTES);

  void runAutoSync("startup");

  globalThis.__marketpulseNewsSchedulerTimer__ = setInterval(() => {
    void runAutoSync("interval");
  }, intervalMs);

  console.log(`[news-auto-sync] started with interval ${Math.round(intervalMs / 60000)}m`);
}
