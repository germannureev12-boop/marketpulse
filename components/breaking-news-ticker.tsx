import Link from "next/link";

import { getArticleHref, getArticleLinkRel, getArticleLinkTarget } from "@/lib/articles";
import type { ArticleRecord } from "@/lib/types";
import { formatDate } from "@/lib/utils";

export function BreakingNewsTicker({ articles }: { articles: ArticleRecord[] }) {
  if (articles.length === 0) {
    return null;
  }

  const items = [...articles, ...articles];

  return (
    <section className="panel overflow-hidden px-0 py-0">
      <div className="flex items-center gap-3 border-b border-white/8 px-4 py-3">
        <span className="rounded-full border border-rose-300/20 bg-rose-300/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.22em] text-rose-200">
          Breaking wire
        </span>
        <p className="text-sm text-slate-400">Latest high-impact headlines moving the tape.</p>
      </div>
      <div className="ticker-shell">
        <div className="ticker-track">
          {items.map((article, index) => {
            const href = getArticleHref(article);
            const target = getArticleLinkTarget(article);
            const rel = getArticleLinkRel(article);

            return (
              <Link
                key={`${article.id}-${index}`}
                href={href}
                target={target}
                rel={rel}
                className="ticker-item"
              >
                <span className="ticker-dot" />
                <span className="ticker-title">{article.title}</span>
                <span className="ticker-meta">{article.source.name}</span>
                <span className="ticker-meta">{formatDate(article.publishedAt)}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
