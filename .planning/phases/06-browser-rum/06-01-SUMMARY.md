---
phase: 06-browser-rum
plan: 01
subsystem: observability
tags: [faro, rum, web-vitals, grafana, client-monitoring]

# Dependency graph
requires:
  - phase: 01-container-foundation
    provides: "Next.js standalone output and app structure"
  - phase: 03-helm-deployment
    provides: "Helm values.yaml for environment configuration"
provides:
  - "Grafana Faro Web SDK integration for browser RUM"
  - "FaroInit client component with privacy guards"
  - "Core Web Vitals collection (LCP, CLS, INP)"
  - "JavaScript error tracking"
  - "Session tracking with persistence"
affects: [07-renovate]

# Tech tracking
tech-stack:
  added: ["@grafana/faro-web-sdk"]
  patterns: ["Client component initialization guard pattern", "DNT privacy compliance"]

key-files:
  created: ["app/components/faro-init.tsx"]
  modified: ["package.json", "app/layout.tsx", "chart/values.yaml"]

key-decisions:
  - "DNT guard respects Do Not Track browser setting for privacy"
  - "Production guard prevents Faro in local dev (no NEXT_PUBLIC_FARO_URL)"
  - "HMR guard via faro.api check prevents duplicate initialization"
  - "FaroInit placed as first child of body for early initialization"

patterns-established:
  - "Client component guard pattern: SSR -> initialized -> DNT -> config"
  - "NEXT_PUBLIC_ prefix for client-exposed environment variables"

# Metrics
duration: 8min
completed: 2026-01-27
---

# Phase 6 Plan 01: Browser RUM Summary

**Grafana Faro Web SDK integrated with privacy-respecting guards for Core Web Vitals, error tracking, and session tracking**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-27T10:00:00Z
- **Completed:** 2026-01-27T10:08:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- Installed @grafana/faro-web-sdk v2.2.0 for browser Real User Monitoring
- Created FaroInit client component with four-layer guard pattern (SSR, HMR, DNT, production)
- Integrated FaroInit into root layout as first child of body
- Configured NEXT_PUBLIC_FARO_URL and NEXT_PUBLIC_APP_VERSION in Helm values
- Production build verified successfully

## Task Commits

Each task was committed atomically:

1. **Task 1: Install Faro SDK and create FaroInit component** - `f19fb03` (feat)
2. **Task 2: Integrate FaroInit into layout and configure Helm values** - `8d19cd5` (feat)

## Files Created/Modified
- `app/components/faro-init.tsx` - FaroInit client component with guards and Faro initialization
- `package.json` - Added @grafana/faro-web-sdk dependency
- `app/layout.tsx` - Import and render FaroInit as first child of body
- `chart/values.yaml` - NEXT_PUBLIC_FARO_URL and NEXT_PUBLIC_APP_VERSION env vars

## Decisions Made
- **DNT compliance:** Added Do Not Track browser setting check per CONTEXT.md privacy decision
- **Guard order:** SSR first (eliminates SSR paths), then HMR (prevents duplicates), then DNT (privacy), then config (production only)
- **Layout placement:** FaroInit as first child of body for earliest possible initialization
- **Session persistence:** enabled: true, persistent: true for cross-visit correlation

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - installation, TypeScript compilation, and build all succeeded on first attempt.

## User Setup Required

None - no external service configuration required. Faro endpoint (faro.bonalab.org) is pre-configured in Helm values.

## Next Phase Readiness
- Browser RUM integration complete
- Faro will initialize on Kubernetes deployment when NEXT_PUBLIC_FARO_URL is set
- Ready for Phase 7 (Renovate dependency management)
- All observability phases complete (server tracing, metrics, browser RUM)

---
*Phase: 06-browser-rum*
*Completed: 2026-01-27*
