# Technology Stack

**Analysis Date:** 2026-01-26

## Languages

**Primary:**
- TypeScript 5.3.3 - All application code (`app/**/*.ts`, `app/**/*.tsx`)
- MDX - Blog content (`app/blog/posts/*.mdx`)

**Secondary:**
- CSS - Styling with Tailwind (`app/global.css`)
- JavaScript - Configuration files (`tailwind.config.js`, `postcss.config.js`)

## Runtime

**Environment:**
- Node.js (version managed by project, no .nvmrc detected)
- Next.js canary build (App Router)

**Package Manager:**
- npm
- Lockfile: `package-lock.json` present

## Frameworks

**Core:**
- Next.js (canary) - Full-stack React framework with App Router
- React 18.2.0 - UI library
- React DOM 18.2.0 - React DOM bindings

**Styling:**
- Tailwind CSS 4.0.0-alpha.13 - Utility-first CSS framework
- PostCSS 8.4.35 - CSS processing
- @tailwindcss/postcss 4.0.0-alpha.13 - PostCSS plugin for Tailwind

**Content:**
- next-mdx-remote 4.4.1 - MDX rendering for blog posts
- remark-math 5.1.1 - Math notation in markdown
- rehype-katex 7.0.1 - LaTeX math rendering
- katex 0.16.15 - Math typesetting

**Testing:**
- Not detected (no test framework configured)

**Build/Dev:**
- TypeScript 5.3.3 - Type checking
- Next.js built-in compiler - Build and bundling

## Key Dependencies

**Critical:**
- `next` (canary) - Framework core, handles routing, SSR, static generation
- `react` (18.2.0) - UI rendering
- `next-mdx-remote` (4.4.1) - Blog post rendering from MDX files

**Typography & Fonts:**
- `geist` (1.2.2) - Vercel's Geist font family (Sans and Mono variants)

**Utilities:**
- `date-fns` (4.1.0) - Date formatting and manipulation
- `sugar-high` (0.6.0) - Syntax highlighting for code blocks

**Analytics:**
- `@vercel/analytics` (1.1.3) - Vercel Analytics integration

**Type Definitions:**
- `@types/node` (20.11.17)
- `@types/react` (18.2.55)
- `@types/react-dom` (18.2.19)

## Configuration

**Environment:**
- `.env` file for environment variables
- Required: `DATABASE_URL` (PostgreSQL connection string, though currently not used in active code)

**TypeScript:**
- `tsconfig.json` - ES5 target, ESNext module, strict null checks enabled
- Path aliases: baseUrl set to `.` (root)
- JSX preserved for Next.js processing

**Build:**
- `next.config.mjs` - Next.js configuration with rewrites for analytics proxy
- `tailwind.config.js` - Custom animations (fade-in, fade-in-up, scale-in, slide-in-right)
- `postcss.config.js` - Tailwind PostCSS plugin configuration

**Styling:**
- `app/global.css` - CSS variables for design system (colors, typography scale, spacing, shadows)
- Dark mode support via `prefers-color-scheme` media query
- Prose styles for MDX content

## Platform Requirements

**Development:**
- Node.js (LTS recommended)
- npm for package management
- No containerized development setup detected

**Production:**
- Vercel (primary deployment target, indicated by analytics integration)
- Helm chart available for Kubernetes deployment (`chart/` directory)
  - Supports PostgreSQL, Redis, MinIO as optional dependencies
  - Generic multi-service application template

**CI/CD:**
- No CI configuration files detected (.github/workflows, etc.)

## Scripts

```json
{
  "dev": "next dev",      // Development server
  "build": "next build",  // Production build
  "start": "next start"   // Production server
}
```

---

*Stack analysis: 2026-01-26*
