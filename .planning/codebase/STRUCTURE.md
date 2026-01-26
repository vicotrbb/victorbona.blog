# Codebase Structure

**Analysis Date:** 2026-01-26

## Directory Layout

```
victorbona.blog/
├── app/                    # Next.js App Router - pages and components
│   ├── articles/           # Academic articles feature
│   │   ├── [slug]/         # Dynamic article detail page
│   │   ├── articles.ts     # Article data and interfaces
│   │   └── page.tsx        # Articles listing page
│   ├── blog/               # Blog feature
│   │   ├── [slug]/         # Dynamic blog post page
│   │   ├── posts/          # MDX blog post content files
│   │   │   └── locale/     # Localized posts (pt-br)
│   │   ├── tag/            # Tag filtering feature
│   │   │   └── [tag]/      # Dynamic tag page
│   │   ├── page.tsx        # Blog listing page
│   │   └── utils.ts        # Blog data utilities
│   ├── components/         # Reusable UI components
│   │   └── icons/          # Icon components
│   ├── hooks/              # Custom React hooks
│   ├── llms.txt/           # LLM discovery file route
│   ├── og/                 # Open Graph image generation route
│   ├── projects/           # Projects feature
│   │   ├── page.tsx        # Projects listing page
│   │   └── projects.ts     # Project data and interfaces
│   ├── rss/                # RSS feed route
│   ├── global.css          # Global styles
│   ├── layout.tsx          # Root layout
│   ├── not-found.tsx       # 404 page
│   ├── page.tsx            # Home page
│   ├── robots.ts           # Robots.txt generator
│   └── sitemap.ts          # Sitemap generator
├── content/                # Future content (articles placeholder)
│   └── articles/           # Empty - articles content storage
├── public/                 # Static assets
│   ├── projects/           # Project images/GIFs
│   └── [post-slug]/        # Blog post images
├── chart/                  # Helm chart for Kubernetes deployment
│   └── templates/          # K8s manifest templates
├── .planning/              # Planning documents
│   └── codebase/           # Codebase analysis docs
├── package.json            # Dependencies and scripts
├── next.config.mjs         # Next.js configuration
├── tailwind.config.js      # Tailwind CSS configuration
├── tsconfig.json           # TypeScript configuration
├── postcss.config.js       # PostCSS configuration
└── template.mdx            # MDX template for new posts
```

## Directory Purposes

**app/:**
- Purpose: Next.js App Router root - all routes and React components
- Contains: Pages, components, route handlers, utilities
- Key files: `layout.tsx`, `page.tsx`, `sitemap.ts`, `robots.ts`

**app/blog/:**
- Purpose: Blog feature including posts, listing, and tag filtering
- Contains: Page components, MDX content, utilities
- Key files: `utils.ts` (data fetching), `posts/*.mdx` (content)

**app/blog/posts/:**
- Purpose: MDX blog post content storage
- Contains: MDX files with frontmatter (title, publishedAt, summary, tags)
- Key files: All `.mdx` files are blog posts

**app/articles/:**
- Purpose: Academic papers and articles feature
- Contains: Page components, data definitions
- Key files: `articles.ts` (Article interface and data array)

**app/projects/:**
- Purpose: Portfolio projects showcase
- Contains: Page component, data definitions
- Key files: `projects.ts` (Project interface and data array)

**app/components/:**
- Purpose: Reusable UI components
- Contains: React components for posts, cards, navigation, MDX rendering
- Key files: `mdx.tsx`, `posts.tsx`, `nav.tsx`, `footer.tsx`, `ProjectCard.tsx`, `ArticleCard.tsx`

**app/components/icons/:**
- Purpose: SVG icon components
- Contains: GitHubIcon, XIcon, LinkIcon, ArrowUpIcon

**app/hooks/:**
- Purpose: Custom React hooks
- Contains: `useReadingProgress.ts` (scroll tracking)

**public/:**
- Purpose: Static assets served at root URL
- Contains: Images, GIFs, favicon
- Key files: `logo.ico`, project demos in subdirectories

**content/:**
- Purpose: Reserved for future article content
- Contains: Empty `articles/` directory (placeholder)

**chart/:**
- Purpose: Kubernetes Helm chart for deployment
- Contains: Helm templates and values
- Generated: No, manually maintained

## Key File Locations

**Entry Points:**
- `app/layout.tsx`: Root layout with HTML structure, fonts, analytics
- `app/page.tsx`: Home page component

**Configuration:**
- `package.json`: Dependencies, scripts (dev, build, start)
- `next.config.mjs`: Next.js config (rewrites for analytics)
- `tailwind.config.js`: Tailwind theme extensions (animations)
- `tsconfig.json`: TypeScript compiler options
- `postcss.config.js`: PostCSS plugins

**Core Logic:**
- `app/blog/utils.ts`: MDX parsing, date formatting, reading time calculation
- `app/sitemap.ts`: Sitemap generation, exports `baseUrl`
- `app/components/mdx.tsx`: Custom MDX components (headings, links, code)

**Data Files:**
- `app/articles/articles.ts`: Article interface and static data
- `app/projects/projects.ts`: Project interface and static data
- `app/blog/posts/*.mdx`: Blog post content files

**Testing:**
- Not present (no test files or test configuration found)

## Naming Conventions

**Files:**
- Page components: `page.tsx` (Next.js convention)
- Layout: `layout.tsx` (Next.js convention)
- Route handlers: `route.ts` or `route.tsx`
- Components: PascalCase (`ArticleCard.tsx`, `ProjectCard.tsx`)
- Utilities: camelCase (`utils.ts`)
- Data files: camelCase (`articles.ts`, `projects.ts`)
- MDX posts: kebab-case (`the-dry-principle.mdx`)

**Directories:**
- Features: lowercase (`blog/`, `articles/`, `projects/`)
- Dynamic routes: `[param]` (Next.js convention)
- Components: lowercase (`components/`, `icons/`)

**Exports:**
- Components: Named exports (`export function Navbar()`)
- Data: Named exports (`export const articles`, `export function getArticles()`)
- Default exports: Only for page components (`export default function Page()`)

## Where to Add New Code

**New Blog Post:**
- Create: `app/blog/posts/{slug}.mdx`
- Format: MDX with frontmatter (title, publishedAt, summary, tags, image?)
- Template: See `template.mdx` in root

**New Article:**
- Edit: `app/articles/articles.ts`
- Add entry to `articles` array following `Article` interface

**New Project:**
- Edit: `app/projects/projects.ts`
- Add entry to `projects` array following `Project` interface
- Add images/GIFs: `public/projects/{project-name}/`

**New Page:**
- Create: `app/{route}/page.tsx`
- For dynamic routes: `app/{route}/[param]/page.tsx`
- Add `generateStaticParams` for static generation
- Add `generateMetadata` for SEO

**New Component:**
- Shared: `app/components/{ComponentName}.tsx`
- Icons: `app/components/icons/{IconName}.tsx`
- Feature-specific: Co-locate in feature directory

**New Utility Function:**
- Blog-related: `app/blog/utils.ts`
- General: Consider creating `app/lib/` directory

**New Custom Hook:**
- Location: `app/hooks/{useHookName}.ts`
- Add `"use client"` directive at top

**New Route Handler:**
- Create: `app/{route}/route.ts`
- Export HTTP method functions (GET, POST, etc.)

**New Static Asset:**
- Images for posts: `public/{post-slug}/`
- Project assets: `public/projects/{project-name}/`

## Special Directories

**.next/:**
- Purpose: Next.js build output
- Generated: Yes (by `next build`)
- Committed: No (in `.gitignore`)

**node_modules/:**
- Purpose: npm dependencies
- Generated: Yes (by `npm install`)
- Committed: No (in `.gitignore`)

**chart/:**
- Purpose: Helm chart for Kubernetes deployment
- Generated: No (manually maintained)
- Committed: Yes

**.planning/:**
- Purpose: Planning and documentation
- Generated: No (manually created)
- Committed: Yes

**public/:**
- Purpose: Static files served at root URL
- Generated: No (manually added)
- Committed: Yes

---

*Structure analysis: 2026-01-26*
