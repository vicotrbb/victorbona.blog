# Phase 4: Server-Side Tracing - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Enable OpenTelemetry traces to Tempo via Alloy for server-side observability. This includes instrumentation.ts configuration, OTLP exporter setup, and Helm values for OTEL environment variables. Client-side tracing (Faro) is Phase 6.

</domain>

<decisions>
## Implementation Decisions

### Trace Granularity
- Exclude health check endpoints (/api/health, /api/ready) from tracing
- Use head-based sampling at 10% rate
- Skip tracing for static asset requests (images, CSS, JS)
- Collapse internal Next.js framework spans to reduce noise

### Span Attributes
- No user-identifying information in spans — privacy-first
- Minimal request metadata: route, method, status code only
- Include content context: blog post slug and category when available
- Include Kubernetes metadata via downward API (pod name, namespace)

### Error Handling
- Include full stack traces in error spans for debugging
- Only 5xx responses mark spans as errors — 4xx are expected client behavior
- No custom slow-request flagging — rely on Tempo's duration queries
- Set span error status on exceptions, but don't duplicate as span events

### Service Identity
- Service name: `victorbona-blog`
- Version: Git commit SHA (short) — matches container image tags
- Environment: Derived from K8s namespace, not explicit attribute
- No code.filepath attributes — keep traces minimal

### Claude's Discretion
- OTEL SDK initialization patterns for Next.js
- Span processor configuration (batch vs simple)
- Exact attribute names following OTEL semantic conventions
- gRPC vs HTTP protocol for OTLP exporter

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches following OTEL and Next.js conventions.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-server-side-tracing*
*Context gathered: 2026-01-27*
