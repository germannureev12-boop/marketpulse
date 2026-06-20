import type { ArticleRecord, CategorySlug } from "@/lib/types";

import { mapGNewsArticle, mapNewsCategoryQuery } from "@/lib/integrations/mappers";

type GNewsResponse = {
  articles?: Array<{
    title: string;
    description?: string | null;
    content?: string | null;
    url: string;
    image?: string | null;
    publishedAt: string;
    source: {
      name: string;
      url: string;
    };
  }>;
};

function getApiKey() {
  return process.env.GNEWS_API_KEY?.trim();
}

export function hasGNewsKey() {
  return Boolean(getApiKey());
}

export async function fetchLiveNews(category?: CategorySlug): Promise<ArticleRecord[]> {
  const apiKey = getApiKey();
  if (!apiKey) {
    throw new Error("Missing GNEWS_API_KEY");
  }

  const query = category ? mapNewsCategoryQuery(category) : "crypto OR finance OR macro OR markets";
  const searchParams = new URLSearchParams({
    q: query,
    lang: "en",
    max: category ? "12" : "10",
    sortby: "publishedAt",
    apikey: apiKey
  });

  const response = await fetch(`https://gnews.io/api/v4/search?${searchParams.toString()}`, {
    headers: {
      accept: "application/json"
    },
    next: {
      revalidate: 300
    }
  });

  if (!response.ok) {
    throw new Error(`GNews request failed with status ${response.status}`);
  }

  const payload = (await response.json()) as GNewsResponse;
  const fallbackCategory: CategorySlug = category ?? "markets";

  return (payload.articles ?? []).map((article, index) => {
    const guessedCategory = category ?? inferCategory(article.title, article.description, fallbackCategory);
    return mapGNewsArticle(article, guessedCategory, index + 1);
  });
}

function inferCategory(title: string, description: string | null | undefined, fallback: CategorySlug): CategorySlug {
  const haystack = `${title} ${description ?? ""}`.toLowerCase();

  if (/(bitcoin|ethereum|solana|crypto|token|stablecoin|blockchain)/.test(haystack)) {
    return "crypto";
  }
  if (/(inflation|fed|ecb|rates|yield|economy|macro)/.test(haystack)) {
    return "macro";
  }
  if (/(stock|equities|bond|market|index|treasury)/.test(haystack)) {
    return "markets";
  }
  if (/(bank|finance|earnings|credit|payments)/.test(haystack)) {
    return "finance";
  }
  if (/(breaking|urgent|surge|crash|shock)/.test(haystack)) {
    return "breaking";
  }

  return fallback;
}
