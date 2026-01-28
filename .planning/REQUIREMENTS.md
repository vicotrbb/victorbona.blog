# Requirements: victorbona.blog v1.1

**Defined:** 2026-01-28
**Core Value:** Full observability with actionable page analytics and a unified dashboard

## v1.1 Requirements

Requirements for Analytics & Dashboard milestone. Each maps to roadmap phases.

### Page View Metrics

- [ ] **METRICS-01**: Page views tracked with normalized path labels (`/blog/:slug`, `/articles/:slug`, `/projects/:slug`)
- [ ] **METRICS-02**: Request count tracked by HTTP status code (2xx, 3xx, 4xx, 5xx)
- [ ] **METRICS-03**: Request count tracked by content type (blog, article, project, page, api)
- [ ] **METRICS-04**: Request latency histogram with p50/p90/p99 percentiles

### Traffic Sources

- [ ] **TRAFFIC-01**: Referrer categorized into source buckets (search, social, direct, internal, other)
- [ ] **TRAFFIC-02**: UTM parameters parsed and tracked (campaign, source, medium)

### Device Analytics

- [ ] **DEVICE-01**: Browser family identified (Chrome, Firefox, Safari, Edge, Other)
- [ ] **DEVICE-02**: Platform category identified (Desktop, Mobile, Tablet)

### Grafana Dashboard

- [ ] **DASH-01**: Dashboard JSON provisioned via ConfigMap in Helm chart
- [ ] **DASH-02**: Dashboard auto-discovered by Grafana sidecar with correct labels
- [ ] **DASH-03**: Page views over time panel (Prometheus query)
- [ ] **DASH-04**: Top pages panel showing most viewed paths
- [ ] **DASH-05**: Traffic sources breakdown panel (referrer categories)
- [ ] **DASH-06**: Device/browser distribution panel
- [ ] **DASH-07**: Unique sessions panel from Faro/Loki data
- [ ] **DASH-08**: Core Web Vitals panel (LCP, FID/INP, CLS) from Faro data

## Future Requirements

Deferred to later milestones. Tracked but not in current roadmap.

### Extended Analytics

- **EXT-01**: Top referring domains with actual domain names
- **EXT-02**: OS family breakdown (Windows, macOS, Linux, iOS, Android)
- **EXT-03**: Geographic distribution (requires GeoIP database)
- **EXT-04**: Real-time visitor count

### Dashboard Enhancements

- **DASH-EXT-01**: Alerting rules for traffic anomalies
- **DASH-EXT-02**: Comparison panels (this week vs last week)
- **DASH-EXT-03**: Export/report generation

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Full referrer URLs | High cardinality risk, privacy concerns |
| Exact browser versions | High cardinality, family is sufficient |
| Individual visitor tracking | Privacy violation, Faro sessions sufficient |
| User session recording | Scope creep, not needed for analytics |
| Real-time dashboards | Polling sufficient for personal blog |
| Custom business metrics | Not relevant for blog analytics |
| Database storage | Blog must remain stateless |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| METRICS-01 | TBD | Pending |
| METRICS-02 | TBD | Pending |
| METRICS-03 | TBD | Pending |
| METRICS-04 | TBD | Pending |
| TRAFFIC-01 | TBD | Pending |
| TRAFFIC-02 | TBD | Pending |
| DEVICE-01 | TBD | Pending |
| DEVICE-02 | TBD | Pending |
| DASH-01 | TBD | Pending |
| DASH-02 | TBD | Pending |
| DASH-03 | TBD | Pending |
| DASH-04 | TBD | Pending |
| DASH-05 | TBD | Pending |
| DASH-06 | TBD | Pending |
| DASH-07 | TBD | Pending |
| DASH-08 | TBD | Pending |

**Coverage:**
- v1.1 requirements: 16 total
- Mapped to phases: 0
- Unmapped: 16 ⚠️

---
*Requirements defined: 2026-01-28*
*Last updated: 2026-01-28 after initial definition*
