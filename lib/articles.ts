import type { ArticleRecord } from "@/lib/types";

export function isExternalArticle(article: ArticleRecord) {
  return Boolean(article.externalUrl);
}

export function getArticleHref(article: ArticleRecord) {
  return article.externalUrl ?? `/article/${article.slug}`;
}

export function getArticleCtaLabel(article: ArticleRecord) {
  return isExternalArticle(article) ? "Open source" : "Open briefing";
}

export function getArticleLinkTarget(article: ArticleRecord) {
  return isExternalArticle(article) ? "_blank" : undefined;
}

export function getArticleLinkRel(article: ArticleRecord) {
  return isExternalArticle(article) ? "noreferrer" : undefined;
}
