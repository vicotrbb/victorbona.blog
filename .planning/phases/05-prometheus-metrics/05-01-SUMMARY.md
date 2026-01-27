---
phase: 05-prometheus-metrics
plan: 01
subsystem: observability
tags: [prometheus, prom-client, metrics, servicemonitor, kubernetes]

# Dependency graph
requires:
  - phase: 03-helm-deployment
    provides: Helm chart with ServiceMonitor template
provides:
  - /metrics endpoint with Prometheus text format
  - Default Node.js runtime metrics (heap, CPU, event loop, GC)
  - ServiceMonitor for automatic Prometheus discovery
affects: [06-browser-rum, dashboards, alerting]

# Tech tracking
tech-stack:
  added: [prom-client@15.1.3]
  patterns: [globalThis singleton for HMR resilience]

key-files:
  created: [app/lib/metrics.ts, app/metrics/route.ts]
  modified: [package.json, chart/values.yaml]

key-decisions:
  - "globalThis singleton for metrics registry to survive HMR"
  - "Standard nodejs_* metric names (no custom prefix)"
  - "app=victorbona-blog label on all metrics"
  - "/metrics path via app/metrics/route.ts (not /api/metrics)"

patterns-established:
  - "Singleton pattern: globalThis for module instances that must survive HMR"
  - "Metrics route: force-dynamic export, 503 on collection failure"

# Metrics
duration: 8min
completed: 2026-01-27
---

# Phase 5 Plan 1: Prometheus Metrics Summary

**prom-client integration exposing /metrics endpoint with Node.js runtime metrics and Kubernetes ServiceMonitor for automatic Prometheus discovery**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-27T12:00:00Z
- **Completed:** 2026-01-27T12:08:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Prometheus metrics endpoint at /metrics with text/plain content type
- Default Node.js runtime metrics (heap, CPU, event loop, GC, handles, memory)
- globalThis singleton pattern for HMR resilience in development
- ServiceMonitor enabled for automatic Prometheus scraping

## Task Commits

Each task was committed atomically:

1. **Task 1: Create metrics module and route** - `76dba79` (feat)
2. **Task 2: Enable Helm ServiceMonitor** - `b67e32f` (feat)

## Files Created/Modified
- `app/lib/metrics.ts` - Singleton metrics registry with default collectors
- `app/metrics/route.ts` - GET handler for /metrics endpoint
- `package.json` - Added prom-client@^15.1.3 dependency
- `chart/values.yaml` - Enabled metrics and ServiceMonitor

## Decisions Made
- **globalThis singleton**: Used to survive Next.js HMR cycles, prevents "metric already registered" errors in development
- **No custom prefix**: Standard `nodejs_*` metric names are expected by existing dashboards
- **app label**: Set `app: 'victorbona-blog'` as default label for easy filtering
- **Route path**: Used `app/metrics/route.ts` instead of `app/api/metrics/route.ts` to create `/metrics` path matching values.yaml configuration
- **Error handling**: Returns 503 Service Unavailable on metrics collection failure (not empty 200)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. The ServiceMonitor will be automatically discovered by Prometheus when deployed to Kubernetes with prometheus-operator.

## Next Phase Readiness
- Metrics endpoint ready for Prometheus scraping
- ServiceMonitor configured and will render on helm install/upgrade
- Ready for Phase 6 (Browser RUM) or custom application metrics in future phases
- No blockers

---
*Phase: 05-prometheus-metrics*
*Completed: 2026-01-27*
