# Phase 10: Grafana Dashboard - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

GitOps-provisioned Grafana dashboard combining Prometheus metrics (page views, traffic sources, device analytics from Phases 7-9) with Faro browser RUM data. Dashboard auto-discovered via sidecar. Additional dashboards or alerting rules are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Panel Layout
- Single page dashboard with collapsible row sections
- Rows organized by question answered: "How much traffic?", "Where from?", "What devices?", "How fast?"
- All rows expanded by default
- Summary row at top with stat panels (total views, unique visitors, top page, etc.)

### Time Range Defaults
- Default time range: Last 24 hours
- Auto-refresh every 30 seconds
- Dashboard-wide time picker only (no per-panel overrides)
- Stat panels respect the selected time range (not hardcoded to "today")

### Data Visualization Types
- Page views over time: Line graph
- Top pages ranking: Table (sortable with path and view count)
- Traffic sources breakdown: Pie chart
- Browser/device breakdown: Pie charts (consistent with traffic sources)

### Faro Integration
- Dedicated row for browser RUM data
- Show all available Faro metrics: Core Web Vitals (LCP, FID, CLS), page load timing, JS errors
- Unified time picker across Prometheus and Faro panels
- Web Vitals: Both summary health indicator AND individual metric panels

### Claude's Discretion
- Exact panel widths and grid positioning
- Color schemes and thresholds for health indicators
- Query optimization and aggregation intervals
- Panel titles and descriptions

</decisions>

<specifics>
## Specific Ideas

- Rows should answer user questions: "How much traffic?", "Where from?", "What devices?", "How fast?"
- Web Vitals should show both a quick health summary and detailed individual metrics
- Consistent pie chart style across all breakdown panels (traffic sources, browsers, devices)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 10-grafana-dashboard*
*Context gathered: 2026-01-28*
