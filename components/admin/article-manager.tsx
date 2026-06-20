"use client";

import { useState } from "react";

import type { ArticleRecord, SourceRecord } from "@/lib/types";
import { slugify } from "@/lib/utils";

type CategoryOption = {
  id: number;
  name: string;
  slug: string;
};

type FormState = {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  isFeatured: boolean;
  publishedAt: string;
  sourceId: string;
  categoryId: string;
};

const emptyForm: FormState = {
  title: "",
  slug: "",
  excerpt: "",
  content: "",
  coverImage: "",
  isFeatured: false,
  publishedAt: new Date().toISOString().slice(0, 16),
  sourceId: "",
  categoryId: ""
};

export function ArticleManager({
  initialArticles,
  sources,
  categories
}: {
  initialArticles: ArticleRecord[];
  sources: SourceRecord[];
  categories: CategoryOption[];
}) {
  const [articles, setArticles] = useState(initialArticles);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [status, setStatus] = useState("");

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus("Saving article...");

    const payload = {
      ...form,
      slug: form.slug || slugify(form.title),
      isFeatured: form.isFeatured,
      sourceId: Number(form.sourceId),
      categoryId: Number(form.categoryId),
      coverImage: form.coverImage || null,
      publishedAt: new Date(form.publishedAt).toISOString()
    };

    const response = await fetch(editingId ? `/api/articles/${editingId}` : "/api/articles", {
      method: editingId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    const result = await response.json();
    if (!response.ok) {
      setStatus(result.error ?? "Failed to save article.");
      return;
    }

    const nextArticle = result.article as ArticleRecord;
    setArticles((current) => {
      const filtered = current.filter((item) => item.id !== nextArticle.id);
      return [nextArticle, ...filtered].sort(
        (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
    });
    setEditingId(null);
    setForm(emptyForm);
    setStatus("Article saved.");
  }

  return (
    <div className="space-y-6">
      <form onSubmit={submitForm} className="panel grid gap-4 p-6 md:grid-cols-2">
        <div className="md:col-span-2">
          <h2 className="text-xl font-semibold text-white">{editingId ? "Edit article" : "Create article"}</h2>
        </div>
        <input
          value={form.title}
          onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
          placeholder="Headline"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none md:col-span-2"
        />
        <input
          value={form.slug}
          onChange={(event) => setForm((current) => ({ ...current, slug: event.target.value }))}
          placeholder="Slug (optional)"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none md:col-span-2"
        />
        <textarea
          value={form.excerpt}
          onChange={(event) => setForm((current) => ({ ...current, excerpt: event.target.value }))}
          placeholder="Excerpt"
          rows={3}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none md:col-span-2"
        />
        <textarea
          value={form.content}
          onChange={(event) => setForm((current) => ({ ...current, content: event.target.value }))}
          placeholder="Article content"
          rows={8}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none md:col-span-2"
        />
        <input
          value={form.coverImage}
          onChange={(event) => setForm((current) => ({ ...current, coverImage: event.target.value }))}
          placeholder="Cover image URL"
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none md:col-span-2"
        />
        <select
          value={form.categoryId}
          onChange={(event) => setForm((current) => ({ ...current, categoryId: event.target.value }))}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
        >
          <option value="">Select category</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        <select
          value={form.sourceId}
          onChange={(event) => setForm((current) => ({ ...current, sourceId: event.target.value }))}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
        >
          <option value="">Select source</option>
          {sources.map((source) => (
            <option key={source.id} value={source.id}>
              {source.name}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          value={form.publishedAt}
          onChange={(event) => setForm((current) => ({ ...current, publishedAt: event.target.value }))}
          className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-white outline-none"
        />
        <label className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <input
            type="checkbox"
            checked={form.isFeatured}
            onChange={(event) => setForm((current) => ({ ...current, isFeatured: event.target.checked }))}
          />
          Featured story
        </label>
        <div className="md:col-span-2 flex items-center gap-4">
          <button className="rounded-full bg-cyan-300 px-5 py-3 text-sm font-semibold text-slate-950">
            {editingId ? "Update article" : "Publish article"}
          </button>
          {status ? <p className="text-sm text-slate-400">{status}</p> : null}
        </div>
      </form>

      <div className="panel overflow-hidden">
        <div className="border-b border-white/10 px-6 py-4">
          <h2 className="text-xl font-semibold text-white">Recent articles</h2>
        </div>
        <div className="divide-y divide-white/10">
          {articles.map((article) => (
            <div key={article.id} className="flex flex-col gap-3 px-6 py-5 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-medium text-white">{article.title}</h3>
                  {article.isFeatured ? (
                    <span className="rounded-full bg-cyan-300/15 px-2 py-1 text-xs text-cyan-200">featured</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm text-slate-400">{article.excerpt}</p>
                <p className="mt-2 text-xs uppercase tracking-[0.2em] text-slate-500">
                  {article.category.slug} · {article.source.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingId(article.id);
                  setForm({
                    title: article.title,
                    slug: article.slug,
                    excerpt: article.excerpt,
                    content: article.content,
                    coverImage: article.coverImage ?? "",
                    isFeatured: article.isFeatured,
                    publishedAt: new Date(article.publishedAt).toISOString().slice(0, 16),
                    sourceId: String(article.sourceId),
                    categoryId: String(article.categoryId)
                  });
                }}
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-slate-300"
              >
                Edit
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
