import Link from "next/link";

import { ImpactLabels } from "@/components/impact-labels";
import { buildArticleImpactLabels } from "@/lib/article-insights";
import { getArticleHref, getArticleLinkRel, getArticleLinkTarget } from "@/lib/articles";
import type { ArticleRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function MarketRelatedNews({ articles, assetName }: { articles: ArticleRecord[]; assetName: string }) {
  if (articles.length === 0) {
    return null;
  }

  return (
    <section className="panel p-4 xl:shrink-0">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="xl:w-48 xl:shrink-0">
          <p className="eyebrow">Asset-linked news</p>
          <h2 className="mt-2 text-lg font-semibold text-white">{assetName} flow</h2>
          <p className="mt-2 text-sm leading-6 text-slate-400">Compact linked headlines, with the chart left as the main focus.</p>
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] uppercase tracking-[0.2em] text-slate-500">Headline stream</p>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-400">
              {articles.length} linked headlines
            </span>
          </div>

          <div className="grid gap-3 xl:grid-cols-3">
            {articles.map((article) => {
              const href = getArticleHref(article);
              const target = getArticleLinkTarget(article);
              const rel = getArticleLinkRel(article);

              return (
                <Link
                  key={article.id}
                  href={href}
                  target={target}
                  rel={rel}
                  className="rounded-2xl border border-white/8 bg-white/5 p-3 transition hover:border-cyan-300/25 hover:bg-white/[0.07]"
                >
                  <div className="flex items-center gap-3 text-[11px] uppercase tracking-[0.18em] text-slate-500">
                    <span>{article.category.slug}</span>
                    <span>{formatDate(article.publishedAt)}</span>
                  </div>
                  <h3 className="mt-2 text-base font-semibold leading-6 text-white">{article.title}</h3>
                  <ImpactLabels items={buildArticleImpactLabels(article)} />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
