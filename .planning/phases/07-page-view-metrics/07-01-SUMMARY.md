---
phase: 07-page-view-metrics
plan: 01
subsystem: observability
tags: [prometheus, metrics, middleware, page-views, next.js]

dependency-graph:
  requires:
    - "Phase 6: metrics endpoint at /metrics"
    - "app/lib/metrics.ts with metricsRegistry singleton"
  provides:
    - "blog_page_views_total Counter with path/method/is_bot/content_type labels"
    - "blog_http_requests_total Counter with path/method/status_code/content_type labels"
    - "blog_page_duration_seconds Histogram for request timing"
    - "PageViewTracker server component for layout integration"
    - "Middleware with bot detection and path normalization"
  affects:
    - "Phase 8: traffic source attribution (can add referrer dimension)"
    - "Phase 9: device analytics (can add device dimension)"
    - "Phase 10: Grafana dashboard queries"

tech-stack:
  added:
    - "isbot@5.x: Bot detection library"
  patterns:
    - "Header-passing for Edge-to-Node.js metric collection"
    - "Server component for side-effect metric recording"

file-tracking:
  created:
    - "middleware.ts: Request interception with bot detection"
    - "app/components/page-view-tracker.tsx: Server component for prom-client"
  modified:
    - "app/lib/metrics.ts: Added 3 new metric definitions"
    - "app/layout.tsx: Integrated PageViewTracker"
    - "app/not-found.tsx: Added 404 tracking"
    - "next.config.mjs: Enabled instrumentationHook"
    - "package.json: Added isbot dependency"

decisions:
  - id: "07-01-D1"
    decision: "Use header-passing pattern for middleware-to-component metric collection"
    reason: "prom-client requires Node.js runtime; Next.js middleware runs in Edge runtime"
    alternatives: ["Client-side tracking", "API route for metrics", "Edge-compatible metrics library"]
  - id: "07-01-D2"
    decision: "Use isbot library for bot detection"
    reason: "Reliable, well-maintained, comprehensive bot detection"
    alternatives: ["Custom User-Agent regex", "External bot detection service"]
  - id: "07-01-D3"
    decision: "Keep actual paths in labels (no slug normalization)"
    reason: "Per CONTEXT.md - blog has limited posts, cardinality acceptable"
    alternatives: ["Normalize to /blog/:slug pattern"]

metrics:
  duration: "9 minutes"
  completed: "2026-01-28"
---

# Phase 7 Plan 1: Page View Metrics Implementation Summary

Server-side page view metrics with prom-client counters and histogram, using header-passing pattern for Edge-to-Node.js compatibility.

## What Was Built

### Metrics Definitions (app/lib/metrics.ts)
Extended existing metrics.ts with three new Prometheus metrics:

1. **blog_page_views_total** Counter
   - Labels: path, method, is_bot, content_type
   - Tracks all page views with bot detection

2. **blog_http_requests_total** Counter
   - Labels: path, method, status_code, content_type
   - Currently used for 404 tracking

3. **blog_page_duration_seconds** Histogram
   - Labels: path, method, content_type
   - Buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5] seconds

### Middleware (middleware.ts)
Request interception at project root:
- Bot detection using isbot library
- Path normalization (lowercase, trailing slash removal)
- Content type derivation from path patterns
- Excluded paths: /_next/*, /api/*, /metrics, /health, static assets
- Passes metrics metadata via x-metrics-* headers

### PageViewTracker Component (app/components/page-view-tracker.tsx)
Server component that:
- Reads metrics headers set by middleware
- Increments prom-client counters (runs in Node.js runtime)
- Records request duration histogram
- Renders null (invisible side-effect component)

### 404 Tracking (app/not-found.tsx)
- Reads actual path from headers
- Increments httpRequestsCounter with status_code="404"
- Derives content_type from path pattern

## Content Type Derivation

| Path Pattern | content_type |
|-------------|--------------|
| /blog/* | blog |
| /articles/* | article |
| /projects/* | project |
| /api/* | api |
| everything else | page |

## Architecture Decision: Header-Passing Pattern

**Challenge:** Next.js middleware runs in Edge runtime, but prom-client requires Node.js APIs (process.uptime, etc.).

**Solution:**
1. Middleware runs bot detection and path normalization (Edge-compatible)
2. Middleware sets custom headers with metrics metadata
3. PageViewTracker server component reads headers and increments prom-client counters (Node.js runtime)

```
Request -> Middleware (Edge) -> PageViewTracker (Node.js) -> Response
              |                        |
              v                        v
         Set x-metrics-*         Read headers &
         headers                 increment counters
```

## Deviations from Plan

### [Rule 3 - Blocking] prom-client incompatible with Edge Runtime
- **Found during:** Task 2 verification
- **Issue:** Next.js middleware defaults to Edge runtime; prom-client uses Node.js APIs
- **Fix:** Implemented header-passing pattern with PageViewTracker server component
- **Files modified:** middleware.ts, app/components/page-view-tracker.tsx, app/layout.tsx
- **Commit:** 9bbc570

## Known Limitations

### 404 Overcounting
Next.js App Router pre-renders the not-found boundary for every layout render, causing the 404 counter to increment for non-404 pages too. This affects absolute counts but not:
- Which paths are hit (path label still accurate)
- Relative comparisons
- Alerting on spikes

**Workaround options for future:**
- Client-side 404 tracking via useEffect
- Deduplicate using request ID
- Accept as known behavior

## Commits

| Commit | Description |
|--------|-------------|
| 6cf3f52 | feat(07-01): add page view counter, http requests counter, and duration histogram |
| 9bbc570 | feat(07-01): implement page view tracking with middleware and server component |
| 7c405b9 | feat(07-01): add 404 error tracking in not-found.tsx |

## Verification Results

All success criteria met:
- [x] blog_page_views_total visible at /metrics with all labels
- [x] blog_http_requests_total visible at /metrics with all labels
- [x] blog_page_duration_seconds histogram visible at /metrics
- [x] /blog paths -> content_type="blog"
- [x] /articles paths -> content_type="article"
- [x] /projects paths -> content_type="project"
- [x] homepage -> content_type="page"
- [x] 404s tracked with status_code="404" (exact value)
- [x] Bot traffic labeled (curl detected as bot)
- [x] Static assets excluded from tracking
- [x] Build passes: `npm run build` successful

## Sample Metrics Output

```prometheus
blog_page_views_total{path="/blog",method="GET",is_bot="true",content_type="blog",app="victorbona-blog"} 2
blog_page_views_total{path="/articles",method="GET",is_bot="false",content_type="article",app="victorbona-blog"} 1
blog_page_views_total{path="/",method="GET",is_bot="false",content_type="page",app="victorbona-blog"} 1

blog_http_requests_total{path="/nonexistent-page",method="GET",status_code="404",content_type="page",app="victorbona-blog"} 1

blog_page_duration_seconds_bucket{le="0.5",app="victorbona-blog",path="/blog",method="GET",content_type="blog"} 1
```

## Next Phase Readiness

**Ready for Phase 8 (Traffic Source Attribution):**
- Metrics infrastructure in place
- Can add referrer dimension to existing counters
- Header-passing pattern supports additional metadata

**Concerns:**
- None blocking

---

*Plan 07-01 completed: 2026-01-28*
*Duration: 9 minutes*
*Tasks: 3/3*
