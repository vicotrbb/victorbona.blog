# Phase 9: Device Analytics - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

User-Agent parsing into browser and device categories using bowser library. Extend existing Phase 7 middleware to add browser and device labels to page view metrics. Does NOT include detailed device fingerprinting or client-side detection.

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion (Full)

User deferred all implementation decisions to Claude — follow best practices and maintain consistency with Phase 7 and 8 patterns.

**Browser categorization:**
- Determine appropriate browser groupings (major browsers vs "Other")
- Handle browser variants (Chrome vs Chromium-based, etc.)
- Decide on version tracking (include or exclude)

**Device classification:**
- Define device categories (Mobile, Desktop, Tablet, etc.)
- Handle edge cases (smart TVs, consoles, etc.)
- Consistent with Phase 7's bot handling approach (label, don't exclude)

**Unknown/edge cases:**
- Handle unknown User-Agents gracefully (fallback to "Other"/"Unknown")
- Handle empty or missing UA strings
- Handle bot traffic (already labeled is_bot=true from Phase 7)

**Label cardinality:**
- Follow Phase 7/8 approach: allow unbounded cardinality for low-traffic blog
- Keep labels consistent with existing metric structure
- Extend blog_page_views_total with browser/device labels

**Guidelines from previous phases to follow:**
- Bot traffic already labeled with `is_bot=true` (Phase 7) — maintain that pattern
- Lowercase normalization for consistency (Phase 8's UTM approach)
- No cardinality limits — blog traffic is low (Phases 7 & 8 decisions)
- Extend existing metrics rather than creating new counters

</decisions>

<specifics>
## Specific Ideas

No specific requirements — follow standard approaches and maintain consistency with Phase 7/8 implementation patterns.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 09-device-analytics*
*Context gathered: 2026-01-28*
