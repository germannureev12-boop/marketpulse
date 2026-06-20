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

export function FeaturedArticle({ article }: { article: ArticleRecord }) {
  const { favorites, toggleSource } = useFavorites();
  const href = getArticleHref(article);
  const target = getArticleLinkTarget(article);
  const rel = getArticleLinkRel(article);
  const impactLabels = buildArticleImpactLabels(article);
  const favoriteSource = favorites.sources.includes(article.source.slug);

  return (
    <NewsCardShell className="overflow-hidden" contentClassName="h-full" patternText={article.category.slug} variant="featured">
      <div className="grid gap-0 lg:grid-cols-[1.3fr_1fr]">
        <div className="relative min-h-[320px]">
          {article.coverImage ? (
            <Image src={article.coverImage} alt={article.title} fill className="object-cover transition duration-700 ease-out news-card-media" />
          ) : (
            <ArticleFallbackArt article={article} />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        </div>
        <div className="flex flex-col justify-between p-7">
          <div>
            <p className="eyebrow">{article.category.slug}</p>
            <h1 className="mt-4 text-3xl font-semibold leading-tight text-white sm:text-4xl">
              <Link href={href} target={target} rel={rel}>
                {article.title}
              </Link>
            </h1>
            <ImpactLabels items={impactLabels} />
            <p className="mt-5 text-base leading-7 text-slate-300">{article.excerpt}</p>
          </div>
          <div className="mt-8 flex flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2">
              <span>
                {article.source.name} | {formatDate(article.publishedAt)}
              </span>
              <FavoriteToggle
                compact
                active={favoriteSource}
                onToggle={() => toggleSource(article.source.slug)}
                title={favoriteSource ? `Unpin ${article.source.name}` : `Pin ${article.source.name}`}
              />
            </div>
            <Link
              href={href}
              target={target}
              rel={rel}
              className="news-card-cta rounded-full border border-cyan-300/30 bg-cyan-300/10 px-4 py-2 font-medium text-cyan-200"
            >
              {getArticleCtaLabel(article)}
            </Link>
          </div>
        </div>
      </div>
    </NewsCardShell>
  );
}
