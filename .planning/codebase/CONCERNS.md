# Codebase Concerns

**Analysis Date:** 2026-01-26

## Tech Debt

**Alpha/Canary Dependencies:**
- Issue: Using unstable versions of critical dependencies
- Files: `package.json`
- Impact: Breaking changes possible with any update. `tailwindcss: 4.0.0-alpha.13` and `@tailwindcss/postcss: 4.0.0-alpha.13` are alpha releases. `next: canary` uses the bleeding-edge version.
- Fix approach: Pin to stable versions when available. Monitor changelogs before updating.

**TypeScript Strict Mode Disabled:**
- Issue: `strict: false` in tsconfig allows implicit any types and other unsafe patterns
- Files: `tsconfig.json`
- Impact: Type errors may slip through to runtime. Reduces type safety benefits.
- Fix approach: Enable `strict: true` and fix resulting type errors incrementally.

**Missing Linting/Formatting:**
- Issue: No ESLint or Prettier configuration found
- Files: Root directory (missing `.eslintrc`, `.prettierrc`)
- Impact: Code style inconsistencies, potential bugs not caught by linting rules
- Fix approach: Add ESLint with Next.js recommended config. Add Prettier for consistent formatting.

**Non-null Assertion in Frontmatter Parser:**
- Issue: Uses `match![1]` which will throw if regex doesn't match
- Files: `app/blog/utils.ts:16`
- Impact: Runtime crash if MDX file is malformed or missing frontmatter
- Fix approach: Add null check: `if (!match) throw new Error('Invalid frontmatter')`

**Empty Articles Array:**
- Issue: Articles feature is scaffolded but contains no data
- Files: `app/articles/articles.ts`
- Impact: Articles section renders empty. Code exists for a feature that is unused.
- Fix approach: Either populate with content or remove the feature entirely to reduce dead code.

**Untyped Function Parameters:**
- Issue: Several functions use implicit `any` for parameters
- Files: `app/blog/utils.ts:31` (`getMDXFiles(dir)`), `app/blog/utils.ts:35` (`readMDXFile(filePath)`), `app/components/mdx.tsx` (multiple functions)
- Impact: No type safety for these functions. Editor autocomplete not available.
- Fix approach: Add explicit types: `function getMDXFiles(dir: string)`

## Known Bugs

**RSS Feed Missing Async Handling:**
- Symptoms: `getBlogPosts()` is synchronous but called with `await`
- Files: `app/rss/route.ts:5`
- Trigger: Won't cause immediate issues but indicates confusion about the API
- Workaround: Currently works because `await` on non-promise just returns the value

**Placeholder Content in Article Page:**
- Symptoms: Article pages show "Article content will be rendered here" placeholder
- Files: `app/articles/[slug]/page.tsx:184-194`
- Trigger: Viewing any article page
- Workaround: Feature appears incomplete - articles don't have content rendering implemented

## Security Considerations

**dangerouslySetInnerHTML Usage:**
- Risk: XSS vulnerabilities if content is not properly sanitized
- Files: `app/components/mdx.tsx:55`, `app/articles/[slug]/page.tsx:68`, `app/blog/[slug]/page.tsx:92`
- Current mitigation: Used for code highlighting (sugar-high library) and JSON-LD structured data
- Recommendations: Ensure sugar-high properly escapes output. JSON-LD usage is safe as it's internally generated.

**External Analytics Script Rewrite:**
- Risk: Proxying external analytics script through rewrites
- Files: `next.config.mjs:3-13`
- Current mitigation: datafa.st appears to be the analytics provider
- Recommendations: Verify datafa.st is a trusted service. Document why this rewrite is needed.

**Environment File Present:**
- Risk: `.env` file exists - could contain secrets
- Files: `.env`
- Current mitigation: Unknown - file contents not examined
- Recommendations: Ensure `.env` is in `.gitignore`. Never commit secrets.

## Performance Bottlenecks

**Synchronous File Reading:**
- Problem: Blog posts are read synchronously from filesystem on every request
- Files: `app/blog/utils.ts:36` (`fs.readFileSync`)
- Cause: `getBlogPosts()` scans and parses all MDX files synchronously
- Improvement path: Use async file reading or implement caching. For static export, this is acceptable.

**Unoptimized GIF Loading:**
- Problem: GIFs in project cards are marked as `unoptimized`
- Files: `app/components/ProjectCard.tsx:29`
- Cause: GIFs cannot be optimized by Next.js Image component
- Improvement path: Consider converting GIFs to WebM/MP4 for better compression and quality.

**No Image Size Specifications:**
- Problem: Some images may cause layout shift
- Files: `app/components/mdx.tsx:50` (RoundedImage spreads props without enforcing width/height)
- Cause: MDX images don't require dimensions
- Improvement path: Enforce width/height props or use placeholder blur.

## Fragile Areas

**Frontmatter Parser:**
- Files: `app/blog/utils.ts:13-29`
- Why fragile: Custom YAML-like parser assumes specific format. Colons in values will break parsing.
- Safe modification: Test with edge cases - values containing colons, multiline values, special characters
- Test coverage: No tests exist for this parser

**MDX Component System:**
- Files: `app/components/mdx.tsx`
- Why fragile: Custom heading slugification, code highlighting, and link handling - all without type safety
- Safe modification: Add type definitions. Test all component overrides.
- Test coverage: No component tests exist

**Tag Parsing:**
- Files: `app/blog/[slug]/page.tsx:35,85`
- Why fragile: Tags are stored as comma-separated string in frontmatter, split at runtime
- Safe modification: Tags with commas would break. Consider using YAML array syntax.
- Test coverage: None

## Scaling Limits

**File-based Content:**
- Current capacity: Works well for small number of posts (<100)
- Limit: File system scanning becomes slow with thousands of posts
- Scaling path: Migrate to database or headless CMS if content grows significantly

**No Pagination:**
- Current capacity: All posts loaded at once
- Limit: Performance degrades with many posts
- Scaling path: Implement pagination in `BlogPosts` component and blog page

## Dependencies at Risk

**Next.js Canary:**
- Risk: Using canary (unstable) release
- Impact: Unexpected breaking changes, potential bugs, no stable API guarantees
- Migration plan: Pin to latest stable version (e.g., `next@14.x.x` or `next@15.x.x`)

**Tailwind CSS Alpha:**
- Risk: `tailwindcss: 4.0.0-alpha.13` is alpha release
- Impact: API changes, potential bugs, incomplete features
- Migration plan: Downgrade to `tailwindcss@3.x` for stability, or wait for v4 stable

**React 18.2.0 vs React 19:**
- Risk: Older React version while using canary Next.js
- Impact: May miss features or encounter compatibility issues
- Migration plan: Consider upgrading React when Next.js stable version ships

## Missing Critical Features

**No Test Suite:**
- Problem: Zero test files in the project
- Blocks: Confident refactoring, CI/CD quality gates, regression prevention
- Priority: High - add at minimum tests for frontmatter parser and utility functions

**No Error Boundary:**
- Problem: No React error boundaries for graceful error handling
- Blocks: Good UX when errors occur - users see white screen
- Priority: Medium - add error boundaries around MDX rendering and page components

**No CI/CD Pipeline:**
- Problem: No GitHub Actions or similar CI configuration found
- Blocks: Automated testing, linting, deployment verification
- Priority: Medium - add basic CI pipeline for builds and (future) tests

## Test Coverage Gaps

**Complete Absence of Tests:**
- What's not tested: Everything - no test files exist in the project
- Files: All `app/**/*.ts`, `app/**/*.tsx`
- Risk: Any change could break existing functionality without detection
- Priority: High

**Critical Paths Without Tests:**
- Frontmatter parsing (`app/blog/utils.ts`)
- MDX rendering (`app/components/mdx.tsx`)
- Article/blog slug generation
- RSS feed generation (`app/rss/route.ts`)
- Date formatting utilities

---

*Concerns audit: 2026-01-26*
