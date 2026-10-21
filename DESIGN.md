---
name: Victor Bona
description: A live control plane on phosphor glass; the body of work runs as tracks around the leader node.
colors:
  bg: "#020604"
  panel: "#08110c"
  line: "#15241b"
  line-strong: "#1f5c3a"
  rule: "#2a7a4c"
  text: "#d8e8de"
  dim: "#6f8f7c"
  lit: "#4dff8f"
  warn: "#e8c45c"
  syntax-mint: "#8fe8b4"
  syntax-teal: "#6fd8c8"
  syntax-sage: "#b4dcc4"
typography:
  display:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2.4rem, 4.4vw, 3.75rem)"
    fontWeight: 600
    lineHeight: 1.04
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-0.03em"
  title:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.375
    letterSpacing: "-0.01em"
  body:
    fontFamily: "Schibsted Grotesk, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(1.0625rem, 1rem + 0.25vw, 1.125rem)"
    fontWeight: 400
    lineHeight: 1.7
  command:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "1rem"
    fontWeight: 600
    lineHeight: 1.5
  label:
    fontFamily: "Martian Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.5
    fontFeature: "\"tnum\" 1"
rounded:
  none: "0px"
spacing:
  shell-x-sm: "16px"
  shell-x-md: "24px"
  shell-x-lg: "32px"
  row-y: "12px"
  section: "96px"
  max-shell: "80rem"
  measure: "68ch"
components:
  contact-hero:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.lit}"
    typography: "{typography.command}"
    rounded: "{rounded.none}"
    padding: "12px 20px"
  contact-hero-hover:
    backgroundColor: "{colors.lit}"
    textColor: "{colors.bg}"
  contact-inline:
    textColor: "{colors.lit}"
    typography: "{typography.command}"
  nav-address:
    textColor: "{colors.dim}"
    padding: "12px 12px"
  nav-address-current:
    textColor: "{colors.text}"
  terminal-key:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.dim}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "4px 8px"
    height: "32px"
  mono-tag:
    textColor: "{colors.dim}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
    padding: "2px 6px"
  panel:
    backgroundColor: "{colors.panel}"
    rounded: "{rounded.none}"
    padding: "16px"
  terminal:
    backgroundColor: "{colors.panel}"
    textColor: "{colors.text}"
    typography: "{typography.label}"
    rounded: "{rounded.none}"
---

# Design System: Victor Bona

## Overview

**Creative North Star: "The Control Plane, Phosphor Edition"**

The site is an operator's console for one engineer. Victor is the leader node at the centre; systems, papers, writing and compendium run as tracks around him, each with a real count. The ground is green-black glass, panels are square and ruled with hairlines, and the only light on screen comes from things that are live. Nothing decorates except data: graduations, counts, statuses, dates and page addresses are the ornament.

Two speeds share one world. Decision surfaces (home, profile) read in seconds through a display one-liner, the ring instrument, and a lit `contact` command. Reading surfaces (posts, papers, compendium notes) drop to a calm sans column at a 68ch measure, with mono kept to metadata. Dark is the only theme.

**Key Characteristics:**
- Green-tinted near-black ground; phosphor green reserved for lit, live things.
- Square corners and 1px hairline rules everywhere; depth comes from tone, not shadow.
- Status is drawn by stroke: solid for live, dashed for maintained, dotted (gapped) for archived.
- Mono for machine data and commands, a clean grotesk for prose and headings.
- Teletext page addresses (P100 to P600) and a terminal (Cmd/Ctrl K) as navigation.
- Glow belongs only to the home hero and the terminal prompt.

## Colors

A single phosphor accent over a family of green-tinted neutrals, with one amber for warnings.

### Primary
- **Phosphor** (lit): the lit state. Current nav address code, the `$` prompt on command headings, the `contact` command, live status text and strokes, the active ring track, the selection highlight, focus outlines, the caret.

### Secondary
- **Signal Amber** (warn): warning or degraded only. The 404 `panic:` and the `[pending]` placeholder markers on the profile page.

### Neutral
- **Phosphor Glass** (bg): page ground and the inside of every node.
- **Dark Panel** (panel): raised surfaces by tone: contact panel, compendium sidebar, code blocks, Mermaid figures, the terminal dialog, the boot strip.
- **Hairline** (line): default 1px rule between rows, around panels, tags and code.
- **Afterglow** (line-strong): emphasised borders (contact panel, terminal), maintained and archived strokes, minor ring graduations, the scrollbar thumb, blockquote rule.
- **Instrument Stroke** (rule): ring orbits, major ticks and nodes; chosen for 3.9:1 against the ground where Afterglow is only 2.6:1.
- **Glass Text** (text): primary text, headings, link text.
- **Dim Readout** (dim): secondary text, metadata, table headers, inactive nav, list markers.
- **Syntax Mint / Teal / Sage**: sugar-high code highlighting only (classes; JSX literals and entities; properties). Keywords use Phosphor, strings use Signal Amber, comments and signs use Dim Readout.

### Named Rules
**The Lit Means Live Rule.** Phosphor marks only something live, current, actionable or focused. If it is not on, it is Glass Text or Dim Readout.

**The Amber Is A Fault Rule.** Signal Amber appears only for warnings, faults and unfilled placeholders, never for decoration or emphasis.

## Typography

**Display Font:** Schibsted Grotesk (with ui-sans-serif, system-ui)
**Body Font:** Schibsted Grotesk
**Label/Mono Font:** Martian Mono, variable (with ui-monospace)

**Character:** A crisp, slightly technical grotesk carries every human sentence; Martian Mono carries every machine fact. Because Martian Mono is variable, "lit" is heavier: active labels and prompts step up to weight 700 to 760.

### Hierarchy
- **Display** (600, clamp(2.4rem, 4.4vw, 3.75rem), 1.04, -0.035em, max 14ch, balanced): the home one-liner only.
- **Headline** (600, clamp(2rem, 4vw, 3rem), 1 to 1.08, -0.03em): archive and article page titles. Archive titles carry their page address (P400) inline in mono 0.875rem Dim Readout at the baseline.
- **Title** (600, 1.125rem to 1.5rem, snug, -0.01em to -0.02em): row names, featured paper title, contact panel heading (1.5rem to 1.875rem).
- **Body** (400, clamp(1.0625rem, 1rem + 0.25vw, 1.125rem), 1.7, 68ch): the prose column. Prose h2 clamp(1.4rem, 1.2rem + 0.8vw, 1.75rem), h3 1.2em; all prose headings 600, 1.25, -0.015em.
- **Command** (mono 600, 1rem, 1.5): section headings written as shell commands (`$ get work --sort-by=updated`), the prompt glyph lit at 760.
- **Label** (mono 400, 0.75rem to 0.875rem, tabular numerals): dates, counts, status words, table headers, tags, nav codes.

### Named Rules
**The Machine Speaks Mono Rule.** Dates, counts, statuses, addresses, identifiers, DOIs and commands are mono with tabular numerals. Sentences, titles and headings are sans. Never mix within one element.

**The Lit Is Heavier Rule.** Activation is shown by weight as well as color: the current nav code goes bold, the active ring label goes to 760.

## Layout

A single shell, max 80rem, with horizontal padding of 16px, 24px from sm, 32px from lg. Sections on home stack with 96px between them. Reading text holds a 68ch measure; compendium notes let tables, code and diagrams take the full column while text keeps the measure.

The home hero is a two-column split at md (6/6 of a 12-column grid): one-liner and contact on the left, the ring instrument on the right. Below md the instrument collapses to a compact, decorative drawing (max 22rem) and the links move to lists. Archives are full-width ruled lists: each row sits between 1px top rules with 12px (tables) to 24px (system rows) vertical padding. Compendium uses a sidebar grid at 64rem (13 to 17rem sidebar, sticky at 1.5rem). The nav address row scrolls horizontally on narrow screens and keeps the current page in view.

## Elevation & Depth

Flat. Depth is tonal: Dark Panel on Phosphor Glass, bounded by a hairline. Rows are separated by rules, never by cards.

### Shadow Vocabulary
- **Terminal lift** (`box-shadow: 0 24px 64px -12px rgb(0 0 0 / 0.8)`): the terminal dialog only, over a 72% ground backdrop.
- **Phosphor bloom** (`drop-shadow(0 0 3px rgb(77 255 143 / 0.9)) drop-shadow(0 0 10px rgb(77 255 143 / 0.45))`): the ring core, active orbit, hovered node and heartbeat pulse.
- **Prompt glow** (`text-shadow: 0 0 10px rgb(77 255 143 / 0.6)`, hero contact 0 0 14px at 0.55): terminal `$` prompts and the hero contact command.

### Named Rules
**The Glow Is Rationed Rule.** Bloom and glow exist only in the home hero instrument, the hero contact command and the terminal prompt. Never behind body text, never on reading surfaces.

## Shapes

Square everything: 0px radius on panels, buttons, tags, code, dialogs and the terminal key. Borders are 1px. Status strokes are short horizontal rules (24px wide) drawn solid, dashed or dotted. Circles exist only inside the ring instrument, as orbits, nodes and the core.

## Components

### Contact Command
The primary action, written as a command: `$ contact`.
- **Hero:** mono 600 at 1.125rem, Phosphor text with prompt glow, 1px Phosphor border, 12px 20px padding, square. Hover inverts: Phosphor fill, black text, glow removed.
- **Inline:** mono 600 Phosphor text followed by the address in Dim Readout 400; hover underlines (1px, 4px offset). Used in the contact panel, the footer and the 404.

### Command Headings
Section headings are shell commands in Command type, the `$` lit and hidden from assistive tech. Secondary navigation follows the same idiom (`$ cd /about`) in Dim Readout mono 0.875rem, brightening to Glass Text on hover.

### Status Table and Rows
Mono table, capitalised column headers (NAME, KIND, STATUS, UPDATED) in Dim Readout 400, rows split by 1px Hairline top rules with 12px vertical padding. Names are sans Glass Text with a 1px Phosphor underline on hover. Status is a 24px Status Stroke followed by the word: live in Phosphor, maintained in Glass Text, archived in Dim Readout. Dates right-aligned, tabular.

### Mono Tags
1px Hairline border, 2px 6px padding, mono 0.75rem Dim Readout, square. Topic tags in post metadata are plain Dim Readout links that underline on hover.

### Navigation
Wordmark `victor-bona` in mono 600 left; page addresses as `P100 Home` pairs (mono code 0.75rem plus sans label 0.875rem). Default Dim Readout; hover Glass Text; current gets a 1px Phosphor bottom border, Glass Text label and a bold Phosphor code. The terminal key is a 32px minimum square-cornered box with a Hairline border, showing Cmd K or Ctrl K.

### Panels
Dark Panel fill with a 1px Hairline (or Afterglow for emphasis, as on the home contact panel), square, 16px padding (40px for the contact panel at sm). Used for code, Mermaid figures, the compendium sidebar and media frames.

### Control Plane (signature)
An SVG event display: concentric orbits in Instrument Stroke with 72 minor and 12 major graduations, a lit core for Victor, nodes for each object dashed by status. Hover or focus dims other tracks to 28%, lights the active orbit with bloom and steps its label to 760; a heartbeat pulse (3.2s, ease-out-expo) runs along links only when motion is allowed. A segmented readout strip below reports leader, status, tracks and objects.

### Terminal
A native dialog in Dark Panel with an Afterglow border and the terminal lift shadow, opened with Cmd/Ctrl K. It unrolls with a 180ms clip-path reveal (cubic-bezier(0.16, 1, 0.3, 1)) when motion is allowed. The glowing `$` and lit caret mark the focused line in place of an outline.

### Boot Line
A one-time, first-visit strip overlaying the top of the page in Dark Panel, typing `boot: ... ready` in mono 0.75rem within 1.1s, then fading over 400ms. Skipped entirely under reduced motion after one static frame.

## Do's and Don'ts

### Do:
- **Do** reserve Phosphor for live, current, actionable or focused things.
- **Do** draw status with the stroke grammar: solid live, dashed maintained, dotted archived.
- **Do** write section headings and secondary actions as shell commands with a lit `$`.
- **Do** keep corners at 0px and borders at 1px.
- **Do** put dates, counts and identifiers in Martian Mono with tabular numerals.
- **Do** use Instrument Stroke (not Afterglow) for any stroke that must be read as data.
- **Do** gate every animation behind prefers-reduced-motion: no-preference.

### Don't:
- **Don't** add glow or bloom outside the home hero and the terminal prompt.
- **Don't** use Signal Amber for anything but warnings, faults and pending placeholders.
- **Don't** add a light theme.
- **Don't** separate content with cards or drop shadows; use rules and tonal panels.
- **Don't** set prose, titles or headings in mono.
