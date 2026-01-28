# Phase 7: Page View Metrics - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Server-side middleware that counts page views with path normalization and request metadata, exposed via Prometheus metrics. Traffic source attribution (Phase 8) and device analytics (Phase 9) are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Path normalization rules
- Keep actual slugs in path labels: `/blog/my-actual-post` not `/blog/:slug`
- Same for articles: `/articles/my-article` keeps the real slug
- Strip all query parameters from path labels
- Normalize trailing slashes and case (lowercase, no trailing slash)

### Metric cardinality
- Allow unbounded cardinality — blog has limited posts, won't explode
- Labels: path + method + status_code
- Two separate counters:
  - `blog_page_views_total` for content pages
  - `blog_http_requests_total` for all requests
- Add response time histogram: `blog_page_duration_seconds`

### Request filtering
- Exclude static assets (.js, .css, images, fonts) from page views
- Label bot traffic with `is_bot=true` rather than excluding — allows filtering in queries
- Exclude `/health` and `/metrics` endpoints from page views
- Exclude `/_next/*` internal routes from page views

### Status code handling
- Use exact status codes (200, 404, 500) not buckets
- Keep actual path for 404s to see what URLs are being hit
- No separate error counter — filter by status_code in queries
- Exclude redirect status codes (301, 302) from page views

### Claude's Discretion
- Bot detection implementation (User-Agent patterns vs library)
- Histogram bucket boundaries for duration
- Middleware placement in Next.js request lifecycle

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches for Next.js middleware with prom-client.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-page-view-metrics*
*Context gathered: 2026-01-28*
