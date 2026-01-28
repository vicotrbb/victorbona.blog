# Phase 8: Traffic Source Attribution - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Categorize traffic sources from referrer headers and UTM parameters. Extend existing Phase 7 middleware to add source attribution labels to page view metrics. Does NOT include campaign analytics dashboards or conversion tracking.

</domain>

<decisions>
## Implementation Decisions

### Source categories
- Individual search engines tracked separately: source="google", source="bing", source="duckduckgo", etc.
- Individual social platforms tracked separately: source="twitter", source="linkedin", source="facebook", etc.
- Two additional categories: "direct" (no referrer) and "referral" (any other site)
- Referrals show the actual domain in the source label (e.g., source="news.ycombinator.com")

### UTM parameters
- Track utm_source and utm_medium only (not full UTM set)
- Track both referrer category AND UTM labels as independent dimensions
- Missing UTM params represented as empty string (utm_source="")
- Normalize UTM values to lowercase (utm_source="Newsletter" -> "newsletter")

### Label design
- Single 'source' label for all source types
- Referral domains go directly in source label (source="news.ycombinator.com")
- No cardinality limit — blog traffic is expected to be low
- Extend existing blog_page_views_total metric with source labels

### Edge cases
- Missing/stripped referrers treated as "direct"
- Self-referrals (own domain) treated as "direct"
- Validate UTM values — reject malformed/garbage (too long, special chars)

### Claude's Discretion
- Bot traffic source tracking (consider Phase 7's bot handling approach)
- Specific list of search engines and social platforms to recognize
- Exact validation rules for UTM values (length limits, allowed chars)
- How to extract domain from referrer URL

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for referrer parsing and UTM extraction.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 08-traffic-source-attribution*
*Context gathered: 2026-01-28*
