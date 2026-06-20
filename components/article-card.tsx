"use client";

import Image from "next/image";
import Link from "next/link";

import { buildArticleImpactLabels } from "@/lib/article-insights";
import {
  getArticleCtaLabel,
  getArticleHref,
  getArticleLinkRel,
  getArticleLinkTarget
} from "@/lib/articles";
import { FavoriteToggle } from "@/components/favorite-toggle";
import { ImpactLabels } from "@/components/impact-labels";
import type { ArticleRecord } from "@/lib/types";
import { useFavorites } from "@/lib/client-favorites";
import { formatDate } from "@/lib/utils";
import { ArticleFallbackArt } from "@/components/article-fallback-art";
import { NewsCardShell } from "@/components/news-card-shell";

export function ArticleCard({ article }: { article: ArticleRecord }) {
  const { favorites, toggleSource } = useFavorites();
  const href = getArticleHref(article);
  const target = getArticleLinkTarget(article);
  const rel = getArticleLinkRel(article);
  const impactLabels = buildArticleImpactLabels(article);
  const favoriteSource = favorites.sources.includes(article.source.slug);

  return (
    <NewsCardShell className="overflow-hidden" contentClassName="h-full" patternText={article.category.slug}>
      {article.coverImage ? (
        <div className="relative h-52 overflow-hidden rounded-t-[1.45rem]">
          <Image src={article.coverImage} alt={article.title} fill className="object-cover transition duration-700 ease-out news-card-media" />
        </div>
      ) : (
        <div className="relative h-52 overflow-hidden rounded-t-[1.45rem]">
          <ArticleFallbackArt article={article} compact />
        </div>
      )}
      <div className="p-5">
        <div className="flex items-center gap-3 text-xs uppercase tracking-[0.2em] text-slate-400">
          <span>{article.category.slug}</span>
          <span className="h-1 w-1 rounded-full bg-slate-500" />
          <span>{formatDate(article.publishedAt)}</span>
        </div>
        <h3 className="mt-4 text-xl font-semibold text-white">
          <Link href={href} target={target} rel={rel} className="hover:text-cyan-200">
            {article.title}
          </Link>
        </h3>
        <ImpactLabels items={impactLabels} />
        <p className="mt-3 text-sm leading-6 text-slate-300">{article.excerpt}</p>
        <div className="mt-5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-slate-400">{article.source.name}</span>
            <FavoriteToggle
              compact
              active={favoriteSource}
              onToggle={() => toggleSource(article.source.slug)}
              title={favoriteSource ? `Unpin ${article.source.name}` : `Pin ${article.source.name}`}
            />
          </div>
          <Link href={href} target={target} rel={rel} className="text-sm font-medium text-cyan-300 hover:text-cyan-200">
            {getArticleCtaLabel(article)}
          </Link>
        </div>
      </div>
    </NewsCardShell>
  );
}
