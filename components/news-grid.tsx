import { ArticleCard } from "@/components/article-card";
import type { ArticleRecord } from "@/lib/types";

export function NewsGrid({ articles }: { articles: ArticleRecord[] }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
