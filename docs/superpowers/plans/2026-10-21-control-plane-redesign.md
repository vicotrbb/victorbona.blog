# Control Plane Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild victorbona.blog in the "Control Plane — Phosphor Edition" visual world on a stable stack. Every route keeps working, and the work adds a profile page, a ring-display home, a ⌘K terminal, and the SEO fixes.

**Architecture:**
- Pure logic lives in small dependency-free TS modules under `app/lib/`, tested with `node --test`. That covers ring layout, terminal commands, site counts, and profile data.
- The UI consumes these modules.
- Visual tokens live in `app/global.css` as CSS variables, used through Tailwind v4 arbitrary values the way the repo already does.
- Each page family (home, about, writing, papers, systems, compendium) is restyled in its own task.

**Tech Stack:**
- Next.js (latest stable) with the App Router, React 19 and TypeScript.
- Tailwind CSS v4 (stable).
- MDX via next-mdx-remote, with remark-gfm, KaTeX, sugar-high and Mermaid.
- `node:test` with native type stripping (Node ≥ 22.6; local is v24).

**Spec:** `docs/superpowers/specs/2026-10-21-control-plane-redesign-design.md`. The visual contract is in `.impeccable/surfaces/app-page-tsx.md`, and product truth is in `PRODUCT.md`.

## Global Constraints

- **One-liner, verbatim:** "Senior Software Engineer, Distributed systems specialist and AI enthusiast"
- **Contact:** `victor.bona@hotmail.com` via `mailto:`. It is the primary action on every page. LinkedIn and X are secondary. Remove every `victor@victorbona.dev`.
- **Dark only.** No light theme and no `prefers-color-scheme` branches.
- **Colour tokens** (`app/global.css` `:root`):

  | Token | Value |
  |---|---|
  | `--bg` | `#020604` |
  | `--panel` | `#08110c` |
  | `--line` | `#15241b` |
  | `--line-strong` | `#1f5c3a` |
  | `--text` | `#d8e8de` |
  | `--dim` | `#6f8f7c` |
  | `--lit` | `#4dff8f` |
  | `--warn` | `#e8c45c` |
  | `--err` | `#f08585` |

- **Fonts** (`next/font/google`): Schibsted Grotesk for prose and UI (`--font-sans`) and Martian Mono for machine data (`--font-mono`, with variable `wght` so lit items get heavier). No other faces.
- **Green (`--lit`) means only lit, live, or the primary action.** No glow, scanlines, or grain behind body text. Glow (`text-shadow`) is allowed only in the home hero and the terminal.
- **Status is drawn by stroke:**
  - `live` is a solid 1px line;
  - `maintained` is a dashed line;
  - `archived` is a gapped line (`dotted`), plus dim text.
- **Page addresses:**

  | Address | Section | Route |
  |---|---|---|
  | P100 | Home | `/` |
  | P200 | Profile | `/about` |
  | P300 | Papers | `/articles` |
  | P400 | Systems | `/projects` |
  | P500 | Writing | `/blog` |
  | P600 | Compendium | `/compendium` |

- **Motion:** every animation sits behind `@media (prefers-reduced-motion: no-preference)`. Content is visible by default, and nothing loops forever except the heartbeat, which stops under reduced motion.
- **No invented facts.** Missing profile data renders as a visible `[pending]` marker and is omitted from JSON-LD.
- **Keep wired in:** `middleware.ts` metrics headers, `PageViewTracker`, `instrumentation.ts`, the datafa.st and Himetrica scripts, and Vercel `Analytics`.
- **Validation per task:** `npm test && npm run test:seo && npm run test:compendium && npm run build`.

## Review Focus

1. **Terminal input that is empty, whitespace, unknown, or an `open` slug with no match:** prints a help or "not found" line, never throws or navigates. Tests are in Task 4.
2. **Ring with 0 items, or with a count far above the drawable nodes (compendium = 150):** no NaN coordinates. Rings draw at most `maxNodes` tracks and label the real count. Tests are in Task 5.
3. **Reduced motion and no JS:** the ring display's `<ol>` list fallback and all text are present in the server HTML, and the heartbeat is off. A source assertion is in Task 5.
4. **Profile fields still pending:** UI shows `[pending]`, and `getPersonJsonLd()` omits them with no `null` in the output. Tests are in Task 2.
5. **Tags containing spaces, `#` or `/`:** the tag page canonical equals the sitemap URL (`encodeURIComponent`). A seo-smoke assertion is in Task 10.

---

### Task 1: Upgrade to a stable stack and add a test runner

**Files:**
- Modify: `package.json`, `package-lock.json`, `next.config.js`, `tsconfig.json`, `postcss.config.*`
- Modify: every dynamic route that reads `params` or `headers()`: `app/blog/[slug]/page.tsx`, `app/blog/tag/[tag]/page.tsx`, `app/articles/[slug]/page.tsx`, `app/compendium/[collection]/page.tsx`, `app/compendium/[collection]/[slug]/page.tsx`, `app/components/page-view-tracker.tsx`, `app/not-found.tsx`
- Create: `app/lib/smoke.test.ts`

**Interfaces:**
- Produces: the `npm test` script, `node --test --experimental-strip-types 'app/**/*.test.ts'`. Tests import sibling modules with explicit `.ts` extensions.

- [ ] **Step 1:** `npm i next@latest react@latest react-dom@latest tailwindcss@^4 @tailwindcss/postcss@^4 typescript@^5 @types/react@^19 @types/react-dom@^19 @types/node@^22`, then remove `geist`.
- [ ] **Step 2:** Remove `experimental.instrumentationHook` from `next.config.js`. Add `"allowImportingTsExtensions": true` to `tsconfig.json`; it already has `noEmit`.
- [ ] **Step 3:** Convert `params` to `Promise<...>` and `await` it in pages and `generateMetadata`. `generateStaticParams` is unchanged. `await headers()` in `page-view-tracker.tsx` and `not-found.tsx`.
- [ ] **Step 4:** Add the `"test"` script and `app/lib/smoke.test.ts` containing `test("runner works", () => assert.equal(1 + 1, 2))`.
- [ ] **Step 5:** Run the validation command. Expected: all pass, and the build lists every route the old build had.
- [ ] **Step 6:** Commit with `chore: upgrade to stable next, react 19, tailwind 4 and add node test runner`.

### Task 2: Profile data, site counts and identity SEO

**Files:**
- Create: `app/lib/profile.ts`, `app/lib/profile.test.ts`, `app/lib/counts.ts`
- Modify: `app/lib/seo.ts` (`getPersonJsonLd`), `app/layout.tsx` (metadata), `app/llms.txt/route.ts`, `scripts/seo-smoke.mjs`

**Interfaces:**
- Produces, in `profile.ts`:

  ```ts
  export type TimelineEntry = { org: string; role: string; start: string; end: string | null; summary: string };
  export type Talk = { title: string; venue: string; date: string; url?: string };
  export type ScaleFact = { label: string; value: string };
  export const profile: {
    name: "Victor Bona"; oneLiner: string; email: "victor.bona@hotmail.com";
    links: { linkedin: string; x: "https://x.com/BonaVictor"; github: string };
    headshot: string | null; yearsExperience: number | null;
    timeline: TimelineEntry[]; talks: Talk[]; scale: ScaleFact[];
  };
  export function isPending(v: unknown): boolean; // null, undefined, or empty array
  ```

- Produces, in `counts.ts`: `getSiteCounts(): { systems: number; papers: number; writing: number; compendium: number }`. It reads `projects`, `articles`, `getBlogPosts()` and the compendium notes. The pure helper `countBy(items: unknown[]): number` is not needed; use `.length`.
- `headshot`, `yearsExperience`, `timeline`, `talks` and `scale` start as `null` or `[]` until Victor supplies them. `links.linkedin` uses the URL Victor confirms (open item, see Handoff).

- [ ] **Step 1:** Write the failing tests in `profile.test.ts`:
  - `isPending(null) === true`, `isPending([]) === true`, `isPending(3) === false`;
  - `profile.oneLiner` equals the verbatim one-liner;
  - `JSON.stringify(personJsonLd(profile))` contains no `null` and contains `"jobTitle":"Senior Software Engineer"` and `mailto:victor.bona@hotmail.com`.

  To make this testable without Next imports, export a pure `personJsonLd(p: typeof profile, baseUrl: string)` from `app/lib/profile.ts`. `seo.ts`'s `getPersonJsonLd()` wraps it.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL (module missing).
- [ ] **Step 3:** Implement `profile.ts` and `counts.ts`. Make `getPersonJsonLd` delegate to `personJsonLd`.
  - `personJsonLd`: `sameAs` = linkedin, x and github; `knowsAbout` includes "Distributed systems" and "AI systems"; add `image` only when `headshot` is set.
  - Layout metadata: `description` starts with the one-liner. `keywords` replaces "full-stack developer", "React", "portfolio" with "distributed systems", "senior software engineer", "AI systems", "site reliability".
  - `llms.txt`: email becomes the hotmail address, and "Full-stack engineer" becomes the one-liner.
- [ ] **Step 4:** In `seo-smoke.mjs`:
  - add `assertIncludes("app/lib/profile.ts", "victor.bona@hotmail.com")`;
  - add `assertNotIncludes` for `"victor@victorbona.dev"` on `app/lib/seo.ts` and `app/llms.txt/route.ts`;
  - add `assertNotIncludes("app/lib/seo.ts", "Full-stack engineer")`.
- [ ] **Step 5:** Run the validation command. Expected: PASS.
- [ ] **Step 6:** Commit with `feat(seo): profile data source, senior identity and new contact email`.

### Task 3: Design tokens, fonts and site shell (nav, footer, contact)

**Files:**
- Rewrite: `app/global.css`, `app/components/nav.tsx`, `app/components/footer.tsx`
- Modify: `app/layout.tsx` (fonts, `<html className>`, the body shell, and an `id="main"` skip link)
- Create: `app/lib/addresses.ts`, `app/components/StatusStroke.tsx`, `app/components/ContactCommand.tsx`

**Interfaces:**
- Produces, in `addresses.ts`: `export const addresses: { code: "P100"|"P200"|"P300"|"P400"|"P500"|"P600"; label: string; href: string; aliases: string[] }[]`. The values are the Global Constraints table. Aliases are lowercase names such as `["papers","articles"]`. Task 4 uses them.
- Produces: `<StatusStroke status="live"|"maintained"|"archived" />`, a 1px rule using the stroke style from Global Constraints.
- Produces: `<ContactCommand variant="hero"|"inline" />`, which renders `$ contact` as a `mailto:` link styled `--lit`. The hero variant glows.

- [ ] **Step 1:** Rewrite `global.css`:
  - Global Constraints tokens on `:root`, `color-scheme: dark`, and `body { background: var(--bg); color: var(--text) }`.
  - Reading styles: `.prose` at 17–18px, line-height 1.7, `max-width: 68ch`. Headings in the sans at weight 600. Links underlined in `--lit` at 40% opacity, 100% on hover.
  - `code`/`pre` in the mono on `--panel`, with `--sh-*` sugar-high tokens remapped to greens, teal, amber and dim.
  - `::selection` is `--lit` on black.
  - Keep the KaTeX import working. Delete the old OKLCH tokens, the light theme and the 4rem grid background.
- [ ] **Step 2:** Load the fonts in `layout.tsx`: `Schibsted_Grotesk` → `--font-sans`, and `Martian_Mono` with `weight: "variable"` → `--font-mono`. Make the shell full width. Each page owns its max width: `--max-shell: 80rem`, reading column `68ch`.
- [ ] **Step 3:** Build the nav:
  - wordmark `victor-bona` in mono;
  - links rendered as `P300 Papers`, with the code dim and the label normal, and the current route lit (`aria-current="page"`);
  - a `⌘K` button slot (`<button data-terminal-open>`) for Task 4.
  - On mobile, the codes collapse to a horizontally scrollable row. The page itself must not scroll horizontally.
- [ ] **Step 4:** Footer: `<ContactCommand variant="inline" />`, LinkedIn, X, GitHub, RSS, llms.txt and source, plus the line `© {year} Victor Bona · status: Ready`.
- [ ] **Step 5:** Run the validation command. Expected: PASS. Run `npm run dev`, open `/` and a post at 390px and 1440px, and confirm a dark shell and no horizontal scroll.
- [ ] **Step 6:** Commit with `feat(ui): control plane tokens, fonts, nav with page addresses, footer contact`.

### Task 4: Terminal (⌘K / `:`) and first-visit boot line

**Files:**
- Create: `app/lib/terminal.ts`, `app/lib/terminal.test.ts`, `app/components/Terminal.tsx` (client), `app/components/BootLine.tsx` (client), `app/lib/terminal-index.ts`
- Modify: `app/layout.tsx` (mount both)

**Interfaces:**
- Consumes: `addresses` from Task 3.
- Produces, in `terminal.ts`:

  ```ts
  export type IndexEntry = { slug: string; title: string; href: string; kind: "post"|"paper"|"system"|"note" };
  export type TerminalResult =
    | { kind: "navigate"; href: string; echo: string }
    | { kind: "print"; lines: string[] }
    | { kind: "mail"; href: string };
  export function runCommand(input: string, index: IndexEntry[]): TerminalResult;
  ```

- Produces, in `terminal-index.ts`: `getTerminalIndex(): IndexEntry[]`. It is server-only. It is built from posts, articles, projects and compendium notes, and passed to `<Terminal index={...} />` from the layout.

Command semantics:
- `cd <alias|code>` navigates to that address. `cd` with no argument, `~`, or `/` goes to `/`.
- `open <query>` navigates when there is exactly one entry with `slug === query` or a case-insensitive title prefix match. Otherwise it prints up to 5 candidates, or `not found: <query>`.
- `mail` returns `mailto:victor.bona@hotmail.com`.
- `ls` prints the addresses.
- `help`, empty input, and unknown input print the help lines. Unknown input first prints `unknown command: <cmd>`.

- [ ] **Step 1:** Write the failing tests in `terminal.test.ts`:
  - `cd papers` and `cd P300` both → navigate `/articles`;
  - `cd` → navigate `/`;
  - `open nidus` → navigate to the nidus paper href when the index has it;
  - `open zzz` → print containing `not found: zzz`;
  - `mail` → mail `mailto:victor.bona@hotmail.com`;
  - `""`, `"   "` and `"rm -rf /"` → print with `lines[0]` matching `/help|unknown command/`, without throwing.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `runCommand`, then `Terminal.tsx`:
  - It opens on ⌘K/Ctrl+K, on `:` when focus is not in an input, and on the nav button.
  - It is a `<dialog>` with a focus trap, Esc to close, ↑/↓ history, and a scrollback in mono with `--lit` glow on the prompt.
  - `navigate` uses `router.push`; `mail` sets `location.href`.
- [ ] **Step 4:** Build `BootLine.tsx`:
  - On first visit, it shows a one-line strip under the nav. It types `boot: victor-bona control-plane · 15 systems · 7 papers · ready` with the counts from props, over at most 1.2s.
  - It sets `sessionStorage`/`localStorage` inside try/catch.
  - It is `aria-hidden` and never blocks.
  - Under reduced motion it shows the final text instantly.
- [ ] **Step 5:** Run the validation command. Expected: PASS. Manual check: ⌘K → `cd systems` lands on `/projects`.
- [ ] **Step 6:** Commit with `feat(ui): command terminal and first-visit boot line`.

### Task 5: Home: ring display, status hero and recent-work table

**Files:**
- Create: `app/lib/rings.ts`, `app/lib/rings.test.ts`, `app/components/ControlPlane.tsx` (client, for hover/focus isolation), `app/components/StatusTable.tsx`
- Rewrite: `app/page.tsx`
- Delete: `app/components/FeaturedArgument.tsx` (if unused after the rewrite)

**Interfaces:**
- Consumes: `getSiteCounts()` (Task 2), `ContactCommand` and `StatusStroke` (Task 3), and `profile.oneLiner`.
- Produces, in `rings.ts`:

  ```ts
  export type RingInput = { id: "systems"|"papers"|"writing"|"compendium"; label: string; href: string; count: number;
    items: { id: string; title: string; href: string; status?: "live"|"maintained"|"archived" }[] };
  export type PlacedNode = { ringId: RingInput["id"]; id: string; title: string; href: string; x: number; y: number; status?: string };
  export type PlacedRing = { id: RingInput["id"]; label: string; href: string; count: number; r: number; nodes: PlacedNode[] };
  export function layoutRings(rings: RingInput[], size: number, maxNodes?: number /* default 24 */): PlacedRing[];
  ```

  The radii are evenly spaced from `0.22*size/2` to `0.92*size/2`. Nodes are evenly spaced by angle, with a per-ring phase offset of `i * 0.5` rad so tracks don't line up. Each ring draws `min(items.length, maxNodes)` nodes.

- [ ] **Step 1:** Write the failing tests in `rings.test.ts`:
  - 4 rings → 4 radii, strictly increasing, all `<= size/2`;
  - a ring with 0 items → `nodes.length === 0`, and `count` is preserved;
  - a ring with 150 items → `nodes.length === 24`, and `count === 150`;
  - every coordinate is finite and inside `[0, size]`.
- [ ] **Step 2:** Run `npm test`. Expected: FAIL.
- [ ] **Step 3:** Implement `layoutRings`. Then build `ControlPlane.tsx`, an SVG in `viewBox 0 0 size size`:
  - the centre node is labelled `victor-bona · leader`;
  - each ring is a circle stroked `--line`, with its label and the real count in mono (`Compendium 150`);
  - nodes are `<a>` elements with `<title>`;
  - hover or focus on a node or ring sets `data-active`, which lights that ring (`--lit`, heavier mono weight) and dims the others to 30%;
  - a heartbeat pulse is an animated `stroke-dashoffset` on one radial line per ring, and only runs under `prefers-reduced-motion: no-preference`;
  - the SVG has `role="img"` and `aria-label`. Beside it, an `<ol>` lists each ring with its count and link. It is visible under 768px, where the SVG is hidden, and is otherwise `sr-only`.
- [ ] **Step 4:** Build `StatusTable.tsx`, a `kubectl get`-style `<table>` with columns `NAME KIND STATUS UPDATED`. It lists the 8 most recent items across posts, papers and systems, with status shown by `StatusStroke` and dates as `YYYY-MM-DD`.
- [ ] **Step 5:** Rewrite `page.tsx` as the FIRST VIEWPORT from the contract:
  - left 5/12: a status line in mono (`leader: victor-bona · status: Ready`, plus `· uptime: {n} yrs` only when `yearsExperience` is set), the `h1` one-liner at `clamp(2.4rem, 5vw, 4.5rem)`, and `<ContactCommand variant="hero" />` with a secondary `$ cd /about` link;
  - right 7/12: `<ControlPlane />`;
  - below: `StatusTable`, a featured paper row (newest DOI preprint), and a closing contact band.
- [ ] **Step 6:** Add `assertIncludes("app/components/ControlPlane.tsx", "<ol")` and `assertIncludes("app/components/ControlPlane.tsx", "prefers-reduced-motion")` to `seo-smoke.mjs`. Run the validation command. Expected: PASS. Check at 390px and 1440px.
- [ ] **Step 7:** Commit with `feat(home): control plane ring display, status hero, recent work table`.

### Task 6: `/about` profile page

**Files:**
- Create: `app/about/page.tsx`
- Modify: `app/sitemap.ts` (add `/about`), `app/lib/seo.ts` (add `getProfilePageJsonLd()` returning `ProfilePage` with `mainEntity` = the Person `@id`)

**Interfaces:**
- Consumes: `profile` and `isPending` (Task 2), `getSiteCounts()`, and `ContactCommand`.

- [ ] **Step 1:** Build the page, Persuade mode, in this order:
  - header: headshot (`next/image`, duotone via CSS `filter: grayscale(1)` plus a green `mix-blend` overlay), or a `[pending] headshot` frame when null; then name and one-liner;
  - scale facts as a mono grid (`profile.scale`, else `[pending]`), plus the real site counts, which are always present;
  - career timeline as a vertical list of spans: `role @ org`, `start–end|present`, summary;
  - talks/OSS/links;
  - a closing `ContactCommand`.
  - Metadata: title "Profile", a description built from the one-liner, a canonical URL, and ProfilePage JSON-LD.
- [ ] **Step 2:** Add `"/about"` to the seo-smoke sitemap route list and `"ProfilePage"` to its schema list. Run the validation command. Expected: PASS.
- [ ] **Step 3:** Commit with `feat(about): profile page with timeline, scale and pending markers`.

### Task 7: Writing: blog index, tag pages, post reading view

**Files:**
- Modify: `app/blog/page.tsx`, `app/blog/tag/[tag]/page.tsx`, `app/blog/[slug]/page.tsx`, `app/components/posts.tsx`, `WritingRow.tsx`, `ReadingProgress.tsx`, `ShareButton.tsx`, `RelatedPosts.tsx`, `Tag.tsx`, `mdx.tsx`, `ArticleWrapper.tsx`

- [ ] **Step 1:** Index and tag pages:
  - header `P500 Writing` with the count;
  - rows show date (mono, dim), title and tags on one line, with a hairline rule between rows;
  - posts are grouped by year with the year in mono.
- [ ] **Step 2:** Post view:
  - a single 68ch column, with title, summary and a meta line (`published · N min · tags`);
  - on screens ≥1280px, a sticky table of contents in the right gutter, built from the existing `TableOfContents.tsx` with `h2`/`h3` ids generated in `mdx.tsx` (reuse the compendium slug approach);
  - `ReadingProgress` is a 2px `--lit` bar;
  - `ShareButton` is restyled to tokens, with no hard-coded white or neutral colours;
  - the post ends with a contact band and `RelatedPosts`.
  - Remove the duplicate `itemScope` microdata and keep the JSON-LD.
- [ ] **Step 3:** Run the validation command. Expected: PASS. Open one long post with code, math and an image at 390px and 1440px.
- [ ] **Step 4:** Commit with `feat(writing): reading view, toc, archive rows`.

### Task 8: Papers and Systems

**Files:**
- Modify: `app/articles/page.tsx`, `app/articles/[slug]/page.tsx`, `app/components/PaperRow.tsx`, `app/projects/page.tsx`, `app/components/SystemRow.tsx`, `app/lib/seo.ts`
- Delete: `app/components/ArticleCard.tsx`, `ProjectCard.tsx` (thin aliases; update any importers)

**Interfaces:**
- Consumes: `StatusStroke`.
- Produces: `getProjectJsonLd(project: Project)`, which returns `SoftwareSourceCode` when `repository` is set and `CreativeWork` otherwise. `projects/page.tsx` emits one per project inside its existing ItemList.

- [ ] **Step 1:** Papers:
  - rows render as references, `[n] Title — status · year · DOI 10.xxxx/...`, with DOI and PDF as mono links;
  - preprints with a DOI are lit; whitepapers are normal;
  - the detail page shows the abstract in the reading column and a mono metadata gutter (authors, status, DOI, published, citation key);
  - a "cite" block shows the BibTeX built from the existing fields.
- [ ] **Step 2:** Systems:
  - `SystemRow` shows its status by stroke;
  - map the project status values to `live`, `maintained` or `archived` in a `toStroke(status)` function next to `StatusStroke`. Write it as a pure function with one test in `app/lib/status.test.ts` covering every existing `Project.status` value;
  - the tech stack shows as mono tags, and images and GIFs sit inside a hairline frame.
- [ ] **Step 3:** Add `"SoftwareSourceCode"` to the seo-smoke schema list. Run the validation command. Expected: PASS.
- [ ] **Step 4:** Commit with `feat(papers,systems): reference rows, cite block, status strokes, project schema`.

### Task 9: Compendium and dark Mermaid

**Files:**
- Modify: `app/compendium/page.tsx`, `app/compendium/[collection]/page.tsx`, `app/compendium/components/CompendiumIndex.tsx`, `CompendiumShell.tsx`, `CompendiumMdx.tsx`, `MermaidDiagram.tsx`; the compendium rules in `app/global.css`

- [ ] **Step 1:** Collections become annexes, `Annex A — Software engineering · 16 notes`, with lettering in `collections.ts` order. Notes keep the sidebar, ToC and prev/next with the new tokens.
- [ ] **Step 2:** In `MermaidDiagram.tsx`, set `theme: "base"` with `themeVariables` from the tokens: background `#08110c`, primary text `#d8e8de`, lines `#1f5c3a`, primary border `#4dff8f`. Remove the light overrides from the `.compendium-mermaid` CSS.
- [ ] **Step 3:** Run the validation command (`test:compendium` included). Expected: PASS. Open a note that has a Mermaid diagram.
- [ ] **Step 4:** Commit with `feat(compendium): annex index, dark mermaid`.

### Task 10: SEO batch: OG everywhere, dates, RSS, canonicals and the 404 kernel panic

**Files:**
- Modify: `app/og/route.tsx`, every route's `generateMetadata`/`metadata`, `app/sitemap.ts`, `app/rss/route.ts`, `app/blog/tag/[tag]/page.tsx`, `app/blog/utils.ts`, `app/not-found.tsx`, `scripts/seo-smoke.mjs`

- [ ] **Step 1:** Restyle `/og` to the new world: `--bg` ground, mono address kicker, title in the sans, the one-liner footer and a `--lit` rule. It accepts `?title=&kicker=` (for example `kicker=P300 Paper`). Use it for papers, systems, compendium, tag pages and `/about` through a `ogImage(title, kicker)` helper in `app/lib/seo.ts`. Pages with no specific image keep the defaults.
- [ ] **Step 2:** `dateModified`: optional `updatedAt` frontmatter in `blog/utils.ts`, falling back to `publishedAt`. The sitemap uses the newest content date for index pages instead of today.
- [ ] **Step 3:** RSS: add `xmlns:atom` and `<atom:link href=".../rss" rel="self" type="application/rss+xml"/>`, and add papers as items.
- [ ] **Step 4:** Tag canonical uses `encodeURIComponent(tag)`, the same as the sitemap. Add a seo-smoke assertion that `app/blog/tag/[tag]/page.tsx` includes `encodeURIComponent`.
- [ ] **Step 5:** `not-found.tsx`:
  - keep the metrics counter;
  - render a mono kernel-panic block: `panic: route not found: <path>`, a fake-free stack of three lines listing `cd /`, `cd /blog` and `:` (terminal hint), then `ContactCommand inline`;
  - add `metadata = { title: "404", robots: { index: false } }`.
- [ ] **Step 6:** Run the validation command. Expected: PASS. `curl -s localhost:3000/og?title=Test&kicker=P300` returns `image/png`.
- [ ] **Step 7:** Commit with `feat(seo): og per page, dateModified, rss atom self, encoded tag canonicals, kernel panic 404`.

### Task 11: Cleanup, detector and finish

**Files:**
- Delete: `.impeccable.md` (superseded per PRODUCT.md), plus the unused `LanguageSelector.tsx`, `Toast.tsx`, `Spinner.tsx`, `ArrowIcon.tsx`, `FeaturedArgument.tsx` and `SectionHeader.tsx`. Grep each before deleting.
- Create: `.impeccable/review/desktop.png`, `.impeccable/review/mobile.png`

- [ ] **Step 1:** Run `rg -l "LanguageSelector|Toast|Spinner|ArrowIcon|FeaturedArgument|SectionHeader" app` and delete each file that has no importers.
- [ ] **Step 2:** Run the validation command and `docker build -t victorbona-blog .`. Expected: PASS.
- [ ] **Step 3:** Run `/Users/victorbona/.claude/skills/impeccable/scripts/impeccable detect --json app`. Fix the mechanical findings.
- [ ] **Step 4:** Capture `/` at 1440 and 390 pixels wide into `.impeccable/review/`. Spawn `impeccable-finish-reviewer` with the contract, PRODUCT.md and the screenshots. Apply one fix batch, then get one verdict.
- [ ] **Step 5:** Spawn `impeccable-documenter` to write `DESIGN.md` and `.impeccable/design.json`.
- [ ] **Step 6:** Commit with `chore: remove dead components, document control plane design system`.

## Handoff notes

- Victor must supply the headshot file (put it at `public/profile/headshot.webp`), the timeline, scale facts, talks, years of experience and GitHub URL. Until then, `[pending]` renders.
- The LinkedIn URL is open: the footer uses `/in/vicotrbb/` and the schema uses `/in/victorbona/`. Victor confirms which, before Task 2.
