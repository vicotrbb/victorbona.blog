---
phase: 08-traffic-source-attribution
plan: 01
subsystem: observability
tags: [prometheus, metrics, referrer, utm, analytics, traffic-source]

dependency-graph:
  requires:
    - phase: 07-page-view-metrics
      provides: pageViewsCounter with path/method/is_bot/content_type labels, header-passing pattern
  provides:
    - "Extended blog_page_views_total with source label (google, twitter, direct, etc.)"
    - "Extended blog_page_views_total with utm_source and utm_medium labels"
    - "detectSource function for referrer domain mapping"
    - "extractUtmParams function with validation"
  affects:
    - "Phase 10: Grafana dashboard (can query by traffic source)"

tech-stack:
  added: []
  patterns:
    - "Domain-to-source mapping for referrer categorization"
    - "UTM parameter validation for cardinality control"

key-files:
  created:
    - "app/lib/source-detection.ts: detectSource function"
    - "app/lib/utm-parser.ts: extractUtmParams function"
  modified:
    - "app/lib/metrics.ts: Extended pageViewsLabelNames"
    - "middleware.ts: Source and UTM extraction"
    - "app/components/page-view-tracker.tsx: New header reading and label passing"

key-decisions:
  - "08-01-D1: Map known domains to source identifiers (google, twitter, etc.) rather than categories"
  - "08-01-D2: Unknown referrers return domain as-is for maximum visibility"
  - "08-01-D3: UTM validation with 50-char limit and alphanumeric pattern to prevent cardinality explosion"

patterns-established:
  - "Source detection via domain lookup tables (search engines, social platforms)"
  - "Self-referral detection to avoid counting internal navigation as external"

duration: 8min
completed: 2026-01-28
---

# Phase 8 Plan 1: Traffic Source Attribution Summary

**Extended page view metrics with traffic source detection from referrer headers and UTM campaign parameters**

## Performance

- **Duration:** 8 minutes
- **Started:** 2026-01-28T17:26:00Z
- **Completed:** 2026-01-28T17:34:00Z
- **Tasks:** 3/3
- **Files modified:** 5

## Accomplishments

- Traffic source detection from Referer header (Google, Bing, Twitter, Facebook, LinkedIn, Reddit, Hacker News, etc.)
- UTM parameter extraction with validation (utm_source, utm_medium)
- Extended blog_page_views_total metric with source, utm_source, utm_medium labels
- Self-referral detection (own domain treated as direct traffic)
- Unknown referrer domains appear as-is for maximum visibility

## Task Commits

Each task was committed atomically:

1. **Task 1: Create source detection and UTM parsing utilities** - `d0294e9` (feat)
2. **Task 2: Extend metrics.ts with source and UTM labels** - `db87d97` (feat)
3. **Task 3: Wire middleware and PageViewTracker with source/UTM data** - `c1b517e` (feat)

## Files Created/Modified

- `app/lib/source-detection.ts` - detectSource function with domain-to-source mapping (search engines, social platforms)
- `app/lib/utm-parser.ts` - extractUtmParams function with validation (length, allowed characters)
- `app/lib/metrics.ts` - Extended pageViewsLabelNames with source, utm_source, utm_medium
- `middleware.ts` - Extracts referer and UTM params, sets x-metrics-source/utm headers
- `app/components/page-view-tracker.tsx` - Reads new headers, passes all 7 labels to counter

## Decisions Made

1. **08-01-D1:** Map known domains to source identifiers (e.g., google, twitter) rather than categories (e.g., search, social) - per CONTEXT.md guidance for individual platform tracking
2. **08-01-D2:** Unknown referrers return the domain hostname as-is - provides maximum visibility into traffic sources
3. **08-01-D3:** UTM validation with 50-character limit and alphanumeric pattern - prevents cardinality explosion from malicious values

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all verification tests passed on first attempt.

## User Setup Required

None - no external service configuration required.

## Verification Results

All success criteria met:
- [x] blog_page_views_total has source label visible at /metrics
- [x] blog_page_views_total has utm_source and utm_medium labels visible at /metrics
- [x] Google referrer shows source="google"
- [x] Bing referrer shows source="bing"
- [x] Twitter/t.co referrer shows source="twitter"
- [x] Facebook referrer shows source="facebook"
- [x] LinkedIn referrer shows source="linkedin"
- [x] Reddit referrer shows source="reddit"
- [x] Hacker News referrer shows source="hackernews"
- [x] Direct visits (no referrer) show source="direct"
- [x] Self-referral (from own domain) shows source="direct"
- [x] Unknown referrer domains appear as-is in source label
- [x] UTM source parameter captured in utm_source label
- [x] UTM medium parameter captured in utm_medium label
- [x] Invalid/malicious UTM values rejected (empty string instead)
- [x] Build passes: npm run build

## Sample Metrics Output

```prometheus
blog_page_views_total{path="/",method="GET",is_bot="true",content_type="page",source="direct",utm_source="",utm_medium="",app="victorbona-blog"} 2
blog_page_views_total{path="/blog",method="GET",is_bot="true",content_type="blog",source="google",utm_source="",utm_medium="",app="victorbona-blog"} 1
blog_page_views_total{path="/",method="GET",is_bot="true",content_type="page",source="direct",utm_source="newsletter",utm_medium="email",app="victorbona-blog"} 1
blog_page_views_total{path="/blog",method="GET",is_bot="true",content_type="blog",source="twitter",utm_source="",utm_medium="",app="victorbona-blog"} 1
blog_page_views_total{path="/",method="GET",is_bot="true",content_type="page",source="bing",utm_source="",utm_medium="",app="victorbona-blog"} 1
blog_page_views_total{path="/",method="GET",is_bot="true",content_type="page",source="facebook",utm_source="",utm_medium="",app="victorbona-blog"} 1
blog_page_views_total{path="/",method="GET",is_bot="true",content_type="page",source="linkedin",utm_source="",utm_medium="",app="victorbona-blog"} 1
blog_page_views_total{path="/",method="GET",is_bot="true",content_type="page",source="reddit",utm_source="",utm_medium="",app="victorbona-blog"} 1
blog_page_views_total{path="/",method="GET",is_bot="true",content_type="page",source="hackernews",utm_source="",utm_medium="",app="victorbona-blog"} 1
blog_page_views_total{path="/",method="GET",is_bot="true",content_type="page",source="someunknown.site",utm_source="",utm_medium="",app="victorbona-blog"} 1
```

## Next Phase Readiness

**Ready for Phase 9 (Device Analytics):**
- Metrics infrastructure extended and working
- Header-passing pattern proven for additional dimensions
- Can add device/browser dimension to existing counters

**Ready for Phase 10 (Dashboard):**
- Traffic source data available for Grafana queries
- Can create panels for: traffic by source, UTM campaign performance
- Example PromQL: `sum(blog_page_views_total{is_bot="false"}) by (source)`

**Concerns:**
- None blocking

---

*Phase: 08-traffic-source-attribution*
*Completed: 2026-01-28*
