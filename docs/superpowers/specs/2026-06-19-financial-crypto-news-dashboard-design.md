# Financial And Crypto News Dashboard Design

## Overview

Build a Next.js TypeScript application for financial and crypto news with a dark responsive dashboard UI. The app should combine a newsroom-style homepage, article detail pages, a daily AI summary block, simple crypto market cards, and an admin area for managing news sources and editorial content.

The first implementation will use a hybrid content model:

- PostgreSQL is the source of truth for articles, sources, price snapshots, and summaries.
- The admin area supports direct editorial management.
- The architecture leaves room for future RSS or external ingestion without restructuring the app.

## Goals

- Ship a polished local-first MVP that runs without third-party content APIs.
- Prioritize fast browsing, SEO-friendly article pages, and strong visual hierarchy.
- Keep the system easy to extend with automated ingestion later.
- Use a server-first architecture so the public site remains fast and simple.

## Non-Goals

- No auth/roles system beyond a lightweight local admin page for this first version.
- No external RSS or exchange API integration in the first milestone.
- No rich text editor; article content can be stored as structured text or markdown-like body content.
- No live websockets or real-time price streaming in the first version.

## Recommended Architecture

Use Next.js App Router with a server-first approach.

### Why This Approach

- Public pages benefit from server rendering and SEO.
- The news feed and article pages stay simple and fast.
- Prisma fits naturally with server-side data loading.
- API routes remain available for admin actions, crypto snapshots, and future external integrations.

## High-Level Structure

- `app/`
  - Public routes for homepage, category views, article detail pages, and admin pages.
- `app/api/`
  - API routes for articles, sources, crypto snapshots, and daily summaries.
- `components/`
  - Reusable UI for cards, summary panels, category pills, layout chrome, and admin forms.
- `lib/`
  - Prisma client, data access helpers, validation, formatting utilities, and mock seed helpers.
- `prisma/`
  - Prisma schema and seed script.

## Route Design

### Public Routes

- `/`
  - Homepage with:
    - hero story
    - latest news feed
    - category navigation
    - `BTC`, `ETH`, `SOL` cards
    - daily AI summary block
- `/category/[slug]`
  - Category-specific article listing for:
    - `crypto`
    - `finance`
    - `macro`
    - `markets`
    - `breaking`
- `/article/[slug]`
  - Article detail page with metadata, source info, body content, and related stories

### Admin Routes

- `/admin`
  - overview page for editorial tools
- `/admin/sources`
  - add, edit, enable, disable news sources
- `/admin/articles`
  - create and edit articles

## Data Model

### `Category`

- `id`
- `name`
- `slug`

Seed with fixed categories:

- `crypto`
- `finance`
- `macro`
- `markets`
- `breaking`

### `Source`

- `id`
- `name`
- `slug`
- `url`
- `description`
- `isActive`
- `createdAt`
- `updatedAt`

### `Article`

- `id`
- `title`
- `slug`
- `excerpt`
- `content`
- `coverImage`
- `isFeatured`
- `publishedAt`
- `createdAt`
- `updatedAt`
- `sourceId`
- `categoryId`

### `CryptoSnapshot`

- `id`
- `symbol`
- `name`
- `price`
- `change24h`
- `marketCap` or `summaryLabel`
- `recordedAt`

Use records for `BTC`, `ETH`, and `SOL`.

### `DailySummary`

- `id`
- `summaryDate`
- `title`
- `content`
- `createdAt`
- `updatedAt`

Only one current summary per day should be surfaced on the homepage.

## Homepage Layout

The homepage should feel like a terminal-era financial newsroom blended with a modern dashboard:

- large featured story at top-left
- narrow right rail for `Daily AI Summary`
- compact crypto cards above or alongside the fold
- dense but readable article grid below
- category pills near the top for fast navigation

### Visual Direction

- dark background with layered surfaces rather than flat black
- strong contrast headlines
- muted secondary text
- restrained accent colors driven by category or market state
- subtle borders and panel separators for a data-terminal feel

### Responsive Behavior

- desktop:
  - featured story + summary rail + crypto strip
- tablet:
  - stacked featured content with two-column feed
- mobile:
  - single-column reading flow
  - crypto cards become horizontal or compact stacked cards

## Article Detail Page

Each article page should include:

- category badge
- title
- source name
- publication time
- hero image if present
- article body
- related articles section based on same category

The page should optimize for readability while still matching the dark financial dashboard aesthetic.

## Admin Experience

The admin area should be intentionally simple:

- no separate design system from the public app
- form-first CRUD
- clear source status display
- editable article metadata and content

### Source Management

Support:

- create source
- edit source
- mark source active/inactive
- list all sources

### Article Management

Support:

- create article
- edit article
- select category
- select source
- toggle featured state

## API Design

Use Next.js route handlers under `app/api`.

### Endpoints

- `GET /api/articles`
  - list articles, optionally filtered by category
- `GET /api/articles/[slug]`
  - fetch single article data
- `GET /api/sources`
  - list sources
- `POST /api/sources`
  - create source
- `PATCH /api/sources/[id]`
  - update source
- `GET /api/crypto`
  - fetch latest `BTC`, `ETH`, `SOL` snapshots
- `GET /api/summary/today`
  - fetch current daily summary

Admin article mutation endpoints can be added as:

- `POST /api/articles`
- `PATCH /api/articles/[id]`

## Rendering Strategy

### Public Pages

- server components by default
- direct database reads through Prisma-backed server helpers
- optional revalidation for feed freshness

### Interactive Areas

Use client components only where needed:

- admin forms
- lightweight category/filter controls if client interactivity is added

## Error Handling

- homepage should degrade gracefully if no crypto data exists yet
- summary block should show an editorial fallback when no summary is present
- category and article pages should use standard not-found behavior
- admin mutations should return structured validation errors

## Validation

Use schema validation for admin inputs and API payloads.

Recommended:

- `zod` for request validation

Validate:

- source URL and required fields
- article title, slug, category, source, body
- crypto snapshot shape

## Testing Strategy

Because this project starts from scratch, the first implementation should follow focused TDD where practical:

- schema/data helper tests for core read/write behavior
- route handler tests for source and article mutations
- render tests for critical homepage blocks if the chosen setup supports them cleanly

Minimum verification targets:

- homepage renders seeded content
- article detail resolves valid slug and 404s invalid slug
- admin source create/update works
- crypto cards load latest seeded snapshots
- daily summary block renders current summary

## Seed Data

Seed the database with:

- five categories
- several sources
- a handful of articles across all categories
- three crypto snapshots
- one daily AI summary

The seed should make the app look complete immediately after setup.

## Future Extensions

The design should leave clear paths for:

- RSS ingestion jobs
- scheduled crypto refresh jobs
- AI-generated summaries from article batches
- source health tracking
- search and pagination

## Open Decisions Resolved

- Use App Router and server-first rendering.
- Use database-backed editorial content instead of live external feeds at launch.
- Use dark responsive dashboard styling with a financial terminal tone.
- Keep the admin experience intentionally lightweight and local-first.

## Implementation Boundaries

This design is scoped for a single implementation cycle:

- scaffold app
- wire Tailwind
- add Prisma schema
- build public pages
- build admin pages
- add API routes
- add seed data

External ingestion, authentication, and advanced editorial workflows are explicitly deferred.
