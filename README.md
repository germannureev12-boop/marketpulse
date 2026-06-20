# MarketPulse

Financial and crypto news dashboard built with Next.js, TypeScript, Tailwind CSS, PostgreSQL, and Prisma.

## Features

- Homepage with featured news and latest feed
- Live crypto price cards for BTC, ETH, and SOL with automatic refresh
- Category pages for crypto, finance, macro, markets, and breaking
- Article detail pages
- Daily AI summary block
- Admin pages for sources and article management
- Route handlers for articles, sources, crypto snapshots, and summary data
- Fallback editorial data when the database is unavailable
- Real news feed integration through GNews when `GNEWS_API_KEY` is configured

## Setup

1. Copy `.env.example` to `.env`
2. Set `DATABASE_URL` to your PostgreSQL database
3. Optional: set `GNEWS_API_KEY` for live news headlines
4. Install dependencies
5. Generate Prisma client
6. Run migrations
7. Seed the database
8. Start the dev server

## Commands

```bash
pnpm install
pnpm prisma:generate
pnpm prisma:migrate --name init
pnpm prisma:seed
pnpm dev
```

## Notes

- Crypto prices come from CoinGecko's public API and refresh every 15 seconds on the homepage.
- Live news comes from GNews when the API key is present; otherwise the app falls back to seeded editorial data.
- If PostgreSQL is not available yet, public pages still render from fallback seed-shaped data.
- Admin mutations require a working database connection.

## Deploy to GitHub + Vercel

Before deploying, note that the local `.env` currently uses `localhost:5432`. That works only on your computer and must be replaced with a hosted PostgreSQL connection for Vercel.

### Recommended production environment variables

```bash
DATABASE_URL=postgresql://...
GNEWS_API_KEY=...
NEWS_AUTO_SYNC_ENABLED=true
NEWS_AUTO_SYNC_INTERVAL_MINUTES=15
```

### Vercel build settings

- Framework preset: `Next.js`
- Install command: `pnpm install`
- Build command: `pnpm vercel-build`

### Suggested deployment flow

1. Create a new GitHub repository.
2. Upload or push this project into that repository.
3. Create or connect a hosted PostgreSQL database.
4. Set your local `.env` `DATABASE_URL` to that hosted database.
5. Run `pnpm prisma db push`.
6. Run `pnpm prisma:seed`.
7. Import the repository into Vercel.
8. Add the environment variables above in Vercel.
9. Trigger the first deployment.
10. Open `/admin/sources` in production and run `Sync all`.

### Important preview note

If you plan to use preview deployments with schema changes, use a separate preview database instead of sharing the production `DATABASE_URL`.
