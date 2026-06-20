import { describe, expect, it } from "vitest";

import { dedupeImportedArticles, inferCategoryFromText, parseRssItems } from "./helpers";

describe("news ingestion helpers", () => {
  it("parses rss items with image, date, and text cleanup", () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title><![CDATA[Bitcoin jumps on ETF demand]]></title>
            <description><![CDATA[<p>Fresh flows push BTC higher.</p>]]></description>
            <content:encoded><![CDATA[<p>Full coverage</p>]]></content:encoded>
            <link>https://example.com/btc</link>
            <guid>btc-1</guid>
            <pubDate>Fri, 20 Jun 2026 10:00:00 GMT</pubDate>
            <enclosure url="https://example.com/btc.jpg" type="image/jpeg" />
          </item>
        </channel>
      </rss>
    `;

    const [item] = parseRssItems(xml);

    expect(item.title).toBe("Bitcoin jumps on ETF demand");
    expect(item.excerpt).toContain("Fresh flows");
    expect(item.externalUrl).toBe("https://example.com/btc");
    expect(item.coverImage).toBe("https://example.com/btc.jpg");
  });

  it("extracts image from html description when feed has no enclosure", () => {
    const xml = `
      <rss>
        <channel>
          <item>
            <title>Rates outlook</title>
            <description><![CDATA[<img src="https://example.com/macro.jpg" /><p>Macro preview</p>]]></description>
            <link>https://example.com/macro</link>
            <pubDate>Fri, 20 Jun 2026 12:00:00 GMT</pubDate>
          </item>
        </channel>
      </rss>
    `;

    const [item] = parseRssItems(xml);

    expect(item.coverImage).toBe("https://example.com/macro.jpg");
  });

  it("dedupes repeated imported articles", () => {
    const publishedAt = new Date("2026-06-20T10:00:00Z");
    const items = [
      {
        title: "BTC update",
        excerpt: "a",
        content: "a",
        coverImage: null,
        externalUrl: "https://example.com/a",
        externalId: "1",
        publishedAt,
        importanceScore: 70,
        categorySlug: "crypto" as const,
        source: { id: 1, name: "A", slug: "a", url: "https://example.com" }
      },
      {
        title: "BTC update",
        excerpt: "a",
        content: "a",
        coverImage: null,
        externalUrl: "https://example.com/a",
        externalId: "1",
        publishedAt,
        importanceScore: 70,
        categorySlug: "crypto" as const,
        source: { id: 1, name: "A", slug: "a", url: "https://example.com" }
      }
    ];

    expect(dedupeImportedArticles(items)).toHaveLength(1);
  });

  it("infers breaking and crypto categories from headline text", () => {
    expect(inferCategoryFromText("Breaking: Bitcoin surges", "")).toBe("crypto");
    expect(inferCategoryFromText("Fed holds rates steady", "")).toBe("macro");
  });
});
