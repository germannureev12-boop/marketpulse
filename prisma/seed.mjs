import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const categories = [
  { name: "Crypto", slug: "crypto" },
  { name: "Finance", slug: "finance" },
  { name: "Macro", slug: "macro" },
  { name: "Markets", slug: "markets" },
  { name: "Breaking", slug: "breaking" }
];

const sources = [
  {
    name: "BlockWire",
    slug: "blockwire",
    url: "https://example.com/blockwire",
    description: "Crypto market structure, ETF flows, and on-chain trends.",
    kind: "manual",
    categorySlug: "crypto"
  },
  {
    name: "Ledger Daily",
    slug: "ledger-daily",
    url: "https://example.com/ledger-daily",
    description: "Institutional digital asset and macro coverage.",
    kind: "manual",
    categorySlug: "markets"
  },
  {
    name: "Macro Current",
    slug: "macro-current",
    url: "https://example.com/macro-current",
    description: "Rates, inflation, growth, and global central bank shifts.",
    kind: "manual",
    categorySlug: "macro"
  },
  {
    name: "CoinDesk RSS",
    slug: "coindesk-rss",
    url: "https://www.coindesk.com",
    description: "RSS feed for crypto headlines and market structure.",
    kind: "rss",
    feedUrl: "https://www.coindesk.com/arc/outboundfeeds/rss/",
    categorySlug: "crypto",
    priority: 10
  },
  {
    name: "Cointelegraph RSS",
    slug: "cointelegraph-rss",
    url: "https://cointelegraph.com",
    description: "Breaking digital asset and blockchain coverage.",
    kind: "rss",
    feedUrl: "https://cointelegraph.com/rss",
    categorySlug: "breaking",
    priority: 20
  },
  {
    name: "CNBC Markets RSS",
    slug: "cnbc-markets-rss",
    url: "https://www.cnbc.com",
    description: "Markets, macro, and earnings-driven RSS feed.",
    kind: "rss",
    feedUrl: "https://www.cnbc.com/id/100003114/device/rss/rss.html",
    categorySlug: "markets",
    priority: 30
  },
  {
    name: "GNews Wire",
    slug: "gnews-wire",
    url: "https://gnews.io",
    description: "API-backed aggregator for finance and crypto headlines.",
    kind: "api",
    categorySlug: "markets",
    priority: 5,
    configJson: { provider: "gnews" }
  }
];

const articleSeed = [
  {
    title: "Bitcoin Holds Above Key Support As ETF Demand Rebuilds",
    slug: "bitcoin-holds-above-key-support-as-etf-demand-rebuilds",
    excerpt: "Spot ETF inflows returned after a two-session pause, helping BTC stabilize around an important technical floor.",
    content:
      "Bitcoin traded in a tight range through the Asia and Europe sessions before buyers stepped back in near a widely watched support band. Analysts pointed to renewed ETF inflows, lower short-term leverage, and stronger perpetual funding discipline as reasons the market avoided a deeper flush. Traders now expect a directional move if macro data cools further and risk appetite remains intact.",
    coverImage: "https://images.unsplash.com/photo-1640161704729-cbe966a08476?auto=format&fit=crop&w=1200&q=80",
    isFeatured: true,
    categorySlug: "crypto",
    sourceSlug: "blockwire",
    publishedAt: new Date("2026-06-19T08:15:00Z")
  },
  {
    title: "Ethereum Fee Compression Lifts Focus Toward Staking Yield",
    slug: "ethereum-fee-compression-lifts-focus-toward-staking-yield",
    excerpt: "With fee revenue normalizing, investors are reassessing ETH through the lens of staking income and ecosystem durability.",
    content:
      "Ethereum's post-upgrade operating rhythm is shifting the conversation away from short bursts of speculative volume and back toward durable staking yield. Fund managers say the asset is increasingly being modeled like digital infrastructure with embedded cash-flow characteristics, even as layer-two competition keeps fees under pressure.",
    coverImage: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    categorySlug: "crypto",
    sourceSlug: "ledger-daily",
    publishedAt: new Date("2026-06-19T07:00:00Z")
  },
  {
    title: "Treasury Yields Drift Lower Ahead Of Inflation Print",
    slug: "treasury-yields-drift-lower-ahead-of-inflation-print",
    excerpt: "Bond traders trimmed exposure as markets prepared for a fresh signal on the Fed's late-summer policy path.",
    content:
      "US Treasury yields eased across the curve as investors moved into a lower-risk stance before the next inflation print. Desk commentary described the move as orderly rather than conviction-heavy, with traders unwilling to front-run the data after several conflicting macro releases this month.",
    coverImage: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    categorySlug: "macro",
    sourceSlug: "macro-current",
    publishedAt: new Date("2026-06-19T06:20:00Z")
  },
  {
    title: "Bank Earnings Signal Stronger Trading Revenues Than Expected",
    slug: "bank-earnings-signal-stronger-trading-revenues-than-expected",
    excerpt: "Major banks beat consensus on market-related income as volatility lifted hedging and client activity.",
    content:
      "Early earnings from large financial institutions showed a stronger-than-expected quarter for trading desks, with fixed income and commodities franchises leading the upside. Executives warned that the pace may cool if volatility fades, but analysts said the results help reinforce the sector's near-term resilience.",
    coverImage: "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    categorySlug: "finance",
    sourceSlug: "macro-current",
    publishedAt: new Date("2026-06-18T20:35:00Z")
  },
  {
    title: "Equities Open Mixed As Traders Rotate Into Defensive Growth",
    slug: "equities-open-mixed-as-traders-rotate-into-defensive-growth",
    excerpt: "Technology stayed resilient while cyclicals lagged in the first hour of cash-market trading.",
    content:
      "Index performance diverged at the open as investors leaned back into megacap software and semiconductor names while reducing exposure to cyclicals. Portfolio managers described the move as a quality rotation rather than a broad risk-off signal, especially with credit spreads staying relatively calm.",
    coverImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    categorySlug: "markets",
    sourceSlug: "ledger-daily",
    publishedAt: new Date("2026-06-19T10:05:00Z")
  },
  {
    title: "Breaking: Payments Giant Expands Stablecoin Settlement Pilot",
    slug: "breaking-payments-giant-expands-stablecoin-settlement-pilot",
    excerpt: "The expanded pilot adds two new corridors and revives speculation around broader enterprise crypto rails.",
    content:
      "A global payments company broadened its enterprise settlement pilot to include additional cross-border corridors, citing reduced reconciliation friction and faster treasury movement. The announcement reignited debate over how quickly regulated stablecoins could become part of mainstream payment infrastructure.",
    coverImage: "https://images.unsplash.com/photo-1550565118-3a14e8d0386f?auto=format&fit=crop&w=1200&q=80",
    isFeatured: false,
    categorySlug: "breaking",
    sourceSlug: "blockwire",
    publishedAt: new Date("2026-06-19T11:40:00Z")
  }
];

const cryptoSeed = [
  { symbol: "BTC", name: "Bitcoin", price: "106420.42", change24h: "2.54", marketCap: "$2.10T" },
  { symbol: "ETH", name: "Ethereum", price: "5988.10", change24h: "1.67", marketCap: "$720B" },
  { symbol: "SOL", name: "Solana", price: "241.18", change24h: "4.83", marketCap: "$112B" }
];

async function main() {
  await prisma.article.deleteMany();
  await prisma.source.deleteMany();
  await prisma.category.deleteMany();
  await prisma.cryptoSnapshot.deleteMany();
  await prisma.dailySummary.deleteMany();

  const createdCategories = await Promise.all(
    categories.map((category) => prisma.category.create({ data: category }))
  );

  const categoryBySlug = Object.fromEntries(createdCategories.map((category) => [category.slug, category]));

  const createdSources = await Promise.all(
    sources.map((source) => prisma.source.create({ data: source }))
  );

  const sourceBySlug = Object.fromEntries(createdSources.map((source) => [source.slug, source]));

  await Promise.all(
    articleSeed.map((article) =>
      prisma.article.create({
        data: {
          title: article.title,
          slug: article.slug,
          excerpt: article.excerpt,
          content: article.content,
          coverImage: article.coverImage,
          externalUrl: null,
          externalId: null,
          origin: "manual",
          isFeatured: article.isFeatured,
          isPublished: true,
          isArchived: false,
          importanceScore: article.isFeatured ? 90 : 65,
          publishedAt: article.publishedAt,
          fetchedAt: null,
          categoryId: categoryBySlug[article.categorySlug].id,
          sourceId: sourceBySlug[article.sourceSlug].id
        }
      })
    )
  );

  await Promise.all(
    cryptoSeed.map((snapshot) =>
      prisma.cryptoSnapshot.create({
        data: {
          ...snapshot,
          recordedAt: new Date("2026-06-19T12:00:00Z")
        }
      })
    )
  );

  await prisma.dailySummary.create({
    data: {
      summaryDate: new Date("2026-06-19T00:00:00Z"),
      title: "Risk Stays Constructive, But Macro Is Still Steering The Tape",
      content:
        "Crypto is firm with BTC defending support and SOL leading upside beta, while equities remain selective rather than euphoric. Treasury yields are easing ahead of fresh inflation data, which keeps the next macro print in focus for both digital assets and traditional markets."
    }
  });
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
