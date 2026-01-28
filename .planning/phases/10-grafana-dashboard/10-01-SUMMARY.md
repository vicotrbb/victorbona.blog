---
phase: 10-grafana-dashboard
plan: 01
subsystem: observability
tags: [grafana, dashboard, prometheus, loki, faro, web-vitals, analytics]

dependency-graph:
  requires:
    - phase: 07-page-view-metrics
      provides: blog_page_views_total Counter with path/method/is_bot/content_type labels
    - phase: 08-traffic-source-attribution
      provides: Extended metric with source/utm_source/utm_medium labels
    - phase: 09-device-analytics
      provides: Extended metric with browser/device labels
  provides:
    - GitOps-provisioned Grafana dashboard via ConfigMap
    - Page views, traffic sources, device analytics visualization
    - Web Vitals panels (LCP, INP, CLS) via Loki/Faro
    - Dashboard auto-discovery via grafana_dashboard label
  affects:
    - Future dashboard iterations
    - v1.1 milestone completion

tech-stack:
  added: []
  patterns:
    - ConfigMap with grafana_dashboard label for sidecar discovery
    - Template variables for datasource portability
    - Row-based dashboard organization by user questions

key-files:
  created:
    - chart/files/dashboards/blog-analytics.json
    - chart/templates/grafana-dashboard.yaml
  modified:
    - chart/values.yaml

key-decisions:
  - "10-01-D1: Use schema version 42 for current Grafana compatibility"
  - "10-01-D2: Template variables for datasource portability (${datasource}, ${loki})"
  - "10-01-D3: Row sections organized by user questions (traffic, sources, devices, performance)"
  - "10-01-D4: Deploy to observability-system namespace for Grafana sidecar discovery"

patterns-established:
  - Dashboard JSON embedded in Helm chart via .Files.Get
  - PromQL patterns: increase() for totals, rate() * 60 for per-minute time series
  - LogQL patterns: logfmt parsing with unwrap for Web Vitals

duration: 2min
completed: 2026-01-28
---

# Phase 10 Plan 1: Grafana Dashboard Summary

**GitOps-provisioned Grafana dashboard visualizing page views, traffic sources, device analytics, and Web Vitals from Prometheus and Loki data sources**

## Performance

- **Duration:** 2 minutes
- **Started:** 2026-01-28T21:52:10Z
- **Completed:** 2026-01-28T21:54:34Z
- **Tasks:** 2/2
- **Files created:** 2
- **Files modified:** 1

## Accomplishments

- Complete Grafana dashboard JSON with 22 panels (6 rows, 16 visualizations)
- Helm ConfigMap template with grafana_dashboard: "1" label for sidecar auto-discovery
- Template variables for datasource portability (prometheus, loki)
- Dashboard sections organized by user questions:
  - Summary Stats: Total views, unique sessions, top page, avg load time
  - Traffic Trends: Page views over time (timeseries)
  - Top Pages: Ranking table with topk() query
  - Traffic Sources: Referrer, UTM source, UTM medium (pie charts)
  - Devices: Browser and device distribution (pie charts)
  - Performance: Web Vitals (LCP, INP, CLS) with thresholds, JS errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Create dashboard JSON with all analytics panels** - `d0a63fd` (feat)
2. **Task 2: Create Helm ConfigMap template and update values.yaml** - `bc600fd` (feat)

## Files Created/Modified

- `chart/files/dashboards/blog-analytics.json` - Complete dashboard JSON (823 lines)
- `chart/templates/grafana-dashboard.yaml` - Helm ConfigMap template with sidecar label
- `chart/values.yaml` - Added dashboard configuration under observability section

## Dashboard Structure

| Row | Title | Panels | Queries |
|-----|-------|--------|---------|
| 1 | Summary Stats | 4 stat panels | Total views, sessions (Loki), top page, avg LCP |
| 2 | Traffic Trends | 1 timeseries | `rate(blog_page_views_total) * 60` |
| 3 | Top Pages | 1 table | `topk(10, sum by (path) (...))` |
| 4 | Traffic Sources | 3 pie charts | Source, UTM source, UTM medium breakdown |
| 5 | Devices | 2 pie charts | Browser, device distribution |
| 6 | Performance | 5 stat panels | Web Vitals health, LCP, INP, CLS, JS errors |

## PromQL Queries

```promql
# Total page views (stat panel)
sum(increase(blog_page_views_total{is_bot="false"}[$__range]))

# Page views over time (timeseries)
sum(rate(blog_page_views_total{is_bot="false"}[$__rate_interval])) * 60

# Top pages ranking
topk(10, sum by (path) (increase(blog_page_views_total{is_bot="false"}[$__range])))

# Traffic sources breakdown
sum by (source) (increase(blog_page_views_total{is_bot="false"}[$__range]))

# Browser/device distribution
sum by (browser) (increase(blog_page_views_total{is_bot="false"}[$__range]))
sum by (device) (increase(blog_page_views_total{is_bot="false"}[$__range]))
```

## LogQL Queries (Faro/Web Vitals)

```logql
# LCP (Largest Contentful Paint) p75
{app="victorbona-blog"} |= `kind=measurement` |= `type=web-vitals` | logfmt | unwrap lcp [$__range] | quantile_over_time(0.75)

# INP (Interaction to Next Paint) p75
{app="victorbona-blog"} |= `kind=measurement` |= `type=web-vitals` | logfmt | unwrap inp [$__range] | quantile_over_time(0.75)

# CLS (Cumulative Layout Shift) p75
{app="victorbona-blog"} |= `kind=measurement` |= `type=web-vitals` | logfmt | unwrap cls [$__range] | quantile_over_time(0.75)

# JS Errors count
count_over_time({app="victorbona-blog"} |= `kind=exception` [$__range])
```

## Decisions Made

| ID | Decision | Reason |
|----|----------|--------|
| 10-01-D1 | Schema version 42 | Current Grafana standard, supports all panel types |
| 10-01-D2 | Template variables for datasources | Portability across environments |
| 10-01-D3 | Row sections by user questions | Intuitive organization (traffic, sources, devices, performance) |
| 10-01-D4 | observability-system namespace | Grafana sidecar watches this namespace |

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - all verification tests passed on first attempt.

## User Setup Required

None - dashboard is auto-discovered by Grafana sidecar when deployed.

## Verification Results

All success criteria met:
- [x] DASH-01: Dashboard JSON provisioned via ConfigMap in Helm chart
- [x] DASH-02: Dashboard auto-discovered by Grafana sidecar with correct labels (`grafana_dashboard: "1"`)
- [x] DASH-03: Page views over time panel with valid PromQL query
- [x] DASH-04: Top pages table panel with `topk()` query
- [x] DASH-05: Traffic sources pie chart with `sum by (source)` query
- [x] DASH-06: Browser and device pie charts with correct label queries
- [x] DASH-07: Unique sessions stat panel with Loki query
- [x] DASH-08: Web Vitals panels (LCP, INP, CLS) with Loki queries and thresholds
- [x] Helm lint passes
- [x] Helm template renders valid YAML with ConfigMap

## v1.1 Milestone Complete

With Phase 10 complete, the v1.1 Analytics & Dashboard milestone is finished:

| Phase | Name | Status |
|-------|------|--------|
| 7 | Page View Metrics | Complete |
| 8 | Traffic Source Attribution | Complete |
| 9 | Device Analytics | Complete |
| 10 | Grafana Dashboard | Complete |

All analytics infrastructure is in place:
- Server-side page view tracking with Prometheus metrics
- Traffic source detection (referrer, UTM parameters)
- Browser/device analytics
- GitOps-provisioned dashboard for visualization

---

*Phase: 10-grafana-dashboard*
*Completed: 2026-01-28*
