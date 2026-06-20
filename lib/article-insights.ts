import type { ArticleRecord, MarketSymbol } from "@/lib/types";

export type ArticleImpactLabel = {
  label: string;
  tone: "cyan" | "emerald" | "rose" | "amber" | "slate";
};

const assetMatchers: Array<{ symbol: MarketSymbol; label: string; pattern: RegExp }> = [
  { symbol: "btc", label: "BTC", pattern: /\b(bitcoin|btc)\b/i },
  { symbol: "eth", label: "ETH", pattern: /\b(ethereum|eth)\b/i },
  { symbol: "sol", label: "SOL", pattern: /\b(solana|sol)\b/i }
];

function sourceText(article: ArticleRecord) {
  return `${article.title} ${article.excerpt} ${article.content}`;
}

export function getArticleAssetSignals(article: ArticleRecord): MarketSymbol[] {
  const haystack = sourceText(article);
  return assetMatchers.filter((item) => item.pattern.test(haystack)).map((item) => item.symbol);
}

export function buildArticleImpactLabels(article: ArticleRecord): ArticleImpactLabel[] {
  const labels: ArticleImpactLabel[] = [];
  const haystack = sourceText(article);

  for (const asset of assetMatchers) {
    if (asset.pattern.test(haystack)) {
      labels.push({ label: asset.label, tone: "cyan" });
    }
  }

  if (article.category.slug === "macro" || /\b(fed|inflation|rates|cpi|jobs|yield)\b/i.test(haystack)) {
    labels.push({ label: "Macro", tone: "emerald" });
  }

  if (article.category.slug === "breaking" || article.importanceScore >= 90) {
    labels.push({ label: "Breaking", tone: "rose" });
  }

  if (article.importanceScore >= 80) {
    labels.push({ label: "High impact", tone: "amber" });
  }

  if (labels.length === 0) {
    labels.push({ label: article.category.name, tone: "slate" });
  }

  return labels.slice(0, 4);
}
