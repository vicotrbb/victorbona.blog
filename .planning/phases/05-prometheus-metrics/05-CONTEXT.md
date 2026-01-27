# Phase 5: Prometheus Metrics - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Expose metrics endpoint for Prometheus scraping with prom-client. Includes ServiceMonitor configuration for automatic discovery. Custom business metrics and dashboards are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Metrics Selection
- Default Node.js runtime metrics only (collectDefaultMetrics)
- No custom prefix — use standard names like nodejs_heap_size_bytes
- Service name label only (app='victorbona-blog') — Kubernetes adds pod/namespace

### Endpoint Design
- Path: /metrics (standard Prometheus convention)
- No authentication — Prometheus scrapes internally via ClusterIP
- Prometheus text format only (text/plain), no OpenMetrics negotiation
- Return 503 Service Unavailable if metrics collection fails

### Scrape Configuration
- 30s scrape interval
- 10s scrape timeout
- ServiceMonitor deployed in same namespace as application
- No extra relabeling — rely on Prometheus default Kubernetes labels

### Registry Pattern
- Global singleton pattern for prom-client registry
- Initialize once at startup, collect on-demand when /metrics is hit
- Fail fast on duplicate metric registration (catches bugs early)

### Claude's Discretion
- Per-pod vs aggregated metrics approach
- HMR handling strategy for development (globalThis or re-initialize)

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 05-prometheus-metrics*
*Context gathered: 2026-01-27*
