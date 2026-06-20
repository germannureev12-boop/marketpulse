import { AdminShell } from "@/components/admin/admin-shell";
import { ArticleManager } from "@/components/admin/article-manager";
import { getArticles, getCategories, getSources } from "@/lib/data";

export default async function AdminArticlesPage() {
  const [articles, sources, categories] = await Promise.all([getArticles(), getSources(), getCategories()]);

  return (
    <AdminShell title="Manage Articles">
      <ArticleManager initialArticles={articles} sources={sources} categories={categories} />
    </AdminShell>
  );
}
