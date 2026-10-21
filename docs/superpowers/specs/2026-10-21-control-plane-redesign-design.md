# Control Plane redesign — design

Status: approved by Victor on 2026-10-21. Product truth is in `PRODUCT.md`. The visual contract is in `.impeccable/surfaces/app-page-tsx.md`.

## Intent

Rebuild victorbona.blog into a personal site that feels like Victor and that shows authority through real output. Recruiters and executives should read seniority within 5 seconds and contact him. Developers should read deeply and comfortably. One-liner: "Senior Software Engineer, Distributed systems specialist and AI enthusiast."

## Goals

- A new dark visual world called "Control Plane — Phosphor Edition". Victor is the leader node, and his work appears as tracks through concentric rings. The look has phosphor-terminal details.
- Every existing route and content type keeps working:
  - 39 posts and their tags;
  - 7 papers;
  - 15 systems;
  - 8 compendium collections with 150 notes;
  - RSS, sitemap, robots, llms.txt and OG images.
- A new `/about` profile page, with a headshot, career timeline, scale numbers, and talks/OSS/links.
- Contact is the primary action on every page: `victor.bona@hotmail.com` via mailto, with LinkedIn and X as secondary.
- Long-form pages are excellent to read.
- SEO fixes:
  - Person `jobTitle` becomes "Senior Software Engineer";
  - OG images on every page;
  - project JSON-LD;
  - one consistent LinkedIn URL;
  - a real `dateModified`;
  - RSS gets atom:self;
  - updated llms.txt and keywords;
  - fixed tag canonical encoding;
  - not-found metadata.

## Non-goals / anti-goals

- No gimmicky terminal-only navigation. Normal links always work.
- No glow, scanlines, or grain behind body text.
- No blocking boot screen.
- No neon everywhere: green means lit, live, or the primary action.
- No invented facts or numbers. Missing profile data gets clearly marked placeholders in one data file.
- No light mode. The site is dark only, as Victor approved.

## Decided

- **Stack:** upgrade to stable Next.js and Tailwind v4 first, then redesign. Keep the MDX pipeline: next-mdx-remote, GFM, KaTeX, sugar-high, and Mermaid re-themed for dark.
- **Nav:** page addresses for each section:
  - P100 Home
  - P200 Profile
  - P300 Papers
  - P400 Systems
  - P500 Writing
  - P600 Compendium
- **Terminal:** ⌘K or `:` opens a command palette with `cd <section>`, `open <slug>`, `mail` and `help`. Unknown commands print help.
- **Boot line:** shows once per first visit and never blocks.
- **404:** styled as a kernel panic.
- **Home hero:**
  - Left: a typed status line, the one-liner at display scale, and a lit `contact` command.
  - Right: an SVG ring display with real counts. Hovering or focusing a track isolates it.
  - Below: a `kubectl get`-style table of recent work.
- **Status by stroke:** solid means live, dashed means maintained, gapped means archived. Lit items are heavier.
- **Reduced motion, narrow screens and assistive tech:** the rings fall back to an accessible list, and motion settles to its final state.
- **Observability stays wired in:** middleware headers, PageViewTracker, OTel, and analytics scripts.

## Left to the builder

- Exact typefaces. Use a clean sans for prose and a mono for machine data, and avoid the overused developer faces.
- Exact spacing scale, component boundaries and file names, following repo conventions.
- The ring layout algorithm.
