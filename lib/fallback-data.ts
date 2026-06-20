import type { ArticleRecord, CryptoRecord, SourceRecord, SummaryRecord } from "@/lib/types";

const now = new Date("2026-06-19T12:00:00Z");

export const fallbackSources: SourceRecord[] = [
  {
    id: 1,
    name: "BlockWire",
    slug: "blockwire",
    url: "https://example.com/blockwire",
    description: "Crypto market structure, ETF flows, and on-chain trends.",
    kind: "manual",
    feedUrl: null,
    categorySlug: "crypto",
    priority: 100,
    pollIntervalMinutes: 30,
    lastFetchedAt: null,
    lastError: null,
    configJson: null,
    isActive: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 2,
    name: "Ledger Daily",
    slug: "ledger-daily",
    url: "https://example.com/ledger-daily",
    description: "Institutional digital asset and macro coverage.",
    kind: "manual",
    feedUrl: null,
    categorySlug: "markets",
    priority: 100,
    pollIntervalMinutes: 30,
    lastFetchedAt: null,
    lastError: null,
    configJson: null,
    isActive: true,
    createdAt: now,
    updatedAt: now
  },
  {
    id: 3,
    name: "Macro Current",
    slug: "macro-current",
    url: "https://example.com/macro-current",
    description: "Rates, inflation, growth, and policy shifts.",
    kind: "manual",
    feedUrl: null,
    categorySlug: "macro",
    priority: 100,
    pollIntervalMinutes: 30,
    lastFetchedAt: null,
    lastError: null,
    configJson: null,
    isActive: true,
    createdAt: now,
    updatedAt: now
  }
];

export const fallbackArticles: ArticleRecord[] = [
  {
    id: 1,
    title: "Bitcoin Holds Above Key Support As ETF Demand Rebuilds",
    slug: "bitcoin-holds-above-key-support-as-etf-demand-rebuilds",
    excerpt: "Spot ETF inflows returned after a two-session pause, helping BTC stabilize around an important technical floor.",
    content:
      "Bitcoin traded in a tight range through the Asia and Europe sessions before buyers stepped back in near a widely watched support band. Analysts pointed to renewed ETF inflows, lower short-term leverage, and stronger perpetual funding discipline as reasons the market avoided a deeper flush. Traders now expect a directional move if macro data cools further and risk appetite remains intact.",
    coverImage: "https://images.unsplash.com/photo-1640161704729-cbe966a08476?auto=format&fit=crop&w=1200&q=80",
    externalUrl: null,
    externalId: null,
    origin: "manual",
    isFeatured: true,
    isPublished: true,
    isArchived: false,
    importanceScore: 85,
    publishedAt: new Date("2026-06-19T08:15:00Z"),
    fetchedAt: null,
    createdAt: now,
    updatedAt: now,
    sourceId: 1,
    categoryId: 1,
    category: { id: 1, name: "Crypto", slug: "crypto" },
    source: { id: 1, name: "BlockWire", slug: "blockwire", url: "https://example.com/blockwire" }
  },
  {
    id: 2,
    title: "Ethereum Fee Compression Lifts Focus Toward Staking Yield",
    slug: "ethereum-fee-compression-lifts-focus-toward-staking-yield",
    excerpt: "With fee revenue normalizing, investors are reassessing ETH through the lens of staking income and ecosystem durability.",
    content:
      "Ethereum's post-upgrade operating rhythm is shifting the conversation away from short bursts of speculative volume and back toward durable staking yield. Fund managers say the asset is increasingly being modeled like digital infrastructure with embedded cash-flow characteristics.",
    coverImage: "https://images.unsplash.com/photo-1621761191319-c6fb62004040?auto=format&fit=crop&w=1200&q=80",
    externalUrl: null,
    externalId: null,
    origin: "manual",
    isFeatured: false,
    isPublished: true,
    isArchived: false,
    importanceScore: 68,
    publishedAt: new Date("2026-06-19T07:00:00Z"),
    fetchedAt: null,
    createdAt: now,
    updatedAt: now,
    sourceId: 2,
    categoryId: 1,
    category: { id: 1, name: "Crypto", slug: "crypto" },
    source: { id: 2, name: "Ledger Daily", slug: "ledger-daily", url: "https://example.com/ledger-daily" }
  },
  {
    id: 3,
    title: "Treasury Yields Drift Lower Ahead Of Inflation Print",
    slug: "treasury-yields-drift-lower-ahead-of-inflation-print",
    excerpt: "Bond traders trimmed exposure as markets prepared for a fresh signal on the Fed's late-summer policy path.",
    content:
      "US Treasury yields eased across the curve as investors moved into a lower-risk stance before the next inflation print. Desk commentary described the move as orderly rather than conviction-heavy, with traders unwilling to front-run the data.",
    coverImage: "https://images.unsplash.com/photo-1526304640581-d334cdbbf45e?auto=format&fit=crop&w=1200&q=80",
    externalUrl: null,
    externalId: null,
    origin: "manual",
    isFeatured: false,
    isPublished: true,
    isArchived: false,
    importanceScore: 70,
    publishedAt: new Date("2026-06-19T06:20:00Z"),
    fetchedAt: null,
    createdAt: now,
    updatedAt: now,
    sourceId: 3,
    categoryId: 3,
    category: { id: 3, name: "Macro", slug: "macro" },
    source: { id: 3, name: "Macro Current", slug: "macro-current", url: "https://example.com/macro-current" }
  },
  {
    id: 4,
    title: "Bank Earnings Signal Stronger Trading Revenues Than Expected",
    slug: "bank-earnings-signal-stronger-trading-revenues-than-expected",
    excerpt: "Major banks beat consensus on market-related income as volatility lifted hedging and client activity.",
    content:
      "Early earnings from large financial institutions showed a stronger-than-expected quarter for trading desks, with fixed income and commodities franchises leading the upside.",
    coverImage: "https://images.unsplash.com/photo-1559526324-593bc073d938?auto=format&fit=crop&w=1200&q=80",
    externalUrl: null,
    externalId: null,
    origin: "manual",
    isFeatured: false,
    isPublished: true,
    isArchived: false,
    importanceScore: 62,
    publishedAt: new Date("2026-06-18T20:35:00Z"),
    fetchedAt: null,
    createdAt: now,
    updatedAt: now,
    sourceId: 3,
    categoryId: 2,
    category: { id: 2, name: "Finance", slug: "finance" },
    source: { id: 3, name: "Macro Current", slug: "macro-current", url: "https://example.com/macro-current" }
  },
  {
    id: 5,
    title: "Equities Open Mixed As Traders Rotate Into Defensive Growth",
    slug: "equities-open-mixed-as-traders-rotate-into-defensive-growth",
    excerpt: "Technology stayed resilient while cyclicals lagged in the first hour of cash-market trading.",
    content:
      "Index performance diverged at the open as investors leaned back into megacap software and semiconductor names while reducing exposure to cyclicals.",
    coverImage: "https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?auto=format&fit=crop&w=1200&q=80",
    externalUrl: null,
    externalId: null,
    origin: "manual",
    isFeatured: false,
    isPublished: true,
    isArchived: false,
    importanceScore: 64,
    publishedAt: new Date("2026-06-19T10:05:00Z"),
    fetchedAt: null,
    createdAt: now,
    updatedAt: now,
    sourceId: 2,
    categoryId: 4,
    category: { id: 4, name: "Markets", slug: "markets" },
    source: { id: 2, name: "Ledger Daily", slug: "ledger-daily", url: "https://example.com/ledger-daily" }
  },
  {
    id: 6,
    title: "Breaking: Payments Giant Expands Stablecoin Settlement Pilot",
    slug: "breaking-payments-giant-expands-stablecoin-settlement-pilot",
    excerpt: "The expanded pilot adds two new corridors and revives speculation around broader enterprise crypto rails.",
    content:
      "A global payments company broadened its enterprise settlement pilot to include additional cross-border corridors, citing reduced reconciliation friction and faster treasury movement.",
    coverImage: "https://images.unsplash.com/photo-1550565118-3a14e8d0386f?auto=format&fit=crop&w=1200&q=80",
    externalUrl: null,
    externalId: null,
    origin: "manual",
    isFeatured: false,
    isPublished: true,
    isArchived: false,
    importanceScore: 91,
    publishedAt: new Date("2026-06-19T11:40:00Z"),
    fetchedAt: null,
    createdAt: now,
    updatedAt: now,
    sourceId: 1,
    categoryId: 5,
    category: { id: 5, name: "Breaking", slug: "breaking" },
    source: { id: 1, name: "BlockWire", slug: "blockwire", url: "https://example.com/blockwire" }
  }
];

export const fallbackCrypto: CryptoRecord[] = [
  { id: 1, symbol: "BTC", name: "Bitcoin", price: 106420.42, change24h: 2.54, marketCap: "$2.10T", recordedAt: now },
  { id: 2, symbol: "ETH", name: "Ethereum", price: 5988.1, change24h: 1.67, marketCap: "$720B", recordedAt: now },
  { id: 3, symbol: "SOL", name: "Solana", price: 241.18, change24h: 4.83, marketCap: "$112B", recordedAt: now }
];

export const fallbackSummary: SummaryRecord = {
  id: 1,
  title: "Risk Stays Constructive, But Macro Is Still Steering The Tape",
  content:
    "Crypto is firm with BTC defending support and SOL leading upside beta, while equities remain selective rather than euphoric. Treasury yields are easing ahead of fresh inflation data, which keeps the next macro print in focus for both digital assets and traditional markets.",
  summaryDate: new Date("2026-06-19T00:00:00Z"),
  createdAt: now,
  updatedAt: now
};
