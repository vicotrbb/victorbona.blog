# Testing Patterns

**Analysis Date:** 2026-01-26

## Test Framework

**Runner:**
- No test framework configured
- No test runner installed in `package.json`
- No Jest, Vitest, or other test library detected

**Assertion Library:**
- Not applicable (no tests exist)

**Run Commands:**
```bash
# No test commands defined in package.json
# Current scripts:
npm run dev       # Start development server
npm run build     # Build for production
npm run start     # Start production server
```

## Test File Organization

**Location:**
- No test files exist in the project
- No `__tests__/` directory
- No `.test.ts` or `.spec.ts` files (outside node_modules)

**Recommended Pattern for Future:**
```
app/
├── blog/
│   ├── utils.ts
│   └── utils.test.ts     # Co-located tests
├── components/
│   ├── ProjectCard.tsx
│   └── ProjectCard.test.tsx
└── __tests__/            # Integration tests
    └── blog.test.ts
```

## Current Test Coverage

**Status:** No automated tests

**What Should Be Tested:**

**Utility Functions (High Priority):**
- `app/blog/utils.ts`:
  - `parseFrontmatter()` - frontmatter parsing
  - `formatDate()` - date formatting
  - `getReadingTime()` - reading time calculation
  - `getBlogPosts()` - blog post retrieval

- `app/articles/articles.ts`:
  - `getArticles()` - sorting logic
  - `getArticleBySlug()` - lookup functionality
  - `getArticlesByTag()` - tag filtering

**Components (Medium Priority):**
- `app/components/ProjectCard.tsx` - status badge rendering, carousel behavior
- `app/components/ShareButton.tsx` - share functionality, dropdown behavior
- `app/components/BlogPosts.tsx` - filtering, sorting, limit behavior
- `app/components/Tag.tsx` - URL encoding

**Routes (Medium Priority):**
- `app/rss/route.ts` - RSS feed generation
- `app/og/route.tsx` - OG image generation
- `app/sitemap.ts` - sitemap generation

## Recommended Test Setup

**For Next.js App Router:**

1. Install Vitest (recommended for modern Next.js):
```bash
npm install -D vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

2. Create `vitest.config.ts`:
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './vitest.setup.ts',
    include: ['**/*.test.{ts,tsx}'],
  },
});
```

3. Add to `package.json`:
```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

## Test Structure Patterns

**Recommended Utility Test Pattern:**
```typescript
// app/blog/utils.test.ts
import { describe, it, expect } from 'vitest';
import { formatDate, getReadingTime, parseFrontmatter } from './utils';

describe('formatDate', () => {
  it('formats date without relative time', () => {
    expect(formatDate('2024-01-15')).toBe('January 15, 2024');
  });

  it('formats date with relative time', () => {
    const result = formatDate('2024-01-15', true);
    expect(result).toContain('January 15, 2024');
    expect(result).toContain('(');
  });

  it('handles ISO date strings', () => {
    expect(formatDate('2024-01-15T12:00:00')).toBe('January 15, 2024');
  });
});

describe('getReadingTime', () => {
  it('calculates reading time for short content', () => {
    const content = 'word '.repeat(100);
    expect(getReadingTime(content)).toBe(1);
  });

  it('calculates reading time for long content', () => {
    const content = 'word '.repeat(600);
    expect(getReadingTime(content)).toBe(3);
  });
});
```

**Recommended Component Test Pattern:**
```typescript
// app/components/Tag.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Tag } from './Tag';

describe('Tag', () => {
  it('renders tag name', () => {
    render(<Tag name="React" />);
    expect(screen.getByText('React')).toBeInTheDocument();
  });

  it('creates correct href with encoded tag', () => {
    render(<Tag name="Next.js" />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/blog/tag/Next.js');
  });

  it('trims whitespace from tag name', () => {
    render(<Tag name="  React  " />);
    expect(screen.getByText('React')).toBeInTheDocument();
  });
});
```

## Mocking

**Framework:** Not configured (recommend Vitest mocking)

**Recommended Patterns:**

**Mocking `fs` for Blog Utils:**
```typescript
import { vi, describe, it, expect, beforeEach } from 'vitest';
import fs from 'fs';

vi.mock('fs');

describe('getBlogPosts', () => {
  beforeEach(() => {
    vi.mocked(fs.readdirSync).mockReturnValue(['post1.mdx', 'post2.mdx']);
    vi.mocked(fs.readFileSync).mockReturnValue(`---
title: Test Post
publishedAt: 2024-01-01
summary: Test summary
tags: test, example
---
Content here`);
  });

  it('returns array of blog posts', () => {
    const posts = getBlogPosts();
    expect(posts).toHaveLength(2);
  });
});
```

**Mocking Next.js Navigation:**
```typescript
vi.mock('next/navigation', () => ({
  notFound: vi.fn(),
  useRouter: vi.fn(() => ({ push: vi.fn() })),
}));
```

**What to Mock:**
- File system operations (`fs`)
- External APIs (clipboard, navigator.share)
- Next.js navigation functions
- Date/time for deterministic tests

**What NOT to Mock:**
- Pure utility functions
- Simple components without side effects
- Type definitions

## Fixtures and Factories

**Recommended Test Data Location:**
```
app/
└── __tests__/
    └── fixtures/
        ├── posts.ts       # Mock blog post data
        ├── projects.ts    # Mock project data
        └── articles.ts    # Mock article data
```

**Factory Pattern:**
```typescript
// app/__tests__/fixtures/posts.ts
export function createMockPost(overrides = {}) {
  return {
    slug: 'test-post',
    metadata: {
      title: 'Test Post',
      publishedAt: '2024-01-01',
      summary: 'Test summary',
      tags: 'test, example',
    },
    content: 'Test content',
    ...overrides,
  };
}

export function createMockPosts(count: number) {
  return Array.from({ length: count }, (_, i) =>
    createMockPost({
      slug: `test-post-${i}`,
      metadata: {
        title: `Test Post ${i}`,
        publishedAt: `2024-01-${String(i + 1).padStart(2, '0')}`,
      },
    })
  );
}
```

## Coverage

**Requirements:** Not enforced (no tests exist)

**Recommended Targets:**
- Utility functions: 90%+
- Components: 70%+
- Routes: 60%+

**View Coverage (after setup):**
```bash
npm run test:coverage
```

## Test Types

**Unit Tests:**
- Scope: Individual functions, components in isolation
- Location: Co-located with source files
- Mock external dependencies

**Integration Tests:**
- Scope: Page rendering, route handlers
- Location: `app/__tests__/`
- Test data flow through components

**E2E Tests:**
- Not configured
- Consider Playwright for future E2E testing
- Would test: blog navigation, share functionality, RSS feed

## Common Patterns

**Async Testing:**
```typescript
import { describe, it, expect } from 'vitest';

describe('ShareButton', () => {
  it('copies URL to clipboard', async () => {
    const mockClipboard = { writeText: vi.fn().mockResolvedValue(undefined) };
    Object.assign(navigator, { clipboard: mockClipboard });

    render(<ShareButton url="https://test.com" title="Test" slug="test" />);

    await userEvent.click(screen.getByText('Share'));
    await userEvent.click(screen.getByText('Copy Link'));

    expect(mockClipboard.writeText).toHaveBeenCalledWith('https://test.com');
  });
});
```

**Error Testing:**
```typescript
describe('getBlogPosts', () => {
  it('handles missing frontmatter gracefully', () => {
    vi.mocked(fs.readFileSync).mockReturnValue('No frontmatter content');

    expect(() => getBlogPosts()).not.toThrow();
  });
});
```

**Snapshot Testing (for OG images):**
```typescript
describe('OG Image Route', () => {
  it('generates consistent image response', async () => {
    const request = new Request('http://localhost/og?title=Test');
    const response = await GET(request);

    expect(response.headers.get('content-type')).toBe('image/png');
  });
});
```

## Priority Testing Recommendations

**Phase 1 - Critical Path:**
1. `app/blog/utils.ts` - Core blog functionality
2. `app/components/posts.tsx` - Blog listing

**Phase 2 - Data Integrity:**
1. `app/articles/articles.ts` - Article functions
2. `app/rss/route.ts` - RSS generation
3. `app/sitemap.ts` - SEO critical

**Phase 3 - User Features:**
1. `app/components/ShareButton.tsx` - User interaction
2. `app/components/ProjectCard.tsx` - Complex state

---

*Testing analysis: 2026-01-26*
