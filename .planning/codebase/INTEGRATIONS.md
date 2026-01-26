# External Integrations

**Analysis Date:** 2026-01-26

## APIs & External Services

**Analytics:**
- Vercel Analytics - Page view and event tracking
  - SDK/Client: `@vercel/analytics/react`
  - Component: `<Analytics />` in `app/layout.tsx`
  - Event tracking: `track()` function used in `app/components/ShareButton.tsx`
  - Auth: Automatic via Vercel deployment (no env var needed)

- DataFast Analytics - Custom analytics proxy
  - Proxied via Next.js rewrites in `next.config.mjs`
  - Script: `/js/script.js` proxies to `https://datafa.st/js/script.js`
  - Events: `/api/events` proxies to `https://datafa.st/api/events`
  - Website ID: `683fc4e7e5c802d499876375` (hardcoded in `app/layout.tsx`)
  - Domain: `blog.vicotrbb.dev`

**Social Media:**
- Twitter/X - Social sharing and profile links
  - Handle: `@BonaVictor`
  - Used in: metadata (`app/layout.tsx`), footer (`app/components/footer.tsx`)
  - No API integration, links only

- GitHub - Profile links
  - Profile: `https://github.com/vicotrbb`
  - Repo: `https://github.com/vicotrbb/victorbona.blog`
  - Used in: footer, home page

- LinkedIn - Profile links
  - Profile: `https://www.linkedin.com/in/vicotrbb/`
  - Used in: footer

## Data Storage

**Databases:**
- PostgreSQL (Neon)
  - Connection: `DATABASE_URL` env var
  - Host: `ep-long-morning-a5alf75y-pooler.us-east-2.aws.neon.tech`
  - Database: `neondb`
  - Note: Connection string present in `.env` but no active database queries detected in codebase (feature removed per commit history)

**File Storage:**
- Local filesystem for blog content
  - Blog posts: `app/blog/posts/*.mdx`
  - Static assets: `public/` directory

**Caching:**
- None (relies on Next.js built-in caching and static generation)

## Content Management

**Blog Posts:**
- MDX files stored locally in `app/blog/posts/`
- Frontmatter parsed with custom regex in `app/blog/utils.ts`
- Metadata: title, publishedAt, summary, tags, image (optional)

**Articles:**
- Static TypeScript data in `app/articles/articles.ts`
- Currently empty array (commented out example)

**Projects:**
- Static TypeScript data in `app/projects/projects.ts`
- Contains 9 project entries with metadata

## Authentication & Identity

**Auth Provider:**
- None - Static blog, no user authentication

## Monitoring & Observability

**Error Tracking:**
- None detected

**Logs:**
- None configured (uses Next.js default logging)

**Metrics:**
- Vercel Analytics for page views
- DataFast for custom analytics

## CI/CD & Deployment

**Hosting:**
- Vercel (primary) - Indicated by:
  - `@vercel/analytics` package
  - `.next/` build output directory
  - Domain: `https://blog.victorbona.dev`

- Kubernetes (alternative) - Helm chart in `chart/` directory
  - Chart name: `app-template`
  - Version: 0.1.0
  - Optional dependencies: PostgreSQL 15.5.17, Redis 19.6.4, MinIO 14.10.5 (Bitnami charts)

**CI Pipeline:**
- Not detected (no .github/workflows or similar)

## Environment Configuration

**Required env vars:**
- `DATABASE_URL` - PostgreSQL connection (currently unused)

**Hardcoded configuration:**
- `baseUrl`: `https://blog.victorbona.dev` in `app/sitemap.ts`
- DataFast website ID: `683fc4e7e5c802d499876375` in `app/layout.tsx`

**Secrets location:**
- `.env` file (local development)
- Vercel environment variables (production)

## Webhooks & Callbacks

**Incoming:**
- None detected

**Outgoing:**
- DataFast analytics events via `/api/events` proxy

## RSS & Feeds

**RSS Feed:**
- Endpoint: `/rss`
- Implementation: `app/rss/route.ts`
- Format: XML RSS 2.0
- Content: Blog posts sorted by date

**Sitemap:**
- Endpoint: `/sitemap.xml`
- Implementation: `app/sitemap.ts`
- Content: Blog posts and static routes

**LLM Discovery:**
- Endpoint: `/llms.txt`
- Implementation: `app/llms.txt/route.ts`
- Purpose: Machine-readable site index for AI/LLM crawlers
- Content: Blog posts, projects, articles metadata

## OG Image Generation

**Dynamic OG Images:**
- Endpoint: `/og`
- Implementation: `app/og/route.tsx`
- Uses: `next/og` ImageResponse
- Parameters: title, publishedAt, readingTime, summary, tags
- Size: 1200x630 pixels

## Third-Party Domains

**Outbound requests:**
- `datafa.st` - Analytics (proxied)
- `charts.bitnami.com` - Helm chart dependencies (Kubernetes only)

**CDN/Assets:**
- None external - all assets served from same domain

---

*Integration audit: 2026-01-26*
