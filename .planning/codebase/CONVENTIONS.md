# Coding Conventions

**Analysis Date:** 2026-01-26

## Naming Patterns

**Files:**
- Components: PascalCase (e.g., `ProjectCard.tsx`, `ArticleWrapper.tsx`)
- Utilities/Data: camelCase (e.g., `utils.ts`, `articles.ts`, `projects.ts`)
- Route handlers: `route.ts` or `route.tsx` (Next.js convention)
- Pages: `page.tsx` (Next.js App Router convention)
- Icons: PascalCase with `Icon` suffix (e.g., `GitHubIcon.tsx`, `ArrowIcon.tsx`)

**Functions:**
- React components: PascalCase (e.g., `BlogPosts`, `ProjectCard`, `CustomMDX`)
- Utility functions: camelCase (e.g., `formatDate`, `getBlogPosts`, `getReadingTime`)
- Helper functions: camelCase (e.g., `parseFrontmatter`, `slugify`, `compact`)
- Event handlers: camelCase with descriptive prefixes (e.g., `shareToSocial`, `copyToClipboard`)

**Variables:**
- camelCase for all variables (e.g., `allBlogs`, `recentArticles`, `showDropdown`)
- Constants: camelCase or UPPER_SNAKE_CASE for true constants
- State variables: camelCase (e.g., `isComplete`, `progress`, `currentIndex`)

**Types:**
- Interfaces: PascalCase (e.g., `Article`, `Project`, `BlogPostsProps`, `TagProps`)
- Type aliases: PascalCase (e.g., `Metadata`)

## Code Style

**Formatting:**
- No explicit Prettier config; relies on editor defaults
- 2-space indentation (inferred from codebase)
- Double quotes for JSX attributes
- Semicolons at end of statements (inconsistent - some files omit)
- Max line length: ~100 characters (no enforced limit)

**Linting:**
- No ESLint config detected in project root
- TypeScript strict mode: `false` in `tsconfig.json`
- `strictNullChecks: true` enabled
- Relies on Next.js built-in linting

## Import Organization

**Order:**
1. External packages (`next/link`, `react`, `date-fns`)
2. Internal absolute imports (`app/blog/utils`, `app/components/...`)
3. Relative imports (`./components/ArrowIcon`)
4. Type imports (mixed with regular imports)

**Path Aliases:**
- Base URL set to `.` in `tsconfig.json`
- Use absolute paths from `app/` (e.g., `app/blog/utils`, `app/components/posts`)
- No `@/` alias configured

**Example from `app/page.tsx`:**
```typescript
import { BlogPosts } from "app/components/posts";
import { ArrowIcon } from "./components/ArrowIcon";
import { GitHubIcon } from "./components/icons/GitHubIcon";
import { articles } from "./articles/articles";
import { projects } from "./projects/projects";
```

## Component Patterns

**Server Components (Default):**
- No "use client" directive
- Can use async/await directly
- Used for: pages, layouts, data-fetching components
- Example: `app/blog/[slug]/page.tsx`, `app/components/RelatedPosts.tsx`

**Client Components:**
- Marked with `"use client"` at top of file
- Used for: interactive components, hooks, state management
- Examples: `app/components/ProjectCard.tsx`, `app/components/ShareButton.tsx`

**Component Structure Pattern:**
```typescript
"use client"; // Only if needed

import { useState } from "react"; // External imports
import { SomeComponent } from "app/components/..."; // Internal imports

// Types/interfaces defined inline or imported
interface ComponentProps {
  prop1: string;
  prop2?: number;
}

// Helper functions defined before component
function helperFunction() { ... }

// Main component export
export function ComponentName({ prop1, prop2 }: ComponentProps) {
  // Hooks first
  const [state, setState] = useState(false);

  // Handler functions
  const handleClick = () => { ... };

  // Render
  return (
    <div className="...">
      {/* JSX content */}
    </div>
  );
}
```

**Props Pattern:**
- Use TypeScript interfaces for props
- Destructure props in function signature
- Optional props use `?` modifier
- Default values in destructuring: `{ prop = defaultValue }`

## Error Handling

**Patterns:**
- `notFound()` from Next.js for 404 pages
- Try-catch blocks for async operations (clipboard, native share)
- Console.error for logging failures: `console.error("Copy failed:", err)`
- Silent failures with user feedback (e.g., `setCopied(false)`)

**Example from `app/components/ShareButton.tsx`:**
```typescript
const copyToClipboard = async () => {
  try {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  } catch (err) {
    console.error("Copy failed:", err);
  }
};
```

**Page-level Error Handling:**
```typescript
// From app/blog/[slug]/page.tsx
const post = getBlogPosts().find((post) => post.slug === params.slug);
if (!post) {
  notFound();
}
```

## Logging

**Framework:** Console (no external logging library)

**Patterns:**
- `console.error()` for error logging
- No structured logging
- No log levels beyond error

## Comments

**When to Comment:**
- Inline comments for non-obvious logic
- JSX comments for section headers: `{/* Hero Section */}`
- No JSDoc/TSDoc usage detected
- Self-documenting code preferred

**Example:**
```typescript
// Consider reading complete when user has scrolled 85% of the content
const readingProgress = (scrollTop + windowHeight) / documentHeight;
```

## Function Design

**Size:** Small, focused functions (typically < 30 lines)

**Parameters:**
- Destructured object props for components
- Individual parameters for utility functions
- Optional parameters with defaults

**Return Values:**
- Components return JSX
- Utility functions return typed values
- Hooks return state and/or callbacks

## Module Design

**Exports:**
- Named exports preferred: `export function ComponentName() {}`
- Default exports for pages/layouts (Next.js convention)
- Single component per file (mostly)

**Barrel Files:**
- Not used; direct imports preferred
- Each component exported from its own file

## CSS/Styling Conventions

**Tailwind CSS:**
- Use utility classes inline in JSX
- Dark mode via `dark:` prefix
- Custom CSS variables in `app/global.css`
- Responsive design via `md:`, `lg:` prefixes

**Class Organization Pattern:**
```typescript
className="flex items-center gap-2 text-neutral-600 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100 transition-all duration-300"
```

**Order:** Layout > Spacing > Colors > Hover states > Dark mode variants > Transitions

**Custom Utility Function:**
```typescript
// From app/layout.tsx
const cx = (...classes) => classes.filter(Boolean).join(" ");
```

## Data Patterns

**Static Data:**
- Define as arrays/objects in dedicated files (e.g., `app/projects/projects.ts`)
- Export both data and getter functions

**MDX Content:**
- Frontmatter parsed manually via regex
- Content stored in `app/blog/posts/` directory
- Required frontmatter: `title`, `publishedAt`, `summary`, `tags`

**Type Definitions with Data:**
```typescript
// From app/articles/articles.ts
export interface Article {
  slug: string;
  title: string;
  // ...
}

export const articles: Article[] = [...];

export function getArticles(): Article[] {
  return articles.sort(...);
}
```

## SEO/Metadata Patterns

**Page Metadata:**
```typescript
// Export metadata object for static pages
export const metadata = {
  title: "...",
  description: "...",
  openGraph: { ... },
};

// Use generateMetadata for dynamic pages
export async function generateMetadata({ params }): Promise<Metadata> {
  // Fetch/compute metadata
  return { ... };
}
```

**Structured Data:**
- JSON-LD embedded in page components
- Schema.org BlogPosting type for blog posts

---

*Convention analysis: 2026-01-26*
