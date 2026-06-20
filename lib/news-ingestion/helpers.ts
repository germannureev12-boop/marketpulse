import type { CategorySlug, SourceRecord } from "@/lib/types";
import { slugify } from "@/lib/utils";

import type { ImportedArticleCandidate } from "@/lib/news-ingestion/types";

const categoryKeywords: Record<CategorySlug, RegExp> = {
  crypto: /(bitcoin|ethereum|solana|crypto|token|stablecoin|blockchain|defi|etf)/i,
  finance: /(bank|finance|earnings|credit|payments|fund|lender|treasury desk)/i,
  macro: /(inflation|fed|ecb|rates|economy|gdp|jobs|cpi|ppi|macro)/i,
  markets: /(stocks|equities|futures|market|nasdaq|s&p|dow|bond|yield)/i,
  breaking: /(breaking|urgent|surge|crash|plunge|jumps|shock|halts)/i
};

function decodeXml(input: string) {
  return input
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function stripTags(input: string) {
  return decodeXml(input).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function extractTag(block: string, tag: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
  return match?.[1]?.trim() ?? null;
}

function extractAttr(block: string, tag: string, attr: string) {
  const match = block.match(new RegExp(`<${tag}[^>]*${attr}="([^"]+)"[^>]*>`, "i"));
  return match?.[1] ?? null;
}

function extractImageFromHtml(input: string | null) {
  if (!input) {
    return null;
  }

  const imgMatch = input.match(/<img[^>]+src="([^"]+)"/i);
  return imgMatch?.[1] ?? null;
}

export function inferCategoryFromText(title: string, excerpt: string, fallback: CategorySlug = "markets"): CategorySlug {
  const haystack = `${title} ${excerpt}`;
  for (const [category, pattern] of Object.entries(categoryKeywords) as Array<[CategorySlug, RegExp]>) {
    if (pattern.test(haystack)) {
      return category;
    }
  }

  return fallback;
}

export function resolveCategorySlug(source: Pick<SourceRecord, "categorySlug">, title: string, excerpt: string) {
  return source.categorySlug ?? inferCategoryFromText(title, excerpt);
}

export function buildImportedSlug(title: string, publishedAt: Date, sourceSlug: string) {
  const base = slugify(title) || `${sourceSlug}-headline`;
  return `${base}-${sourceSlug}-${publishedAt.getTime()}`;
}

export function clampImportance(candidate: Pick<ImportedArticleCandidate, "publishedAt" | "categorySlug" | "title">) {
  const hoursOld = Math.max(0, (Date.now() - candidate.publishedAt.getTime()) / 36e5);
  const freshnessBoost = Math.max(0, 48 - hoursOld);
  const breakingBoost = candidate.categorySlug === "breaking" ? 20 : 0;
  const bitcoinBoost = /bitcoin|btc|ethereum|eth|solana|sol/i.test(candidate.title) ? 8 : 0;

  return Math.max(10, Math.min(99, Math.round(30 + freshnessBoost + breakingBoost + bitcoinBoost)));
}

export function dedupeImportedArticles(items: ImportedArticleCandidate[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = `${item.source.id}|${item.externalUrl.toLowerCase()}|${item.title.toLowerCase()}`;
    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

export function parseRssItems(xml: string) {
  const itemBlocks = Array.from(xml.matchAll(/<item\b[\s\S]*?<\/item>/gi), (match) => match[0]);

  return itemBlocks.map((item) => {
    const rawDescription = extractTag(item, "description");
    const rawContent = extractTag(item, "content:encoded");
    const title = stripTags(extractTag(item, "title") ?? "Untitled market update");
    const excerpt =
      stripTags(rawDescription ?? rawContent ?? "Open the original story for full coverage.") ||
      "Open the original story for full coverage.";
    const content = stripTags(rawContent ?? rawDescription ?? excerpt) || excerpt;
    const externalUrl = decodeXml(extractTag(item, "link") ?? "").trim();
    const externalId = decodeXml(extractTag(item, "guid") ?? "").trim() || null;
    const pubDate = extractTag(item, "pubDate");
    const imageFromEnclosure = extractAttr(item, "enclosure", "url");
    const imageFromMedia = extractAttr(item, "media:content", "url");
    const imageFromThumbnail = extractAttr(item, "media:thumbnail", "url");
    const imageFromDescription = extractImageFromHtml(rawDescription);
    const imageFromContent = extractImageFromHtml(rawContent);
    const coverImage = imageFromEnclosure ?? imageFromMedia ?? imageFromThumbnail ?? imageFromDescription ?? imageFromContent ?? null;
    const publishedAt = pubDate ? new Date(pubDate) : new Date();

    return {
      title,
      excerpt,
      content,
      externalUrl,
      externalId,
      coverImage,
      publishedAt: Number.isNaN(publishedAt.getTime()) ? new Date() : publishedAt
    };
  });
}
