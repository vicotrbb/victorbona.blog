# Project Research Summary

**Project:** victorbona.blog v1.1 Analytics and Dashboard
**Domain:** Page analytics metrics + Grafana dashboard provisioning for existing Next.js blog
**Researched:** 2026-01-28
**Confidence:** HIGH

## Executive Summary

This milestone extends an existing Next.js blog (already deployed with prom-client at `/metrics`, Grafana Faro browser RUM, and ArgoCD GitOps) with server-side page analytics metrics and a GitOps-provisioned Grafana dashboard. The established pattern for this is straightforward: add Prometheus counters for page views/traffic sources, parse User-Agent into categorical labels using bowser (MIT-licensed), and deploy the Grafana dashboard via a ConfigMap with sidecar discovery labels. The existing infrastructure handles the hard parts (metrics scraping, dashboard provisioning) already.

The recommended approach leverages existing prom-client infrastructure. Add 3-4 new Counter metrics (page views, source attribution, device/browser categories) with carefully bounded cardinality (normalize paths, categorize referrers, parse UA to families). The dashboard is provisioned through a Helm-templated ConfigMap with `grafana_dashboard: "1"` label that the existing Grafana sidecar discovers automatically. This follows GitOps principles: dashboard changes tracked in Git, no manual Grafana UI edits.

Key risks center on **cardinality explosion** from unbounded labels. Using raw paths, full referrer URLs, or exact User-Agent strings will cause memory growth and Prometheus performance degradation. The mitigation is design-time: normalize paths to templates (`/blog/:slug`), categorize referrers to ~15 domains, and parse UA to browser/device families. Dashboard-side, ensure ConfigMaps stay under 200KB and verify sidecar label matching. Both risks are avoidable with upfront design.

## Key Findings

### Recommended Stack

The stack is minimal because the heavy lifting already exists. One new production dependency and Helm template additions.

**New dependencies:**
- **bowser@^2.13.1**: MIT-licensed User-Agent parser (18.7M weekly downloads). Chosen over ua-parser-js because ua-parser-js v2+ uses AGPL-3.0 which requires source disclosure for server-side use.

**Helm additions:**
- ConfigMap template for Grafana dashboard (`chart/templates/dashboard-configmap.yaml`)
- Dashboard JSON file (`chart/dashboards/victorbona-blog.json`)
- Values configuration for dashboard enablement

**No new infrastructure needed.** Existing ServiceMonitor continues scraping `/metrics`. Existing Grafana sidecar discovers ConfigMaps with `grafana_dashboard: "1"` label.

### Expected Features

**Must have (table stakes):**
- Page views by path — `blog_page_views_total{path="/blog/:slug"}` — core analytics, which posts are popular
- Request status codes — `blog_http_requests_total{path, status_code}` — see 404s and errors
- Grafana dashboard with page views over time — single pane of glass for traffic

**Should have (differentiators):**
- Referrer source attribution — `blog_page_views_by_source_total{source="search"}` — where traffic comes from, categorized to ~15 values
- Device/browser categories — `blog_page_views_by_device_total{device, browser}` — mobile vs desktop breakdown
- UTM campaign tracking — optional if sharing links with UTM params

**Defer (v2+ or skip):**
- IP geolocation — privacy concern, requires GeoIP database, overkill
- Session tracking — Faro already handles this client-side
- Full referrer URLs in metrics — cardinality explosion
- Engagement time metrics — Faro Web Vitals covers this
- Individual visitor tracking — privacy concern, no GDPR consent flow

### Architecture Approach

The architecture follows the existing observability pattern: middleware intercepts requests, increments prom-client counters, Prometheus scrapes `/metrics` via ServiceMonitor, and Grafana queries Prometheus. The new Grafana dashboard is provisioned via ConfigMap with sidecar discovery, following GitOps principles.

**Major components:**
1. **Next.js Middleware** — Intercepts all requests, extracts path/referrer/UA, increments counters
2. **Metrics module extension** — Add new Counters to existing `app/lib/metrics.ts` registry
3. **UA parsing utility** — New `app/lib/user-agent.ts` using bowser for categorical parsing
4. **Dashboard ConfigMap** — Helm template deploying dashboard JSON with sidecar labels
5. **Dashboard JSON** — Grafana dashboard combining Prometheus metrics and Faro/Loki data

**Data flow:**
- Request hits Next.js middleware
- Middleware parses path, normalizes it, parses UA, categorizes referrer
- Counter incremented with low-cardinality labels
- Prometheus scrapes `/metrics` every 30s (existing ServiceMonitor)
- Grafana dashboard queries Prometheus and Loki

### Critical Pitfalls

1. **High-cardinality path labels** — Never use raw request paths as labels. Normalize to route templates (e.g., `/blog/:slug`). Unbounded paths cause memory growth and Prometheus degradation.

2. **Raw User-Agent labels** — Each browser version creates a new time series. Parse UA into categorical buckets (device: mobile/tablet/desktop, browser: chrome/firefox/safari/edge/other). Target ~15 combinations.

3. **Full referrer URL labels** — External URLs have unbounded cardinality. Extract and normalize to domain categories (google, twitter, github, other). Target ~15 values.

4. **ConfigMap size limits** — Kubernetes limits ConfigMaps to 1MB, annotations to 256KB. Keep dashboard JSON under 200KB. Split if needed.

5. **Missing sidecar label** — ConfigMap without `grafana_dashboard: "1"` label is invisible to Grafana sidecar. Always verify label matches Grafana sidecar configuration.

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Page View Metrics

**Rationale:** Core metrics must exist before dashboard can query them. Start with simplest metric (page views) to validate the pattern.

**Delivers:**
- `blog_page_views_total` counter with normalized path label
- Next.js middleware skeleton
- Path normalization utility

**Addresses:** Table stakes feature (page views by path)

**Avoids:** Cardinality explosion by implementing path normalization from day one

**Estimated effort:** Small (few hours)

### Phase 2: Traffic Source Attribution

**Rationale:** Builds on middleware skeleton from Phase 1. Referrer parsing is independent of UA parsing, so can be done separately.

**Delivers:**
- `blog_page_views_by_source_total` counter with source category label
- Referrer parsing/categorization utility
- UTM parameter extraction (optional)

**Addresses:** Differentiator features (referrer attribution)

**Avoids:** Full URL cardinality trap by categorizing upfront

**Estimated effort:** Small (few hours)

### Phase 3: Device and Browser Analytics

**Rationale:** Requires bowser library installation. Slightly more complex than referrer parsing due to UA string edge cases.

**Delivers:**
- bowser@^2.13.1 installed
- `blog_page_views_by_device_total` counter with device/browser labels
- UA parsing utility with fallback handling

**Addresses:** Differentiator features (device breakdown)

**Avoids:** UA cardinality trap by using browser families not versions

**Estimated effort:** Small (few hours)

### Phase 4: Grafana Dashboard

**Rationale:** All metrics must be available and verified in Prometheus before building dashboard. Dashboard design depends on knowing actual data shape.

**Delivers:**
- Dashboard JSON file with portable datasource variables
- Helm ConfigMap template with sidecar labels
- Values configuration for dashboard enablement
- Combined view of Prometheus metrics + Faro/Loki sessions

**Addresses:** Dashboard as unified view for analytics

**Avoids:** Hardcoded datasource UIDs, YAML formatting issues

**Estimated effort:** Medium (dashboard design + iteration)

### Phase Ordering Rationale

- **Metrics before dashboard:** Dashboard queries require metrics to exist. Building dashboard first would mean guessing at metric names/labels.
- **Page views first:** Simplest metric validates the entire pipeline (middleware, counter, scraping, Prometheus storage).
- **Referrer before UA:** Referrer parsing is simpler (URL parsing) than UA parsing (string pattern matching). Lower risk iteration.
- **Dashboard last:** Once all metrics exist, dashboard can be designed with real data in Grafana Explore, then exported and committed.

### Research Flags

Phases with well-documented patterns (skip phase research):

- **Phase 1 (Page Views):** Standard prom-client Counter pattern. Existing metrics module provides the template.
- **Phase 2 (Referrer):** Simple URL parsing and switch/case categorization.
- **Phase 3 (Device/Browser):** bowser API is straightforward. Parse UA, extract browser.name and platform.type.
- **Phase 4 (Dashboard):** Standard ConfigMap + sidecar pattern well documented in Grafana Helm chart.

No phases need `/gsd:research-phase`. All patterns are well-established with high-confidence sources.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | bowser verified on npm (18.7M downloads, MIT license). prom-client already in use. |
| Features | HIGH | Feature set derived from standard analytics patterns, scoped appropriately for blog |
| Architecture | HIGH | Follows existing patterns (middleware, prom-client, ConfigMap sidecar). No novel components. |
| Pitfalls | HIGH | Cardinality traps well-documented in Prometheus ecosystem. ConfigMap limits verified. |

**Overall confidence:** HIGH

This is a straightforward extension of existing infrastructure. No novel patterns or risky integrations. The main complexity is in design discipline (avoiding cardinality traps), not implementation.

### Gaps to Address

- **Grafana sidecar namespace configuration:** Verify whether existing Grafana has `searchNamespace: ALL` or specific namespace. Determines where ConfigMap must deploy. Check during Phase 4.

- **Faro session correlation:** Dashboard can show Faro data via Loki, but cross-datasource correlation is limited. Use separate panels with linked time ranges rather than attempting mixed queries.

- **Histogram bucket tuning:** If adding request latency histogram later, tune buckets for web page loads (50ms-5s range). Not needed for v1.1 counters-only scope.

## Sources

### Primary (HIGH confidence)
- [prom-client GitHub](https://github.com/siimon/prom-client) — Counter API, label patterns, singleton pattern
- [Prometheus Best Practices: Naming](https://prometheus.io/docs/practices/naming/) — Metric naming, cardinality guidance
- [bowser npm](https://www.npmjs.com/package/bowser) — MIT license verification, API reference
- [Grafana Helm Chart](https://github.com/grafana/helm-charts/blob/main/charts/grafana/values.yaml) — Sidecar configuration reference

### Secondary (MEDIUM confidence)
- [Last9: High Cardinality Metrics](https://last9.io/blog/how-to-manage-high-cardinality-metrics-in-prometheus/) — Cardinality limits, prevention strategies
- [Dan Laush: Normalizing Next.js dynamic routes](https://danlaush.biz/posts/dynamic-routes-prometheus) — Path normalization patterns
- [Provision Grafana Dashboards Using Helm and Sidecars](https://medium.com/cloud-native-daily/provision-grafana-dashboards-and-alerts-using-helm-and-sidecars-733dcd223037) — ConfigMap provisioning pattern

### Tertiary (LOW confidence)
- [ua-parser-js License Analysis](https://blog.logrocket.com/user-agent-detection-ua-parser-js-license-change/) — AGPL concerns, validated by checking npm page directly

---
*Research completed: 2026-01-28*
*Ready for roadmap: yes*
