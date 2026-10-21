# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Recruiters and executives** evaluating Victor for senior roles or engagements. They skim, decide in seconds whether he is senior, and want a clear way to reach him.
- **Developers and engineers** who arrive from search, social, or a citation to read a post, paper, or compendium note, and stay if the reading is good.

Victor wants all three groups to leave with a sense of his experience and authority.

## Product Purpose

The site is Victor Bona's personal site, blog, and body of work. It exists to prove seniority through real output and to convert an impressed visitor into contact. Success means a recruiter or executive understands his level within seconds and contacts him, and a developer reads deeply and comes back.

## Positioning

Victor Bona is a Senior Software Engineer, distributed systems specialist, and AI enthusiast. What a generic portfolio cannot copy is the depth of the published record:

- preprints with DOIs on reliability, trace sampling, and graph search;
- whitepapers for systems he built;
- 150 compendium notes;
- shipped systems such as Guara Cloud, Purple Wolf, and Nidus.

## Operating Context

The site is a Next.js App Router project deployed with Docker and Helm (see `chart/`). Content is authored as:

- MDX blog posts in `app/blog/posts/`;
- typed paper data in `app/articles/articles.ts`, with PDFs in `public/papers/`;
- typed project data in `app/projects/projects.ts`;
- compendium Markdown notes in `app/compendium/content/`.

Observability (Prometheus page-view metrics via middleware headers) and third-party analytics are part of the layout and must keep working.

## Capabilities and Constraints

- **Keep all content and routes:** writing (39 posts), papers (7), systems (15 projects), and compendium (8 collections, 150 notes), along with their URLs. The supporting outputs (RSS, sitemap, robots, llms.txt, and the dynamic OG images) stay too.
- **Add a profile/about surface:** career timeline, headshot, scale numbers, and talks/OSS/links.
- **Contact** is the primary conversion. The confirmed public address is victor.bona@hotmail.com; LinkedIn and X are secondary. Replace the old victor@victorbona.dev wherever it appears.
- **SEO is a goal:**
  - Correct the Person schema: the jobTitle is currently "Full-stack engineer".
  - Per-page OG images.
  - Project schema.
  - A consistent LinkedIn URL.
- **The MDX pipeline stays:** next-mdx-remote, GFM, KaTeX math, sugar-high highlighting, and Mermaid diagrams.
- **First pass scope:** the whole site.

## Brand Commitments

- **Name:** Victor Bona. Existing logo and monogram assets are in `public/logos/`.
- **One-liner (confirmed):** "Senior Software Engineer, Distributed systems specialist and AI enthusiast."
- **Visual direction (user-pinned):** dark, with a green/black palette and a cyberpunk influence. getcrow.dev is a reference for restraint and craft, not something to copy. The user wants the result to feel personal, not borrowed.
- **The old `.impeccable.md` is superseded,** including its bans on neon and dark UI.

## Evidence on Hand

- **Papers:** 7 in `public/papers/`. Three are Zenodo preprints with DOIs; four are independently published whitepapers.
- **Writing and notes:** 39 MDX posts and 150 compendium notes.
- **Systems:** 15 project entries, with images under `public/projects/`.
- **User-confirmed, not yet in the repo:** a headshot, a career timeline (companies, roles, years), real scale numbers (years of experience, system scale, and similar), and talks, OSS, and links. These must be supplied by Victor. Never fabricate them; leave placeholders that are clearly marked until he supplies them.

## Product Principles

1. **Proof over adjectives.** Seniority is shown through real artifacts and numbers, never self-praise.
2. **Two speeds.** The site gives a seconds-long read of authority for decision makers and a deep, comfortable read for engineers.
3. **Every page leads somewhere.** Each page offers a path to contact or to more of the body of work.
4. **Nothing is invented.** Facts, numbers, and history come from Victor.

## Accessibility & Inclusion

Long-form reading must stay highly legible in the dark theme:

- WCAG AA contrast;
- support for reduced motion;
- no effects that sit behind body text and hurt reading.
