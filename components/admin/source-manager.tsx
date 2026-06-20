"use client";

import { useMemo, useState } from "react";

import { FavoriteToggle } from "@/components/favorite-toggle";
import { useFavorites } from "@/lib/client-favorites";
import { getNextSyncAt } from "@/lib/news-ingestion/source-timing";
import type { CategorySlug, SourceKind, SourceRecord } from "@/lib/types";
import { formatDate, slugify } from "@/lib/utils";

type FormState = {
  name: string;
  slug: string;
  url: string;
  description: string;
  kind: SourceKind;
  feedUrl: string;
  categorySlug: CategorySlug | "";
  priority: string;
  pollIntervalMinutes: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  name: "",
  slug: "",
  url: "",
  description: "",
  kind: "rss",
  feedUrl: "",
  categorySlug: "markets",
  priority: "100",
  pollIntervalMinutes: "30",
  isActive: true
};

const categoryOptions: Array<{ value: CategorySlug; label: string }> = [
  { value: "crypto", label: "Crypto" },
  { value: "finance", label: "Finance" },
  { value: "macro", label: "Macro" },
  { value: "markets", label: "Markets" },
  { value: "breaking", label: "Breaking" }
];

function formatTimeUntil(date: Date) {
  const diffMs = date.getTime() - Date.now();
  if (diffMs <= 0) {
    return "due now";
  }

  const totalMinutes = Math.ceil(diffMs / 60000);
  if (totalMinutes < 60) {
    return `in ${totalMinutes}m`;
  }

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `in ${hours}h ${minutes}m` : `in ${hours}h`;
}

export function SourceManager({ initialSources }: { initialSources: SourceRecord[] }) {
  const [sources, setSources] = useState(initialSources);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus] = useState<string>("");
  const [syncingId, setSyncingId] = useState<number | "all" | null>(null);
  const { favorites, toggleSource } = useFavorites();

  const activeSyncSources = useMemo(
    () => sources.filter((source) => source.isActive && source.kind !== "manual").length,
    [sources]
  );

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving source...");

    const payload = {
      ...form,
      slug: form.slug || slugify(form.name),
      description: form.description || null,
      feedUrl: form.feedUrl || null,
      categorySlug: form.categorySlug || null,
      priority: Number(form.priority),
      pollIntervalMinutes: Number(form.pollIntervalMinutes),
      configJson: form.kind === "api" && (form.slug === "gnews-wire" || form.name.toLowerCase().includes("gnews")) ? { provider: "gnews" } : null
    };

    const response = await fetch(editingId ? `/api/sources/${editingId}` : "/api/sources", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error ?? "Failed to save source.");
      return;
    }

    const nextSource = result.source as SourceRecord;
    setSources((current) => {
      const filtered = current.filter((item) => item.id !== nextSource.id);
      return [...filtered, nextSource].sort((a, b) => a.priority - b.priority || a.name.localeCompare(b.name));
    });
    setForm(emptyForm);
    setEditingId(null);
    setStatus("Source saved.");
  }

  async function runSync(sourceId?: number) {
    setSyncingId(sourceId ?? "all");
    setStatus(sourceId ? "Syncing source..." : "Syncing active sources...");

    const response = await fetch("/api/admin/sync-news", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sourceId ? { sourceId } : {})
    });

    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error ?? "Sync failed.");
      setSyncingId(null);
      return;
    }

    const summary = sourceId
      ? result.result as { result?: never; created: number; updated: number; fetched: number; errors: string[] }
      : null;

    if (sourceId) {
      setStatus(
        `Source synced: ${summary?.created ?? 0} new, ${summary?.updated ?? 0} refreshed, ${summary?.errors?.length ?? 0} issues.`
      );
    } else {
      const totals = result.result?.totals;
      setStatus(
        `Sync complete: ${totals?.created ?? 0} new, ${totals?.updated ?? 0} refreshed, ${totals?.errors ?? 0} issues.`
      );
    }

    try {
      const refreshed = await fetch("/api/sources", { cache: "no-store" });
      const payload = await refreshed.json();
      if (refreshed.ok) {
        setSources(payload.sources as SourceRecord[]);
      }
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.05fr_1.4fr]">
      <form onSubmit={submitForm} className="panel space-y-4 p-6">
        <div className="flex items-center justify-between gap-4">
          <h2 className="text-xl font-semibold text-white">{editingId ? "Edit source" : "Add source"}</h2>
          <button
            type="button"
            onClick={() => void runSync()}
            disabled={syncingId !== null || activeSyncSources === 0}
            className="rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 text-sm font-medium text-cyan-200 disabled:opacity-50"
          >
            {syncingId === "all" ? "Syncing..." : "Sync all"}
          </button>
        </div>
        <input
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="Source name"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
        />
        <input
          value={form.slug}
          onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
          placeholder="Slug (optional)"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <select
            value={form.kind}
            onChange={(event) => setForm((current) => ({ ...current, kind: event.target.value as SourceKind }))}
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          >
            <option value="rss">RSS feed</option>
            <option value="api">API source</option>
            <option value="manual">Manual only</option>
          </select>
          <select
            value={form.categorySlug}
            onChange={(event) =>
              setForm((current) => ({ ...current, categorySlug: event.target.value as CategorySlug | "" }))
            }
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          >
            <option value="">Auto-detect category</option>
            {categoryOptions.map((category) => (
              <option key={category.value} value={category.value}>
                {category.label}
              </option>
            ))}
          </select>
        </div>
        <input
          value={form.url}
          onChange={(event) => setForm((current) => ({ ...current, url: event.target.value }))}
          placeholder="https://source.example"
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
        />
        <input
          value={form.feedUrl}
          onChange={(event) => setForm((current) => ({ ...current, feedUrl: event.target.value }))}
          placeholder={form.kind === "rss" ? "https://source.example/rss.xml" : "Optional endpoint / descriptor"}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
        />
        <div className="grid gap-4 md:grid-cols-2">
          <input
            value={form.priority}
            onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))}
            placeholder="Priority"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          />
          <input
            value={form.pollIntervalMinutes}
            onChange={(event) => setForm((current) => ({ ...current, pollIntervalMinutes: event.target.value }))}
            placeholder="Poll every N minutes"
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
          />
        </div>
        <textarea
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Description"
          rows={4}
          className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
        />
        <label className="flex items-center gap-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.isActive}
            onChange={(event) => setForm((current) => ({ ...current, isActive: event.target.checked }))}
          />
          Active source
        </label>
        <button className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950">
          {editingId ? "Update source" : "Create source"}
        </button>
        {status ? <p className="text-sm text-slate-400">{status}</p> : null}
      </form>

      <div className="panel overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Current sources</h2>
        </div>
        <div className="divide-y divide-white/10">
          {sources.map((source) => {
            const nextSyncAt =
              source.kind !== "manual" && source.isActive
                ? getNextSyncAt(source.lastFetchedAt, source.pollIntervalMinutes)
                : null;
            const favoriteSource = favorites.sources.includes(source.slug);

            return (
              <div key={source.id} className="flex flex-col gap-4 px-6 py-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-3">
                      <h3 className="font-medium text-white">{source.name}</h3>
                      <FavoriteToggle
                        compact
                        active={favoriteSource}
                        onToggle={() => toggleSource(source.slug)}
                        title={favoriteSource ? `Unpin ${source.name}` : `Pin ${source.name}`}
                      />
                      <span
                        className={`rounded-full px-2 py-1 text-xs ${
                          source.isActive ? "bg-emerald-400/15 text-emerald-300" : "bg-slate-500/15 text-slate-400"
                        }`}
                      >
                        {source.isActive ? "active" : "inactive"}
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-1 text-xs uppercase tracking-[0.2em] text-slate-300">
                        {source.kind}
                      </span>
                      <span className="rounded-full bg-white/5 px-2 py-1 text-xs text-slate-400">P{source.priority}</span>
                    </div>
                    <p className="mt-2 text-sm text-slate-400">{source.description}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-xs text-slate-500">
                      <span>{source.slug}</span>
                      <span>{source.categorySlug ?? "auto category"}</span>
                      <span>every {source.pollIntervalMinutes}m</span>
                      <span>{source.lastFetchedAt ? `last sync ${formatDate(source.lastFetchedAt)}` : "not synced yet"}</span>
                      {nextSyncAt ? <span>{`next sync ${formatTimeUntil(nextSyncAt)}`}</span> : null}
                    </div>
                    {source.lastError ? <p className="mt-2 text-xs text-rose-300/80">{source.lastError}</p> : null}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => void runSync(source.id)}
                      disabled={syncingId !== null || !source.isActive || source.kind === "manual"}
                      className="rounded-full border border-emerald-300/25 bg-emerald-300/10 px-4 py-2 text-sm text-emerald-200 disabled:opacity-50"
                    >
                      {syncingId === source.id ? "Syncing..." : "Sync"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(source.id);
                        setForm({
                          name: source.name,
                          slug: source.slug,
                          url: source.url,
                          description: source.description ?? "",
                          kind: source.kind,
                          feedUrl: source.feedUrl ?? "",
                          categorySlug: source.categorySlug ?? "",
                          priority: String(source.priority),
                          pollIntervalMinutes: String(source.pollIntervalMinutes),
                          isActive: source.isActive
                        });
                      }}
                      className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
