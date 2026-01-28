# Roadmap: victorbona.blog

## Milestones

- v1.0 Production Deployment - Phases 1-6 (shipped 2026-01-28)
- v1.1 Analytics & Dashboard - Phases 7-10 (in progress)

## Phases

<details>
<summary>v1.0 Production Deployment (Phases 1-6) - SHIPPED 2026-01-28</summary>

See MILESTONES.md for v1.0 details:
- Multi-stage Dockerfile with non-root execution
- GitHub Actions CI/CD for multi-arch Docker builds
- Production Helm chart with HPA, PDB, and security contexts
- OpenTelemetry server-side tracing
- Prometheus metrics endpoint with ServiceMonitor
- Grafana Faro browser RUM with DNT compliance

</details>

### v1.1 Analytics & Dashboard (In Progress)

**Milestone Goal:** Full observability with actionable page analytics and a unified Grafana dashboard combining Prometheus metrics with Faro browser RUM data.

- [ ] **Phase 7: Page View Metrics** - Core middleware with path normalization and request tracking
- [ ] **Phase 8: Traffic Source Attribution** - Referrer categorization and UTM parameter parsing
- [ ] **Phase 9: Device Analytics** - User-Agent parsing for browser and device categories
- [ ] **Phase 10: Grafana Dashboard** - GitOps-provisioned dashboard with all analytics panels

## Phase Details

### Phase 7: Page View Metrics
**Goal**: Server-side page view tracking with normalized paths and request metadata
**Depends on**: Phase 6 (existing /metrics endpoint with prom-client)
**Requirements**: METRICS-01, METRICS-02, METRICS-03, METRICS-04
**Success Criteria** (what must be TRUE):
  1. Visiting /blog/any-post increments counter with actual path label
  2. Visiting /articles/any-article increments counter with actual path label
  3. 404 errors increment counter with status_code="404" label
  4. /metrics endpoint shows blog_page_views_total and blog_http_requests_total metrics
**Plans:** 1 plan

Plans:
- [ ] 07-01-PLAN.md — Extend metrics, create middleware, track 404s

### Phase 8: Traffic Source Attribution
**Goal**: Traffic source categorization from referrer headers and UTM parameters
**Depends on**: Phase 7 (middleware skeleton exists)
**Requirements**: TRAFFIC-01, TRAFFIC-02
**Success Criteria** (what must be TRUE):
  1. Visit from Google search shows source="search" in metrics
  2. Visit from Twitter/X link shows source="social" in metrics
  3. Direct visits (no referrer) show source="direct" in metrics
  4. URLs with ?utm_source=newsletter tracked with utm labels
**Plans**: TBD

Plans:
- [ ] 08-01: TBD

### Phase 9: Device Analytics
**Goal**: User-Agent parsing into browser and device categories using bowser
**Depends on**: Phase 7 (middleware skeleton exists)
**Requirements**: DEVICE-01, DEVICE-02
**Success Criteria** (what must be TRUE):
  1. Chrome browser visits show browser="Chrome" in metrics
  2. Safari on iPhone shows browser="Safari" and device="Mobile" in metrics
  3. Firefox on desktop shows browser="Firefox" and device="Desktop" in metrics
  4. Unknown/bot user agents show browser="Other" without crashing
**Plans**: TBD

Plans:
- [ ] 09-01: TBD

### Phase 10: Grafana Dashboard
**Goal**: GitOps-provisioned Grafana dashboard combining Prometheus metrics and Faro data
**Depends on**: Phases 7, 8, 9 (all metrics must exist before dashboard queries them)
**Requirements**: DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06, DASH-07, DASH-08
**Success Criteria** (what must be TRUE):
  1. Dashboard appears in Grafana without manual import (sidecar discovery works)
  2. Page views over time graph shows real data from Prometheus
  3. Top pages panel shows most viewed paths ranked by count
  4. Traffic sources panel shows breakdown by referrer category
  5. Device/browser panel shows visitor distribution
**Plans**: TBD

Plans:
- [ ] 10-01: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 7 -> 8 -> 9 -> 10

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 7. Page View Metrics | v1.1 | 0/1 | Planned | - |
| 8. Traffic Source Attribution | v1.1 | 0/? | Not started | - |
| 9. Device Analytics | v1.1 | 0/? | Not started | - |
| 10. Grafana Dashboard | v1.1 | 0/? | Not started | - |

---
*Roadmap created: 2026-01-28*
*Milestone v1.1 started*
*Phase 7 planned: 2026-01-28*
