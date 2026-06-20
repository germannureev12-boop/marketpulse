import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { ArticleCard } from "@/components/article-card";
import { ImpactLabels } from "@/components/impact-labels";
import { buildArticleImpactLabels } from "@/lib/article-insights";
import { getArticleBySlug, getRelatedArticles } from "@/lib/data";
import { formatDate } from "@/lib/utils";

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = await getRelatedArticles(article.category.slug, article.slug);
  const impactLabels = buildArticleImpactLabels(article);

  return (
    <main className="space-y-10">
      <article className="panel overflow-hidden">
        {article.coverImage ? (
          <div className="relative h-[340px] sm:h-[480px]">
            <Image src={article.coverImage} alt={article.title} fill className="object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-[#07111f] via-black/20 to-transparent" />
          </div>
        ) : null}
        <div className="p-6 sm:p-10">
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.22em] text-slate-400">
            <Link href={`/category/${article.category.slug}`} className="text-cyan-300">
              {article.category.slug}
            </Link>
            <span className="h-1 w-1 rounded-full bg-slate-500" />
            <span>{article.source.name}</span>
            <span className="h-1 w-1 rounded-full bg-slate-500" />
            <span>{formatDate(article.publishedAt)}</span>
          </div>
          <h1 className="mt-5 max-w-4xl text-4xl font-semibold leading-tight text-white sm:text-5xl">
            {article.title}
          </h1>
          <ImpactLabels items={impactLabels} />
          <p className="mt-5 max-w-3xl text-lg leading-8 text-slate-300">{article.excerpt}</p>
          <div className="mt-8 max-w-3xl whitespace-pre-line text-base leading-8 text-slate-200">
            {article.content}
          </div>
        </div>
      </article>

      <section className="space-y-5">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Related coverage</h2>
          <Link href={`/category/${article.category.slug}`} className="text-sm text-cyan-300">
            Back to {article.category.slug}
          </Link>
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {related.map((item) => (
            <ArticleCard key={item.id} article={item} />
          ))}
        </div>
      </section>
    </main>
  );
}
