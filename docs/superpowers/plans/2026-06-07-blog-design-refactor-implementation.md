# Victor Bona Blog Design Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Refactor `victorbona.blog` into a dense, minimal operating index with controlled technical-zine edges across homepage, archives, projects, papers, and article reading.

**Architecture:** Preserve the current Next.js App Router route shape and MDX content pipeline while replacing the visual system and reusable presentation components. Build a small set of shared row/header/metadata primitives, then compose the homepage and listing pages from those primitives before tightening article prose and shell styling.

**Tech Stack:** Next.js App Router, React function components, TypeScript, Tailwind CSS alpha, MDX via `next-mdx-remote`, CSS custom properties, automatic `prefers-color-scheme` theming.

---

## File Structure

- Existing `.impeccable.md`: persistent design context for future `/impeccable` work.
- Create `app/components/SectionHeader.tsx`: compact numbered section header with optional description/action.
- Create `app/components/MetadataLine.tsx`: shared inline metadata renderer for dates, read times, tags, statuses, and link labels.
- Create `app/components/WritingRow.tsx`: dense row for posts and related writing.
- Create `app/components/FeaturedArgument.tsx`: homepage featured essay block.
- Create `app/components/SystemRow.tsx`: compact project dossier row.
- Create `app/components/PaperRow.tsx`: quiet article/paper row with empty-state support.
- Modify `app/global.css`: replace the current neutral-only token set and prose defaults with the new visual system.
- Modify `app/layout.tsx`: widen the shell, remove the old narrow body constraint, and keep analytics/observability intact.
- Modify `app/components/nav.tsx`: convert nav to compact top navigation with sharper labels.
- Modify `app/components/footer.tsx`: compact footer aligned to the archive aesthetic.
- Modify `app/components/Tag.tsx`: restyle tags as compact metadata chips.
- Modify `app/components/posts.tsx`: route `BlogPosts` through `WritingRow` and preserve the existing `limit` and `filter` API.
- Modify `app/components/RelatedPosts.tsx`: compact related-post rows using `WritingRow`.
- Modify `app/components/ReadingProgress.tsx`: replace blue progress color with the design token accent.
- Modify `app/page.tsx`: rebuild homepage as the approved operating index.
- Modify `app/blog/page.tsx`: rebuild blog archive as dense field notes.
- Modify `app/blog/[slug]/page.tsx`: improve article header, summary treatment, and footer density.
- Modify `app/projects/page.tsx`: rebuild projects as shipped-system rows.
- Modify `app/components/ProjectCard.tsx`: either replace internals with `SystemRow` compatibility or keep it only if route composition still imports it.
- Modify `app/articles/page.tsx`: rebuild papers/articles as longer-work rows and honest empty state.
- Modify `app/components/ArticleCard.tsx`: either replace internals with `PaperRow` compatibility or keep it only if route composition still imports it.

Do not modify deployment, observability routes, MDX post bodies, Dockerfile, or Helm chart unless a build failure requires a narrow compatibility fix.

---

### Task 1: Confirm Planning Context

**Files:**
- Read: `.impeccable.md`
- Read: `docs/superpowers/specs/2026-06-07-blog-design-refactor.md`

- [ ] **Step 1: Verify `.impeccable.md` exists and matches the approved direction**

Run:

```bash
sed -n '1,220p' .impeccable.md
```

Expected: the file names the audience as engineering peers, senior builders, founders, and operators; it names the direction as `Operating Index with controlled Technical Zine edges`; it includes the density and anti-pattern constraints.

- [ ] **Step 2: Verify the design spec is approved for planning**

Run:

```bash
grep -n "Status: Approved for implementation planning" docs/superpowers/specs/2026-06-07-blog-design-refactor.md
```

Expected: one matching status line.

- [ ] **Step 3: Verify the implementation starts from a clean documentation checkpoint**

Run:

```bash
git status --short
```

Expected: clean working tree before implementation starts.

If the only changes are the plan and `.impeccable.md`, commit them before continuing:

```bash
git add .impeccable.md docs/superpowers/specs/2026-06-07-blog-design-refactor.md docs/superpowers/plans/2026-06-07-blog-design-refactor-implementation.md
git commit -m "docs: add blog implementation plan"
```

Expected: context files are committed before UI work begins.

---

### Task 2: Install Global Visual System

**Files:**
- Modify: `app/global.css`

- [ ] **Step 1: Replace root design tokens**

In `app/global.css`, replace the current `:root` and dark media token blocks with:

```css
:root {
  --font-display: var(--font-display-serif);
  --font-body: var(--font-body-sans);

  --color-background: oklch(0.973 0.012 78);
  --color-foreground: oklch(0.188 0.018 65);
  --color-muted: oklch(0.925 0.014 78);
  --color-muted-foreground: oklch(0.445 0.023 67);
  --color-border: oklch(0.79 0.018 73);
  --color-rule: oklch(0.66 0.026 70);
  --color-accent: oklch(0.44 0.095 31);
  --color-accent-foreground: oklch(0.973 0.012 78);
  --color-surface: oklch(0.952 0.012 78);
  --color-surface-strong: oklch(0.9 0.018 74);

  --text-xs: 0.75rem;
  --text-sm: 0.875rem;
  --text-base: 1rem;
  --text-md: 1.0625rem;
  --text-lg: 1.25rem;
  --text-xl: clamp(1.45rem, 1.18rem + 1.1vw, 2rem);
  --text-2xl: clamp(2rem, 1.45rem + 2.2vw, 3.25rem);

  --space-2xs: 0.25rem;
  --space-xs: 0.5rem;
  --space-sm: 0.75rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2rem;
  --space-2xl: 3rem;
  --space-3xl: 4rem;

  --radius-sm: 0.25rem;
  --radius-md: 0.375rem;
  --max-shell: 72rem;
  --max-reading: 44rem;

  --sh-class: oklch(0.24 0.035 68);
  --sh-identifier: oklch(0.33 0.03 65);
  --sh-sign: oklch(0.49 0.026 67);
  --sh-string: oklch(0.37 0.078 31);
  --sh-keyword: oklch(0.29 0.076 31);
  --sh-comment: oklch(0.58 0.025 67);
  --sh-jsxliterals: oklch(0.34 0.047 210);
  --sh-property: oklch(0.28 0.04 65);
  --sh-entity: oklch(0.35 0.075 31);
}

@media (prefers-color-scheme: dark) {
  :root {
    --color-background: oklch(0.151 0.018 66);
    --color-foreground: oklch(0.91 0.017 78);
    --color-muted: oklch(0.225 0.017 66);
    --color-muted-foreground: oklch(0.69 0.019 76);
    --color-border: oklch(0.315 0.019 68);
    --color-rule: oklch(0.445 0.022 68);
    --color-accent: oklch(0.7 0.108 33);
    --color-accent-foreground: oklch(0.151 0.018 66);
    --color-surface: oklch(0.195 0.016 66);
    --color-surface-strong: oklch(0.265 0.019 66);

    --sh-class: oklch(0.84 0.019 78);
    --sh-identifier: oklch(0.78 0.018 76);
    --sh-keyword: oklch(0.78 0.095 34);
    --sh-string: oklch(0.8 0.07 86);
  }

  html {
    color-scheme: dark;
  }
}
```

- [ ] **Step 2: Add base layout and typography rules**

Add or update these rules after the token blocks:

```css
html {
  min-width: 320px;
  scroll-behavior: smooth;
  background: var(--color-background);
}

body {
  background:
    linear-gradient(90deg, color-mix(in oklch, var(--color-rule) 16%, transparent) 1px, transparent 1px),
    var(--color-background);
  background-size: 4rem 4rem;
  color: var(--color-foreground);
  font-family: var(--font-body), ui-sans-serif, system-ui, sans-serif;
}

.display-type {
  font-family: var(--font-display), Georgia, serif;
  letter-spacing: 0;
}

.metadata-type {
  font-size: var(--text-xs);
  letter-spacing: 0.08em;
  text-transform: uppercase;
}
```

- [ ] **Step 3: Replace prose summary and code styling**

Update prose-related rules so `.prose` uses `max-width: var(--max-reading)`, code blocks use `--color-surface`, and links use the accent token:

```css
.prose {
  max-width: var(--max-reading);
  margin-inline: auto;
  font-size: var(--text-md);
  line-height: 1.78;
  overflow-wrap: break-word;
  word-break: break-word;
}

.prose a {
  color: var(--color-foreground);
  text-decoration-color: color-mix(in oklch, var(--color-accent) 55%, transparent);
  text-decoration-thickness: 0.08em;
  text-underline-offset: 0.18em;
}

.prose pre {
  margin-block: 1.5rem;
  border-radius: var(--radius-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  padding: 1rem !important;
}

.prose p {
  margin-block: 1.35rem;
  color: color-mix(in oklch, var(--color-foreground) 88%, var(--color-muted-foreground));
}
```

- [ ] **Step 4: Remove stale visual-system comments and broad transition rules**

Remove broad `a { transition: all ... }` and `button { transition: all ... }` rules. Keep focus-visible styling, but set its color to `var(--color-accent)`.

- [ ] **Step 5: Run build validation**

Run:

```bash
npm run build
```

Expected: build completes successfully. If it fails due to unrelated existing Next canary warnings, capture the exact error before changing code.

- [ ] **Step 6: Commit global visual system**

Run:

```bash
git add app/global.css
git commit -m "style: install blog visual system"
```

Expected: one commit containing only `app/global.css`.

---

### Task 3: Update Fonts, Shell, Navigation, And Footer

**Files:**
- Modify: `app/layout.tsx`
- Modify: `app/components/nav.tsx`
- Modify: `app/components/footer.tsx`

- [ ] **Step 1: Replace font imports and shell classes in `app/layout.tsx`**

Use `next/font/google` with a distinctive heading/body pairing. Replace Geist imports with:

```tsx
import { Atkinson_Hyperlegible, Libre_Caslon_Text } from "next/font/google";
```

Then define:

```tsx
const display = Libre_Caslon_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-display-serif",
});

const body = Atkinson_Hyperlegible({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-body-sans",
});
```

Set the root classes:

```tsx
className={cx(display.variable, body.variable)}
```

Set body layout:

```tsx
<body className="antialiased">
  <PageViewTracker />
  <main className="mx-auto flex min-h-screen w-full max-w-[var(--max-shell)] flex-col px-4 py-4 sm:px-6 lg:px-8">
    <Navbar />
    <div className="flex-auto">{children}</div>
    <Footer />
    <Analytics />
  </main>
</body>
```

- [ ] **Step 2: Refactor `Navbar`**

Replace `app/components/nav.tsx` with:

```tsx
import Link from "next/link";

const navItems = [
  { href: "/blog", label: "Writing" },
  { href: "/projects", label: "Systems" },
  { href: "/articles", label: "Papers" },
];

export function Navbar() {
  return (
    <header className="mb-6 border-b border-[var(--color-border)] pb-3">
      <nav className="flex items-center justify-between gap-4">
        <Link
          href="/"
          className="display-type text-lg font-semibold text-[var(--color-foreground)]"
        >
          Victor Bona
        </Link>
        <div className="flex flex-wrap items-center justify-end gap-1 text-sm">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-sm px-2 py-1 text-[var(--color-muted-foreground)] transition-colors hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </nav>
    </header>
  );
}
```

- [ ] **Step 3: Refactor `Footer`**

Replace `app/components/footer.tsx` with:

```tsx
const links = [
  { href: "/rss", label: "RSS", external: false },
  { href: "https://github.com/vicotrbb/victorbona.blog", label: "Source", external: true },
  { href: "https://www.linkedin.com/in/vicotrbb/", label: "LinkedIn", external: true },
  { href: "https://x.com/BonaVictor", label: "X", external: true },
  { href: "/llms.txt", label: "llms.txt", external: false },
];

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-[var(--color-border)] py-5 text-sm text-[var(--color-muted-foreground)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p>Victor Bona / {new Date().getFullYear()} / MIT</p>
        <ul className="flex flex-wrap gap-x-3 gap-y-1">
          {links.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                target={link.external ? "_blank" : undefined}
                rel={link.external ? "noopener noreferrer" : undefined}
                className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
```

- [ ] **Step 4: Run build validation**

Run:

```bash
npm run build
```

Expected: build succeeds and no font import errors occur.

- [ ] **Step 5: Commit shell changes**

Run:

```bash
git add app/layout.tsx app/components/nav.tsx app/components/footer.tsx
git commit -m "style: refactor blog shell"
```

Expected: shell commit succeeds.

---

### Task 4: Add Shared Archive Components

**Files:**
- Create: `app/components/SectionHeader.tsx`
- Create: `app/components/MetadataLine.tsx`
- Create: `app/components/WritingRow.tsx`
- Create: `app/components/FeaturedArgument.tsx`
- Create: `app/components/SystemRow.tsx`
- Create: `app/components/PaperRow.tsx`
- Modify: `app/components/Tag.tsx`

- [ ] **Step 1: Create `SectionHeader`**

Create `app/components/SectionHeader.tsx`:

```tsx
import Link from "next/link";

type SectionHeaderProps = {
  index: string;
  title: string;
  description?: string;
  href?: string;
  actionLabel?: string;
};

export function SectionHeader({
  index,
  title,
  description,
  href,
  actionLabel = "Open",
}: SectionHeaderProps) {
  return (
    <div className="mb-3 flex items-end justify-between gap-4 border-b border-[var(--color-rule)] pb-2">
      <div className="min-w-0">
        <p className="metadata-type text-[var(--color-accent)]">[{index}]</p>
        <h2 className="display-type text-xl font-semibold text-[var(--color-foreground)]">
          {title}
        </h2>
        {description && (
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-muted-foreground)]">
            {description}
          </p>
        )}
      </div>
      {href && (
        <Link
          href={href}
          className="shrink-0 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
        >
          {actionLabel}
        </Link>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Create `MetadataLine`**

Create `app/components/MetadataLine.tsx`:

```tsx
type MetadataLineProps = {
  items: Array<string | number | undefined | null | false>;
  className?: string;
};

export function MetadataLine({ items, className = "" }: MetadataLineProps) {
  const visibleItems = items.filter(Boolean);

  if (visibleItems.length === 0) {
    return null;
  }

  return (
    <p className={`metadata-type flex flex-wrap gap-x-2 gap-y-1 text-[var(--color-muted-foreground)] ${className}`}>
      {visibleItems.map((item, index) => (
        <span key={`${item}-${index}`} className="inline-flex items-center gap-2">
          {index > 0 && <span aria-hidden="true">/</span>}
          <span>{item}</span>
        </span>
      ))}
    </p>
  );
}
```

- [ ] **Step 3: Create `WritingRow`**

Create `app/components/WritingRow.tsx`:

```tsx
import Link from "next/link";
import { formatDate, getReadingTime } from "app/blog/utils";
import { MetadataLine } from "./MetadataLine";

type WritingRowProps = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags?: string;
  content?: string;
  compact?: boolean;
};

export function WritingRow({
  slug,
  title,
  summary,
  publishedAt,
  tags,
  content,
  compact = false,
}: WritingRowProps) {
  const primaryTag = tags?.split(",")[0]?.trim();
  const readingTime = content ? `${getReadingTime(content)} min` : undefined;

  return (
    <Link
      href={`/blog/${slug}`}
      className="group block border-b border-[var(--color-border)] py-3 last:border-b-0"
    >
      <article className="grid gap-2 sm:grid-cols-[8.5rem_1fr] sm:gap-4">
        <MetadataLine items={[formatDate(publishedAt), primaryTag, readingTime]} />
        <div className="min-w-0">
          <h3 className="text-base font-semibold leading-snug text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
            {title}
          </h3>
          {!compact && (
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
              {summary}
            </p>
          )}
        </div>
      </article>
    </Link>
  );
}
```

- [ ] **Step 4: Create `FeaturedArgument`**

Create `app/components/FeaturedArgument.tsx`:

```tsx
import Link from "next/link";
import { formatDate, getReadingTime } from "app/blog/utils";
import { MetadataLine } from "./MetadataLine";

type FeaturedArgumentProps = {
  slug: string;
  title: string;
  summary: string;
  publishedAt: string;
  tags: string;
  content: string;
};

export function FeaturedArgument({
  slug,
  title,
  summary,
  publishedAt,
  tags,
  content,
}: FeaturedArgumentProps) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group block min-h-full border border-[var(--color-rule)] bg-[var(--color-surface)] p-4 transition-colors hover:border-[var(--color-accent)]"
    >
      <MetadataLine
        items={[formatDate(publishedAt), `${getReadingTime(content)} min`, tags.split(",")[0]?.trim()]}
      />
      <h2 className="display-type mt-3 text-2xl font-semibold leading-tight text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {summary}
      </p>
      <p className="metadata-type mt-5 text-[var(--color-accent)]">Read the argument</p>
    </Link>
  );
}
```

- [ ] **Step 5: Create `SystemRow`**

Create `app/components/SystemRow.tsx`:

```tsx
import { Project } from "app/projects/projects";
import { MetadataLine } from "./MetadataLine";

function statusLabel(status: Project["status"]) {
  return status.replace("-", " ");
}

export function SystemRow({ project }: { project: Project }) {
  const stack = project.tags.slice(0, 4).join(" / ");

  return (
    <article className="grid gap-2 border-b border-[var(--color-border)] py-3 last:border-b-0 md:grid-cols-[10rem_1fr_auto] md:items-start md:gap-4">
      <div>
        <p className="font-semibold text-[var(--color-foreground)]">{project.name}</p>
        <MetadataLine items={[statusLabel(project.status), project.license]} />
      </div>
      <div className="min-w-0">
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          {project.description}
        </p>
        <p className="metadata-type mt-2 text-[var(--color-muted-foreground)]">{stack}</p>
      </div>
      <div className="flex gap-3 text-sm md:justify-end">
        {project.website && (
          <a href={project.website} target="_blank" rel="noopener noreferrer" className="text-[var(--color-accent)] hover:text-[var(--color-foreground)]">
            Site
          </a>
        )}
        {project.repository && (
          <a href={project.repository} target="_blank" rel="noopener noreferrer" className="text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
            Source
          </a>
        )}
      </div>
    </article>
  );
}
```

- [ ] **Step 6: Create `PaperRow`**

Create `app/components/PaperRow.tsx`:

```tsx
import Link from "next/link";
import { Article } from "app/articles/articles";
import { MetadataLine } from "./MetadataLine";

export function PaperRow({ article }: { article: Article }) {
  return (
    <article className="border-b border-[var(--color-border)] py-3 last:border-b-0">
      <MetadataLine items={[article.status, article.type, article.publishedAt]} />
      <Link href={`/articles/${article.slug}`} className="group mt-1 block">
        <h3 className="font-semibold text-[var(--color-foreground)] group-hover:text-[var(--color-accent)]">
          {article.title}
        </h3>
      </Link>
      <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        {article.abstract}
      </p>
    </article>
  );
}

export function EmptyPaperArchive() {
  return (
    <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
      <p className="metadata-type text-[var(--color-accent)]">Longer work</p>
      <p className="mt-2 text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        Papers and slower-form technical work will live here when they are ready. The archive stays quiet until it has something worth indexing.
      </p>
    </div>
  );
}
```

- [ ] **Step 7: Restyle `Tag`**

Replace the returned `className` in `app/components/Tag.tsx` with:

```tsx
className={`metadata-type inline-block rounded-sm border border-[var(--color-border)] px-2 py-1 text-[var(--color-muted-foreground)] transition-colors hover:border-[var(--color-accent)] hover:text-[var(--color-foreground)] ${className}`}
```

- [ ] **Step 8: Run build validation**

Run:

```bash
npm run build
```

Expected: build succeeds with the new components unused or partially used.

- [ ] **Step 9: Commit shared components**

Run:

```bash
git add app/components/SectionHeader.tsx app/components/MetadataLine.tsx app/components/WritingRow.tsx app/components/FeaturedArgument.tsx app/components/SystemRow.tsx app/components/PaperRow.tsx app/components/Tag.tsx
git commit -m "feat: add archive presentation components"
```

Expected: one commit containing reusable presentation components.

---

### Task 5: Rebuild Homepage As Operating Index

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace homepage imports**

Use these imports:

```tsx
import { getBlogPosts } from "app/blog/utils";
import { FeaturedArgument } from "./components/FeaturedArgument";
import { SectionHeader } from "./components/SectionHeader";
import { WritingRow } from "./components/WritingRow";
import { SystemRow } from "./components/SystemRow";
import { EmptyPaperArchive, PaperRow } from "./components/PaperRow";
import { articles } from "./articles/articles";
import { projects } from "./projects/projects";
```

- [ ] **Step 2: Add selection helpers**

Inside `Page`, before `return`, compute:

```tsx
const posts = getBlogPosts().sort(
  (a, b) =>
    new Date(b.metadata.publishedAt).getTime() -
    new Date(a.metadata.publishedAt).getTime()
);
const featured = posts.find((post) =>
  post.slug.includes("hidden-cost-of-abstractions")
) ?? posts[0];
const fieldNotes = posts.filter((post) => post.slug !== featured.slug).slice(0, 6);
const selectedProjects = ["Guara Cloud", "Purple Wolf", "SQLTemple"]
  .map((name) => projects.find((project) => project.name === name))
  .filter(Boolean);
const selectedArticles = articles.slice(0, 2);
```

- [ ] **Step 3: Replace page JSX**

Return this structure:

```tsx
<div className="space-y-6">
  <section className="grid gap-4 border-b border-[var(--color-rule)] pb-5 lg:grid-cols-[1fr_1.6fr] lg:items-end">
    <div>
      <p className="metadata-type text-[var(--color-accent)]">Software / systems / operational taste</p>
      <h1 className="display-type mt-2 text-2xl font-semibold leading-tight text-[var(--color-foreground)] sm:text-3xl">
        Victor Bona builds software systems and writes down the arguments that survive contact with production.
      </h1>
    </div>
    <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)] lg:max-w-xl">
      Notes on software architecture, infrastructure, product engineering, security, AI systems, and the cost of abstractions.
    </p>
  </section>

  <section className="grid gap-4 lg:grid-cols-[1.05fr_1fr]">
    <div>
      <SectionHeader index="001" title="Current Argument" />
      <FeaturedArgument
        slug={featured.slug}
        title={featured.metadata.title}
        summary={featured.metadata.summary}
        publishedAt={featured.metadata.publishedAt}
        tags={featured.metadata.tags}
        content={featured.content}
      />
    </div>
    <div>
      <SectionHeader index="002" title="Field Notes" href="/blog" actionLabel="All writing" />
      <div className="border border-[var(--color-border)] bg-[var(--color-background)] px-3">
        {fieldNotes.map((post) => (
          <WritingRow
            key={post.slug}
            slug={post.slug}
            title={post.metadata.title}
            summary={post.metadata.summary}
            publishedAt={post.metadata.publishedAt}
            tags={post.metadata.tags}
            content={post.content}
            compact
          />
        ))}
      </div>
    </div>
  </section>

  <section>
    <SectionHeader index="003" title="Shipped Systems" href="/projects" actionLabel="All systems" />
    <div className="border border-[var(--color-border)] px-3">
      {selectedProjects.map((project) => (
        <SystemRow key={project!.name} project={project!} />
      ))}
    </div>
  </section>

  <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
    <div>
      <SectionHeader index="004" title="Longer Work" href="/articles" actionLabel="Papers" />
      {selectedArticles.length > 0 ? (
        <div className="border border-[var(--color-border)] px-3">
          {selectedArticles.map((article) => (
            <PaperRow key={article.slug} article={article} />
          ))}
        </div>
      ) : (
        <EmptyPaperArchive />
      )}
    </div>
    <div>
      <SectionHeader index="005" title="Archive" href="/blog" actionLabel="Enter" />
      <div className="border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="text-sm leading-relaxed text-[var(--color-muted-foreground)]">
          The full writing archive stays organized by date and topic: clean code, scalability, APIs, concurrency, AI tooling, homelab infrastructure, and the tradeoffs behind shipped software.
        </p>
      </div>
    </div>
  </section>
</div>
```

- [ ] **Step 4: Run build validation**

Run:

```bash
npm run build
```

Expected: homepage builds; no `featured` undefined error with current MDX inventory.

- [ ] **Step 5: Commit homepage**

Run:

```bash
git add app/page.tsx
git commit -m "feat: rebuild homepage as operating index"
```

Expected: homepage commit succeeds.

---

### Task 6: Rebuild Blog Archive And Related Rows

**Files:**
- Modify: `app/components/posts.tsx`
- Modify: `app/blog/page.tsx`
- Modify: `app/components/RelatedPosts.tsx`

- [ ] **Step 1: Replace `BlogPosts` rendering with `WritingRow`**

In `app/components/posts.tsx`, import `WritingRow` and replace the mapped `Link/article` block with:

```tsx
<WritingRow
  key={post.slug}
  slug={post.slug}
  title={post.metadata.title}
  summary={post.metadata.summary}
  publishedAt={post.metadata.publishedAt}
  tags={post.metadata.tags}
  content={post.content}
/>
```

Wrap the map in:

```tsx
<div className="border border-[var(--color-border)] px-3">
```

Remove unused `Link` and `formatDate` imports.

- [ ] **Step 2: Replace `app/blog/page.tsx` JSX**

Use `SectionHeader` and a compact intro:

```tsx
import { BlogPosts } from "app/components/posts";
import { SectionHeader } from "app/components/SectionHeader";
import { baseUrl } from "app/sitemap";
```

Return:

```tsx
<section className="space-y-5">
  <div className="grid gap-3 border-b border-[var(--color-rule)] pb-4 md:grid-cols-[12rem_1fr]">
    <p className="metadata-type text-[var(--color-accent)]">Field notes</p>
    <div>
      <h1 className="display-type text-2xl font-semibold text-[var(--color-foreground)]">
        Writing archive
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        Essays and working notes on software architecture, infrastructure, AI tooling, APIs, and the tradeoffs behind production systems.
      </p>
    </div>
  </div>
  <SectionHeader index="ALL" title="All notes" />
  <BlogPosts />
</section>
```

- [ ] **Step 3: Compact `RelatedPosts`**

Replace the return block in `app/components/RelatedPosts.tsx` with:

```tsx
<div className="mt-8 border-t border-[var(--color-border)] pt-5">
  <h2 className="metadata-type mb-2 text-[var(--color-accent)]">Related field notes</h2>
  <div className="border border-[var(--color-border)] px-3">
    {posts.map((post) => (
      <WritingRow
        key={post.slug}
        slug={post.slug}
        title={post.metadata.title}
        summary={post.metadata.summary}
        publishedAt={post.metadata.publishedAt}
        tags={post.metadata.tags}
        content={post.content}
        compact
      />
    ))}
  </div>
</div>
```

Add:

```tsx
import { WritingRow } from "./WritingRow";
```

Remove unused `Link`.

- [ ] **Step 4: Run build validation**

Run:

```bash
npm run build
```

Expected: archive and related posts build successfully.

- [ ] **Step 5: Commit archive changes**

Run:

```bash
git add app/components/posts.tsx app/blog/page.tsx app/components/RelatedPosts.tsx
git commit -m "feat: compact writing archive"
```

Expected: archive commit succeeds.

---

### Task 7: Refactor Article Reading Experience

**Files:**
- Modify: `app/blog/[slug]/page.tsx`
- Modify: `app/components/ReadingProgress.tsx`

- [ ] **Step 1: Update `ReadingProgress` colors**

In `app/components/ReadingProgress.tsx`, replace the return classes with:

```tsx
<div className="fixed left-0 top-0 z-50 h-1 w-full bg-[var(--color-border)]">
  <div
    className="h-full bg-[var(--color-accent)] transition-all duration-150"
    style={{ width: `${progress}%` }}
  />
</div>
```

- [ ] **Step 2: Remove thick summary side border in article page**

In `app/blog/[slug]/page.tsx`, replace the summary block:

```tsx
<div className="border-l-4 border-neutral-300 dark:border-neutral-700 pl-6 mb-8">
  <p className="text-lg text-neutral-700 dark:text-neutral-300 leading-relaxed italic">
    {post.metadata.summary}
  </p>
</div>
```

with:

```tsx
<div className="mb-6 border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
  <p className="text-base leading-relaxed text-[var(--color-muted-foreground)]">
    {post.metadata.summary}
  </p>
</div>
```

- [ ] **Step 3: Restyle article shell**

Update the main article wrapper classes:

```tsx
<div className="mx-auto max-w-[var(--max-reading)]">
  <article itemScope itemType="https://schema.org/BlogPosting">
```

Update the header classes:

```tsx
<header className="mb-8 border-b border-[var(--color-rule)] pb-5">
```

Update the title classes:

```tsx
className="display-type text-2xl font-semibold leading-tight text-[var(--color-foreground)] sm:text-3xl lg:text-4xl"
```

Update metadata wrapper:

```tsx
className="mt-4 flex flex-col gap-3 text-sm text-[var(--color-muted-foreground)] sm:flex-row sm:items-center sm:justify-between"
```

- [ ] **Step 4: Compact article footer**

Replace the footer opening class with:

```tsx
<footer className="mt-8 border-t border-[var(--color-border)] pt-5">
```

Replace `Tagged with:` with:

```tsx
Filed under
```

- [ ] **Step 5: Run build validation**

Run:

```bash
npm run build
```

Expected: article pages build for all MDX posts.

- [ ] **Step 6: Commit article reading changes**

Run:

```bash
git add 'app/blog/[slug]/page.tsx' app/components/ReadingProgress.tsx
git commit -m "style: refine article reading experience"
```

Expected: article commit succeeds.

---

### Task 8: Rebuild Projects And Papers Pages

**Files:**
- Modify: `app/projects/page.tsx`
- Modify: `app/components/ProjectCard.tsx`
- Modify: `app/articles/page.tsx`
- Modify: `app/components/ArticleCard.tsx`

- [ ] **Step 1: Replace projects page with shipped systems layout**

In `app/projects/page.tsx`, import `SectionHeader` and `SystemRow`, then return:

```tsx
<section className="space-y-5">
  <div className="grid gap-3 border-b border-[var(--color-rule)] pb-4 md:grid-cols-[12rem_1fr]">
    <p className="metadata-type text-[var(--color-accent)]">Shipped systems</p>
    <div>
      <h1 className="display-type text-2xl font-semibold text-[var(--color-foreground)]">
        Systems, tools, and infrastructure
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        Software that moved past the idea stage: platforms, security tools, infrastructure, developer products, and experiments with enough shape to judge.
      </p>
    </div>
  </div>
  <SectionHeader index="LIVE" title="Project archive" />
  <div className="border border-[var(--color-border)] px-3">
    {projects.map((project) => (
      <SystemRow key={project.name} project={project} />
    ))}
  </div>
</section>
```

- [ ] **Step 2: Keep `ProjectCard` as a compatibility wrapper**

Replace `app/components/ProjectCard.tsx` with:

```tsx
import { Project } from "app/projects/projects";
import { SystemRow } from "./SystemRow";

export function ProjectCard({ project }: { project: Project }) {
  return <SystemRow project={project} />;
}
```

- [ ] **Step 3: Replace articles page with longer-work layout**

In `app/articles/page.tsx`, import `SectionHeader`, `PaperRow`, and `EmptyPaperArchive`, then return:

```tsx
<section className="space-y-5">
  <div className="grid gap-3 border-b border-[var(--color-rule)] pb-4 md:grid-cols-[12rem_1fr]">
    <p className="metadata-type text-[var(--color-accent)]">Longer work</p>
    <div>
      <h1 className="display-type text-2xl font-semibold text-[var(--color-foreground)]">
        Papers and articles
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--color-muted-foreground)]">
        Slower-form research and technical writing. This section stays sparse until the work deserves the space.
      </p>
    </div>
  </div>
  <SectionHeader index="PAPERS" title="Indexed work" />
  {articles.length > 0 ? (
    <div className="border border-[var(--color-border)] px-3">
      {articles.map((article) => (
        <PaperRow key={article.slug} article={article} />
      ))}
    </div>
  ) : (
    <EmptyPaperArchive />
  )}
</section>
```

- [ ] **Step 4: Keep `ArticleCard` as a compatibility wrapper**

Replace `app/components/ArticleCard.tsx` with:

```tsx
import { Article } from "app/articles/articles";
import { PaperRow } from "./PaperRow";

export function ArticleCard({ article }: { article: Article }) {
  return <PaperRow article={article} />;
}
```

- [ ] **Step 5: Run build validation**

Run:

```bash
npm run build
```

Expected: projects and articles pages build successfully. If TypeScript reports unused variables from old grouping logic, remove the stale variables.

- [ ] **Step 6: Commit projects and papers**

Run:

```bash
git add app/projects/page.tsx app/components/ProjectCard.tsx app/articles/page.tsx app/components/ArticleCard.tsx
git commit -m "feat: refactor systems and papers archives"
```

Expected: commit succeeds.

---

### Task 9: Polish Density, Themes, And Final Validation

**Files:**
- Modify only files touched by Tasks 2-8 if verification exposes spacing, theme, or type issues.

- [ ] **Step 1: Scan for banned visual patterns**

Run:

```bash
grep -RInE "background-clip: text|-webkit-background-clip: text|border-left: [2-9]|border-right: [2-9]|linear-gradient\\([^)]*text|shadow-lg|rounded-xl" app || true
```

Expected: no gradient text, no thick side borders, no generic heavy shadows, and no large rounded-card drift in refactored surfaces. Existing unrelated matches must be inspected before changing.

- [ ] **Step 2: Run production build**

Run:

```bash
npm run build
```

Expected: build succeeds.

- [ ] **Step 3: Run Docker build**

Run:

```bash
docker build -t victorbona-blog .
```

Expected: image builds successfully.

- [ ] **Step 4: Start local dev server**

Run:

```bash
npm run dev
```

Expected: server starts on `http://localhost:3000` or reports the next available port.

- [ ] **Step 5: Browser-check key routes**

Open:

```text
http://localhost:3000/
http://localhost:3000/blog
http://localhost:3000/projects
http://localhost:3000/articles
```

Also open one article route from the homepage. Verify:

- Homepage first viewport is dense and not overly vertical.
- Featured argument and field notes appear together on desktop.
- Shipped systems start without excessive scrolling.
- Mobile layout is single-column and text does not overlap.
- Light and dark modes both read intentionally.
- Article page has no thick side-border summary block.

- [ ] **Step 6: Stop dev server**

Use the running terminal session interrupt:

```text
Ctrl-C
```

Expected: no dev server session remains running.

- [ ] **Step 7: Commit final polish if changes were needed**

If Step 5 required fixes, run:

```bash
git add app
git commit -m "style: polish blog refactor density"
```

Expected: commit succeeds only if there were additional polish changes.

---

## Self-Review

Spec coverage:

- `.impeccable.md` persistence is verified in Task 1.
- Global tokens, typography, color, and anti-pattern constraints are covered in Task 2.
- Shell, nav, and footer are covered in Task 3.
- Shared component boundaries are covered in Task 4.
- Homepage operating-index structure and density are covered in Task 5.
- Blog archive scanning is covered in Task 6.
- Article reading experience is covered in Task 7.
- Projects and papers presentation is covered in Task 8.
- Final build, Docker, browser, mobile, and theme checks are covered in Task 9.

Known implementation risk:

- `next/font/google` can require network access during build. If that becomes unreliable, keep the same `--font-display-serif` and `--font-body-sans` variables but switch to locally available CSS font stacks or checked-in font files in a narrow follow-up.
- The plan preserves existing URLs. It does not add `/blog/tag/[tag]`, even though `Tag` currently links to that shape. If tag navigation is broken today, defer that to a separate task unless it blocks the build.
