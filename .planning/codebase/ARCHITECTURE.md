# Architecture

**Analysis Date:** 2026-01-26

## Pattern Overview

**Overall:** Next.js App Router Static Site with MDX Content

**Key Characteristics:**
- File-based routing using Next.js App Router (app directory)
- Static site generation (SSG) with `generateStaticParams` for dynamic routes
- MDX-based content management for blog posts
- TypeScript data files for articles and projects (no database)
- Server-side rendering with React Server Components by default
- Client components used sparingly for interactivity (GIF carousel, reading progress)

## Layers

**Presentation Layer:**
- Purpose: Renders pages and UI components
- Location: `app/` (pages), `app/components/`
- Contains: Page components, UI components, layout
- Depends on: Data layer, utility functions
- Used by: Next.js routing system

**Data Layer:**
- Purpose: Provides content and data to pages
- Location: `app/blog/utils.ts`, `app/articles/articles.ts`, `app/projects/projects.ts`
- Contains: Data fetching functions, TypeScript interfaces, static data arrays
- Depends on: File system (for MDX), static TypeScript files
- Used by: Page components, utility components

**Content Layer:**
- Purpose: Stores blog post content in MDX format
- Location: `app/blog/posts/`
- Contains: MDX files with frontmatter metadata
- Depends on: Nothing (static files)
- Used by: Data layer via `getBlogPosts()`

**Route Handlers Layer:**
- Purpose: API-style endpoints for feeds and dynamic content
- Location: `app/rss/route.ts`, `app/og/route.tsx`, `app/llms.txt/route.ts`
- Contains: Route handlers for RSS feed, OG image generation, LLM discovery file
- Depends on: Data layer
- Used by: External consumers (RSS readers, social media, LLMs)

## Data Flow

**Blog Post Rendering:**

1. `app/blog/utils.ts` reads MDX files from `app/blog/posts/` at build time
2. `parseFrontmatter()` extracts metadata (title, publishedAt, summary, tags) from frontmatter
3. `getBlogPosts()` returns array of posts with metadata, slug, and content
4. Page components consume this data and render with `CustomMDX`
5. `next-mdx-remote/rsc` handles MDX-to-React transformation server-side

**Articles/Projects Rendering:**

1. Static TypeScript arrays in `app/articles/articles.ts` and `app/projects/projects.ts`
2. Helper functions (`getArticles()`, `getArticleBySlug()`) filter and sort data
3. Page components import and render data directly
4. No file system or database access required

**State Management:**
- No global state management library
- React `useState` used for local component state (e.g., GIF carousel index, show/hide details)
- Content is entirely static, fetched at build time

## Key Abstractions

**Blog Post:**
- Purpose: Represents a blog post with metadata and content
- Examples: `app/blog/utils.ts` (Metadata type), MDX files in `app/blog/posts/`
- Pattern: MDX frontmatter for metadata, body for content

```typescript
type Metadata = {
  title: string;
  publishedAt: string;
  summary: string;
  tags: string;
  image?: string;
};
```

**Article:**
- Purpose: Represents academic papers/articles
- Examples: `app/articles/articles.ts`
- Pattern: TypeScript interface with static array

```typescript
interface Article {
  slug: string;
  title: string;
  abstract: string;
  authors: string[];
  publishedAt: string;
  journal?: string;
  doi?: string;
  tags: string[];
  type: "paper" | "article";
  status: "published" | "preprint" | "draft" | "independently published";
  pdfUrl?: string;
  citationKey?: string;
}
```

**Project:**
- Purpose: Represents portfolio projects
- Examples: `app/projects/projects.ts`
- Pattern: TypeScript interface with static array, includes tech stack breakdown

```typescript
interface Project {
  name: string;
  description: string;
  longDescription?: string;
  repository?: string;
  website?: string;
  tags: string[];
  status: "completed" | "in-progress" | "maintained" | "stopped";
  publiclyShared: boolean;
  license: string;
  images?: string[];
  gifs?: string[];
  startDate?: string;
  tech?: { frontend?: string[]; backend?: string[]; database?: string[]; deployment?: string[]; };
}
```

**CustomMDX:**
- Purpose: MDX renderer with custom components
- Examples: `app/components/mdx.tsx`
- Pattern: Wraps `next-mdx-remote/rsc` with custom heading, link, code, and table components

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every page render
- Responsibilities: HTML structure, fonts, metadata, analytics, navbar, footer

**Home Page:**
- Location: `app/page.tsx`
- Triggers: Route `/`
- Responsibilities: Hero section, recent posts/articles/projects display

**Blog Pages:**
- Location: `app/blog/page.tsx`, `app/blog/[slug]/page.tsx`
- Triggers: Routes `/blog`, `/blog/{slug}`
- Responsibilities: Blog listing, individual post rendering with MDX

**Tag Pages:**
- Location: `app/blog/tag/[tag]/page.tsx`
- Triggers: Route `/blog/tag/{tag}`
- Responsibilities: Filter posts by tag

**Articles Pages:**
- Location: `app/articles/page.tsx`, `app/articles/[slug]/page.tsx`
- Triggers: Routes `/articles`, `/articles/{slug}`
- Responsibilities: Academic articles listing and detail view

**Projects Page:**
- Location: `app/projects/page.tsx`
- Triggers: Route `/projects`
- Responsibilities: Portfolio projects showcase

**Route Handlers:**
- Location: `app/rss/route.ts`, `app/og/route.tsx`, `app/llms.txt/route.ts`, `app/sitemap.ts`, `app/robots.ts`
- Triggers: Routes `/rss`, `/og`, `/llms.txt`, `/sitemap.xml`, `/robots.txt`
- Responsibilities: RSS feed generation, OG image generation, LLM discovery file, SEO files

## Error Handling

**Strategy:** Next.js built-in error handling with `notFound()`

**Patterns:**
- Dynamic routes use `notFound()` from `next/navigation` when content not found
- No try/catch blocks for data fetching (static content assumed to exist)
- Custom 404 page at `app/not-found.tsx`

## Cross-Cutting Concerns

**Logging:** None implemented (relies on Vercel/hosting platform logs)

**Validation:** TypeScript interfaces enforce data shape; no runtime validation

**Authentication:** None (public blog site)

**Analytics:**
- Vercel Analytics (`@vercel/analytics/react`)
- DataFast analytics via Next.js rewrites in `next.config.mjs`

**SEO:**
- Comprehensive metadata in `app/layout.tsx`
- JSON-LD structured data on blog/article pages
- Auto-generated sitemap via `app/sitemap.ts`
- Robots.txt via `app/robots.ts`
- OG image generation via `app/og/route.tsx`

**Styling:**
- Tailwind CSS v4 (alpha) with custom animations in `tailwind.config.js`
- Global styles in `app/global.css`
- Dark mode support via Tailwind classes

---

*Architecture analysis: 2026-01-26*
