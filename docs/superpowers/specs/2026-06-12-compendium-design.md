# Compendium Section Design

Date: 2026-06-12
Status: Approved for implementation planning

## Purpose

Add a public `Compendium` section to `victorbona.blog` that publishes a source-controlled snapshot of selected Obsidian knowledge-base notes.

The section should expose software engineering reference material in a structured notebook experience, not as ordinary blog posts and not as a marketing landing page. It should sit beside the existing public sections:

```text
Writing | Systems | Papers | Compendium
```

The first release imports only these vault folders:

```text
/Users/victorbona/Documents/Obsidian Vault/Knowledge base/Software Engineering
/Users/victorbona/Documents/Obsidian Vault/Knowledge base/Data Structures
/Users/victorbona/Documents/Obsidian Vault/Knowledge base/Design Patterns
```

Content copied from the vault becomes source-controlled blog content. The vault is not the runtime source of truth after import.

## Public Route Shape

Use `/compendium` as the public archive route.

```text
/compendium
/compendium/software-engineering
/compendium/software-engineering/distributed-systems
/compendium/data-structures
/compendium/data-structures/graphs
/compendium/design-patterns
/compendium/design-patterns/outbox-pattern
```

The archive page is an index like `/blog`, `/projects`, and `/articles`. It must not be a landing page. It should have a compact header, collection list, metadata, and clear entry points.

## Content Storage

Store copied notes under the Compendium route tree:

```text
app/compendium/
  page.tsx
  [collection]/page.tsx
  [collection]/[slug]/page.tsx
  utils.ts
  content/
    software-engineering/*.md
    data-structures/*.md
    design-patterns/*.md
```

Each copied Markdown note should receive frontmatter during import:

```yaml
---
title: "Distributed Systems"
collection: "software-engineering"
sourcePath: "Knowledge base/Software Engineering/05 Distributed Systems.md"
order: 5
---
```

The implementation may add additional generated fields when useful, such as `description`, `readingTime`, `diagramCount`, or `aliases`, but should keep the copied body readable as Markdown.

## Import And Normalization

Create a repeatable import script rather than manually copying files.

The script should:

- Copy all Markdown files from the three approved vault folders.
- Preserve note bodies, headings, tables, code blocks, lists, math, and Mermaid blocks.
- Generate stable slugs from filenames while stripping numeric prefixes from public note slugs.
- Add frontmatter with title, collection, source path, and order.
- Rewrite supported Obsidian wikilinks.
- Produce a report listing copied notes, converted links, external references, unresolved references, and Mermaid block count.
- Fail on ambiguous duplicate note targets instead of guessing.

Expected first-release source size from the current vault snapshot:

```text
Software Engineering: 16 notes, about 97k words, 94 Mermaid blocks
Data Structures:      21 notes, about 29k words
Design Patterns:      25 notes, about 15k words
```

The exact counts may drift before implementation, so the import report is the source of truth.

## Link Handling

Only notes inside the three imported folders become public Compendium pages.

Internal link rules:

- `[[Graphs]]` becomes `/compendium/data-structures/graphs` when the target is imported.
- `[[05 Distributed Systems#Consensus algorithms]]` becomes `/compendium/software-engineering/distributed-systems#consensus-algorithms`.
- `[[Outbox Pattern|transactional outbox]]` preserves visible text and points to the public Compendium route.
- Links across the three imported collections remain clickable.

External vault reference rules:

- Links to notes outside the imported set render as non-clickable references.
- These references should be visually distinct but quiet, for example muted inline reference chips or plain text references.
- They must not point to broken public URLs.
- They must not trigger importing unrelated private vault content.

Unresolved links are build blockers unless intentionally classified as external vault references by the import report.

## Rendering Architecture

Build a Compendium-specific renderer rather than using the blog post page directly. Blog posts and Compendium notes have different navigation needs.

The renderer should support:

- Markdown files rendered through the site's MDX pipeline after import-time normalization.
- Code highlighting consistent with the existing blog.
- Tables that scroll within their own container on narrow screens.
- Math support if source notes contain math.
- Obsidian-style links after normalization.
- Mermaid diagrams.
- Heading anchors and local table of contents.

Notebook page layout:

```text
+----------------------+-------------------------------+----------------+
| collection navigation | note content                   | local TOC      |
+----------------------+-------------------------------+----------------+
```

Responsive behavior:

- Desktop: side navigation, content, and TOC.
- Tablet: navigation compresses above or beside content as space allows.
- Mobile: content first, with collection navigation and TOC as compact sections.
- No text, table, code block, or diagram may overflow the viewport.

## Mermaid Diagram Requirements

Mermaid rendering is a first-class requirement because the Software Engineering corpus currently contains 94 Mermaid blocks.

Requirements:

- Render Mermaid blocks as diagrams, not plain code.
- Use a responsive viewport-safe container.
- Scale SVG output down to fit the available width.
- Allow horizontal pan or scroll for diagrams that cannot be legibly compressed.
- Preserve readable labels on desktop and mobile.
- Provide a graceful loading state.
- Provide a code fallback if Mermaid rendering fails.
- Ensure diagram rendering does not cause layout shift that breaks reading flow.

Verification must include representative desktop and mobile checks for:

- A dense Software Engineering note with Mermaid.
- A wide graph or flowchart.
- A note with multiple diagrams.
- A note without diagrams.

## UX And Navigation

`/compendium` should be compact and archive-like.

Archive page content:

```text
Compendium
Software Engineering      16 notes
Data Structures           21 notes
Design Patterns           25 notes
```

Collection pages should show:

- Collection title and concise description.
- Ordered note list.
- Note count.
- Approximate reading time.
- Diagram count where relevant.
- Internal reference summary when available.

Note pages should show:

- Collection context.
- Note title.
- Source attribution line.
- Local table of contents.
- Main note body.
- Related notes from outgoing links and backlinks.
- Previous and next notes in collection order.

Source attribution text should be transparent but quiet, for example:

```text
Adapted from Victor Bona's Obsidian Compendium snapshot.
```

## SEO And Discovery

Treat Compendium as a first-class public site section.

Add:

- Metadata and canonical URLs for archive, collection, and note pages.
- `/compendium`, collection pages, and all note pages to `app/sitemap.ts`.
- Compendium summary lines to `/llms.txt`.
- Structured data where it fits:
  - `CollectionPage` for collection pages.
  - `TechArticle` or `Article` for individual notes.

Keep Compendium separate from blog RSS in the first release unless explicitly changed later.

## Non-Goals

The first release does not include:

- Full-text search.
- Live sync from Obsidian at runtime.
- Importing vault folders outside Software Engineering, Data Structures, and Design Patterns.
- Publishing private vault notes referenced by links outside the selected folders.
- Turning notes into blog posts or RSS feed items.
- A marketing landing page.

## Validation

Primary validation:

```bash
npm run build
npm run test:seo
```

Additional validation:

- Import report shows all intended notes copied.
- Import report shows no unresolved internal links.
- External vault-only references are intentionally non-clickable.
- Mermaid block count is reported.
- Sitemap includes archive, collection, and note pages.
- `/llms.txt` includes Compendium coverage.

Browser verification should inspect:

- `/compendium`
- `/compendium/software-engineering`
- One dense Software Engineering note with Mermaid
- One Data Structures note with long code or table content
- One Design Patterns note
- Mobile and desktop viewport behavior

The implementation is not complete until representative Mermaid diagrams render cleanly and fit the screen without breaking the layout.

## Residual Risks

- Mermaid rendering may need client-side behavior, which can introduce loading or hydration concerns.
- Obsidian Markdown can contain conventions that plain MDX does not understand, so normalization must happen before rendering.
- The corpus is large enough that loaders should avoid bundling every note into every page.
- Link resolution must remain deterministic as more Compendium collections are added later.
