# Victor Bona Blog Design Refactor

Date: 2026-06-07
Status: Approved for implementation planning

## Purpose

Refactor `victorbona.blog` into a compact public operating archive for an engineer building real systems. The site should foreground sharp technical thinking, shipped systems, and longer-form credibility without becoming a generic developer portfolio, startup landing page, or decorative publication.

The primary audience is engineering peers, senior builders, founders, and operators who want to understand how Victor thinks, what he has shipped, and which ideas are worth reading.

## Design Direction

The approved direction is **Operating Index with controlled Technical Zine edges**.

The site should feel:

- Minimal, raw, and opinionated.
- Focused on content, ideas, projects, and papers.
- Dense enough to scan quickly without feeling crowded.
- Serious and practical, with projects as proof behind the writing.

The interface copy can be clearly opinionated, but it should remain terse. Labels should behave like archive labels, not marketing slogans.

## Information Architecture

Keep the existing public route shape:

- `/`
- `/blog`
- `/blog/[slug]`
- `/projects`
- `/articles`

Refactor the presentation and hierarchy across those routes.

Homepage structure:

```text
+--------------------------------------------------+
| VICTOR BONA                                      |
| Sharp one-line author/operator statement          |
| nav: writing / projects / papers                 |
+--------------------------------------------------+

CURRENT ARGUMENT
One featured essay or selected idea with summary and tags.

FIELD NOTES
Dense recent post list grouped for scanning.

SHIPPED SYSTEMS
Selected projects with blunt status, role, stack, and links.

PAPERS / LONGER WORK
Quiet section for slower-form credibility.

ARCHIVE
Fast route to all writing by date/tag.
```

Use stronger section names such as `Current Argument`, `Field Notes`, `Shipped Systems`, `Longer Work`, and `Archive`. Avoid generic headings like `Recent Posts` and `Explore my projects`.

## Density Model

Avoid excessive verticality. The first viewport should communicate the author signal, a featured idea, recent writing, and at least the beginning of shipped systems.

Desktop target:

```text
+--------------------------------------------------------------+
| VICTOR BONA                      nav                         |
| building software systems, infra, and sharp opinions          |
+------------------------------+-------------------------------+
| CURRENT ARGUMENT             | FIELD NOTES                   |
| featured essay, concise      | 4-6 recent posts as rows      |
+------------------------------+-------------------------------+
| SHIPPED SYSTEMS: compact project row / row / row              |
+--------------------------------------------------------------+
```

Rules:

- Use two-column composition on desktop when it improves scanning.
- Keep homepage sections compact and information-rich.
- Use rows, tables, bordered groups, and typographic hierarchy instead of tall card grids.
- Keep project summaries concise by default.
- Preserve mobile readability without oversized hero typography.
- Keep metadata inline where possible.

## Visual System

Theme:

- Preserve automatic light/dark support.
- Redesign both modes deliberately.
- Light mode should feel like tinted paper, not generic white UI.
- Dark mode should feel like a working archive, not a neon developer theme.

Typography:

- Replace the current generic Geist-only feel with a more distinctive display/body pairing.
- Use a clear hierarchy with fewer, more intentional sizes.
- Keep article body text readable and capped to a comfortable line length.
- Avoid using monospace as a lazy technical signal.

Color:

- Use tinted neutrals with OKLCH-based tokens.
- Use one restrained accent color sparingly.
- Avoid neon, glow-heavy palettes, cyan-on-dark, purple-blue gradients, and gradient text.

Layout and details:

- Prefer hard dividers, compact metadata blocks, status marks, and archive-like numbering.
- Avoid thick side-stripe accents, generic glow cards, icon-card grids, card nesting, and large decorative hero sections.
- Use motion sparingly for page entry and hover feedback only.

## Component Scope

Refactor the presentation layer while preserving the app structure.

Keep:

- Existing routes and URLs.
- MDX post files and frontmatter contract.
- Health, readiness, metrics, RSS, sitemap, robots, and OG routes.
- Docker, Helm, and CI configuration unless implementation requires small compatibility updates.

Refactor:

- Global tokens and prose styling in `app/global.css`.
- Root shell in `app/layout.tsx`.
- Navigation and footer.
- Homepage composition in `app/page.tsx`.
- Blog listing in `app/blog/page.tsx` and shared post-list components.
- Blog article template in `app/blog/[slug]/page.tsx`.
- Project presentation in `app/projects/page.tsx` and project components.
- Articles/papers presentation in `app/articles/page.tsx`.

Likely shared components:

```text
app/components/
  SectionHeader
  MetadataLine
  FeaturedArgument
  WritingRow
  SystemRow
  PaperRow
  StatusMark
```

Names can change during implementation if the codebase points to cleaner boundaries.

## Content Curation

This pass includes light curation only.

Allowed:

- Rename generic page and section headings.
- Pick a featured/current argument from existing posts.
- Improve weak summaries and section framing when they hurt the surface.
- Make selected projects more prominent as shipped-system proof.

Not included:

- Full MDX essay rewrites.
- Hiding or archiving old posts without explicit approval.
- New CMS/content pipeline.
- New complex filtering system unless implementation discovers a simple, low-risk reuse path.

## Reading Experience

Blog posts should feel like serious essays in an archive.

Requirements:

- Keep title, date, reading time, tags, and share behavior.
- Replace the current summary block style with a design that does not rely on a thick side border.
- Improve article typography and code block treatment.
- Keep reading progress if it remains visually coherent.
- Keep related posts, but make the section compact.

## Project And Paper Experience

Projects should read like shipped-system dossiers, not equal portfolio cards.

Requirements:

- Show name, status, role/scope, stack, and links with compact hierarchy.
- Make Guara Cloud, Purple Wolf, and SQLTemple easy to notice.
- Keep GIF/media support, but avoid making media dominate the index.
- Put deeper details behind project pages or progressive disclosure only if the existing route shape supports it cleanly.

Papers/articles should stay quiet and credible. If there are no active papers, the UI should not pretend otherwise; it should present the section as reserved for longer-form work.

## Validation

Primary validation:

```bash
npm run build
```

Additional validation:

```bash
docker build -t victorbona-blog .
```

Run `helm lint chart/` only if chart files change.

After implementation, manually inspect the local site in a browser for:

- Homepage density and first-viewport information.
- Blog archive scanning.
- Article readability.
- Projects section density.
- Light and dark theme quality.
- Mobile layout with no text overlap or oversized hero treatment.
