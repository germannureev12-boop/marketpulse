import { notFound } from "next/navigation";

import { CategoryPills } from "@/components/category-pills";
import { NewsGrid } from "@/components/news-grid";
import { getArticles } from "@/lib/data";

const allowedCategories = new Set(["crypto", "finance", "macro", "markets", "breaking"]);

export default async function CategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  if (!allowedCategories.has(slug)) {
    notFound();
  }

  const articles = await getArticles(slug);

  return (
    <main className="space-y-8">
      <section className="space-y-4">
        <p className="eyebrow">Category view</p>
        <h1 className="text-4xl font-semibold capitalize text-white">{slug}</h1>
        <p className="max-w-2xl text-slate-300">
          Focused coverage for the {slug} desk, ordered by freshness and editorial priority.
        </p>
        <CategoryPills active={slug} />
      </section>
      <NewsGrid articles={articles} />
    </main>
  );
}
