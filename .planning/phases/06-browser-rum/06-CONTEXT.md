# Phase 6: Browser RUM (Faro) - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable client-side observability with Grafana Faro SDK. Collect browser performance metrics (Core Web Vitals), JavaScript errors, and navigation events. Send telemetry to Alloy for processing and storage in Grafana.

</domain>

<decisions>
## Implementation Decisions

### Initialization behavior
- Production only — skip Faro entirely during local development
- Console warning on init failure — don't break the app, but log a warning
- Faro endpoint URL from environment variable (NEXT_PUBLIC_FARO_URL)
- Early async loading — initialize ASAP but don't block rendering

### Data collection scope
- All three Core Web Vitals: LCP, CLS, INP
- Track page view/navigation events (route changes)
- Enable session tracking to correlate events from same visit
- No custom attributes — just default Faro telemetry

### User privacy
- Respect Do Not Track header — skip Faro if browser DNT is set
- Full URL with path captured (to know which blog posts are visited)
- Collect user agent / browser info (useful for debugging)
- IP handling delegated to Alloy/Grafana backend

### Error reporting
- Capture all uncaught JavaScript errors
- Don't capture console.error() calls — uncaught exceptions only
- Upload source maps to self-hosted endpoint for readable stack traces
- Capture all errors including third-party — filter in Grafana if needed

### Claude's Discretion
- Exact Faro SDK version and instrumentation packages
- Error boundary integration approach
- Source map upload mechanism details

</decisions>

<specifics>
## Specific Ideas

- "Blog is public anyway" — source code visibility is not a concern, so source maps are acceptable
- DNT respect aligns with privacy-conscious approach without requiring cookie consent banner

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-browser-rum*
*Context gathered: 2026-01-27*
