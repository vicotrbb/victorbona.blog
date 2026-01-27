# Feature Landscape: Next.js Observability for Kubernetes

**Domain:** Production observability for Next.js blog deployed to Kubernetes
**Existing Stack:** Tempo (traces), Loki (logs), Prometheus (metrics), Grafana Faro (RUM), Alloy (collection)
**Researched:** 2026-01-26
**Overall Confidence:** HIGH (verified against official docs and existing Helm chart)

---

## Table Stakes

Features required for production-grade observability. Missing these means blind spots during incidents.

### Logging

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| Structured JSON logs | Alloy DaemonSet auto-scrapes pod stdout; JSON enables Loki queries | Low | Next.js outputs JSON by default in production mode |
| Request context in logs | Correlate logs to specific requests | Low | Use request ID or trace ID injection |
| Error stack traces | Debug production errors | Low | Captured automatically; ensure source maps deployed |

**Dependencies:** None - Alloy DaemonSet handles collection automatically.

**Helm Configuration Required:**
- Pod labels for Alloy scraping (likely already configured)
- No application-level config needed if using stdout

### Tracing

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| OpenTelemetry auto-instrumentation | Automatic spans for Next.js lifecycle (SSR, API routes, fetch) | Medium | Use `@vercel/otel` + `instrumentation.ts` |
| OTLP export to Tempo | Send traces to existing Tempo via Alloy | Low | Configure OTEL_EXPORTER_OTLP_ENDPOINT |
| Service name in traces | Identify this app in distributed traces | Low | Set OTEL_SERVICE_NAME env var |

**Dependencies:**
- Requires `experimental.instrumentationHook: true` in next.config.mjs (Next.js 15+ may not need this)
- OTLP endpoint must be reachable (Alloy svc in cluster)

**Helm Configuration Required:**
```yaml
observability:
  otel:
    enabled: true
    serviceName: "victorbona-blog"
    endpoint: "http://alloy.observability-system.svc.cluster.local:4318"
    protocol: "http/protobuf"
```

### Metrics

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| `/metrics` endpoint | Prometheus scraping via ServiceMonitor | Medium | Use `prom-client` or OTEL Prometheus exporter |
| HTTP request metrics | Request count, latency histograms, error rates | Medium | Auto-instrumented or middleware-based |
| Node.js runtime metrics | Memory, CPU, event loop lag, GC | Low | `prom-client.collectDefaultMetrics()` |

**Dependencies:**
- ServiceMonitor/PodMonitor already exists in Helm chart
- Need to add metrics port to container

**Helm Configuration Required:**
```yaml
components:
  api:
    metrics:
      enabled: true
      portName: http  # or separate metrics port
      path: /metrics
```

---

## Differentiators

Features that enhance debugging experience. Not strictly required, but valuable for a well-instrumented production app.

### Browser RUM (Real User Monitoring)

| Feature | Value Proposition | Complexity | Implementation Notes |
|---------|-------------------|------------|---------------------|
| Grafana Faro integration | Core Web Vitals (LCP, CLS, INP), frontend errors, user sessions | Medium | `@grafana/faro-web-sdk` client component |
| Frontend-backend trace correlation | Link browser spans to server spans for full request lifecycle | High | Requires middleware to inject traceparent into response headers |
| Page load performance | Real user LCP, TTFB measurements | Medium | Faro captures Web Vitals v5 automatically |
| JavaScript error tracking | Catch unhandled exceptions, promise rejections | Low | Faro console instrumentation |

**Dependencies:**
- Faro collector endpoint (Alloy with faro receiver or Grafana Cloud)
- Client-side initialization (must be client component in App Router)
- CORS configuration if Faro endpoint is cross-origin

**Helm Configuration Required:**
```yaml
# Environment variables for frontend
env:
  - name: NEXT_PUBLIC_FARO_URL
    value: "https://faro-collector.example.com/collect"
  - name: NEXT_PUBLIC_FARO_APP_NAME
    value: "victorbona-blog"
```

### Advanced Tracing

| Feature | Value Proposition | Complexity | Implementation Notes |
|---------|-------------------|------------|---------------------|
| Custom spans for business logic | Trace specific operations (MDX parsing, RSS generation) | Low | `trace.getTracer().startActiveSpan()` |
| Verbose span mode | See all Next.js internal spans (routing, rendering) | Low | Set `NEXT_OTEL_VERBOSE=1` |
| Trace sampling (production) | Reduce costs while maintaining visibility | Low | Configure 10% sampling for production |

### Enhanced Metrics

| Feature | Value Proposition | Complexity | Implementation Notes |
|---------|-------------------|------------|---------------------|
| Custom business metrics | Track page views, RSS subscribers, etc. | Low | Create custom Prometheus counters/gauges |
| Build-time metadata | Version, commit SHA in metrics labels | Low | Inject via env vars at build time |

---

## Anti-Features

Features to explicitly NOT build. Common over-engineering patterns for a personal blog.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| APM SaaS integration (Datadog, New Relic) | Expensive, overkill for personal blog; you already have Grafana stack | Use existing Tempo/Loki/Prometheus |
| 100% trace sampling in production | Generates excessive data, no value for low-traffic blog | Use 10-25% sampling or ratio-based |
| Custom distributed tracing spans | Blog has no microservices; single Next.js app | Rely on auto-instrumentation |
| Real-time alerting | Personal blog doesn't need PagerDuty at 3am | Use Grafana dashboards for async review |
| User session recording | Privacy concerns, no analytics value for blog | Aggregate RUM metrics only |
| Synthetic monitoring | Expensive for hobby project | Use uptime check from home lab or free tier |
| Log aggregation with ML anomaly detection | Overkill; simple grep in Loki is sufficient | Query Loki directly |
| OpenTelemetry Collector sidecar | Alloy DaemonSet already handles collection | Use existing cluster infrastructure |
| Separate metrics port | Adds complexity; blog traffic is low | Expose `/metrics` on same port as app |
| Custom instrumentation SDK wrapper | Over-abstraction for single app | Use `@vercel/otel` directly |

---

## Feature Dependencies

```
                    +------------------+
                    |  next.config.mjs |
                    | instrumentationHook |
                    +--------+---------+
                             |
              +--------------+--------------+
              |                             |
    +---------v---------+         +---------v---------+
    | instrumentation.ts|         |   Faro Client     |
    |   (Server OTEL)   |         |   Component       |
    +---------+---------+         +---------+---------+
              |                             |
    +---------v---------+         +---------v---------+
    | Traces to Tempo   |         | RUM to Faro/Alloy |
    | via OTLP          |         | via HTTP          |
    +-------------------+         +-------------------+

    +---------+---------+
    | /metrics endpoint |
    | (prom-client)     |
    +---------+---------+
              |
    +---------v---------+
    | ServiceMonitor    |
    | scrapes Prometheus|
    +-------------------+
```

**Dependency Notes:**
- Logs require no application changes (Alloy DaemonSet handles)
- Traces require `instrumentation.ts` + OTEL packages
- Metrics require `/metrics` route + prom-client
- RUM requires client component + Faro packages
- Frontend-backend correlation requires both tracing AND RUM, plus middleware

---

## MVP Recommendation

For initial observability milestone, prioritize in this order:

### Phase 1: Tracing (Highest Value)
1. **Server-side OpenTelemetry** - `@vercel/otel` + `instrumentation.ts`
2. **OTLP export to Alloy** - Configure endpoint via env vars
3. **Helm values** - Enable OTEL config section

*Rationale:* Traces provide the most debugging value. Auto-instrumentation covers request lifecycle. Minimal code changes required.

### Phase 2: Metrics
1. **Add prom-client** - Default metrics + request histogram
2. **Create /api/metrics route** - Expose for Prometheus
3. **Enable ServiceMonitor** - Already in Helm chart, just enable

*Rationale:* Metrics enable alerting and dashboards. Works with existing Prometheus + ServiceMonitor templates.

### Phase 3: Browser RUM (Optional)
1. **Add Faro client component** - Initialize in layout
2. **Configure Faro endpoint** - Via NEXT_PUBLIC env vars
3. **Add middleware for trace correlation** - If full-stack tracing desired

*Rationale:* RUM is nice-to-have for a blog. Core Web Vitals are useful but not critical for debugging. Higher complexity due to client/server boundary.

**Defer to post-MVP:**
- Custom business metrics
- Frontend-backend trace correlation (High complexity)
- Verbose span mode (debugging only)

---

## Helm Configuration Summary

The existing Helm chart already has excellent observability scaffolding. Required additions:

### Already Present (Enable Only)
- `observability.otel.*` - Full OTEL configuration
- `observability.serviceMonitor.*` - Prometheus scraping
- `observability.podMonitor.*` - Alternative scraping
- `components.*.metrics.*` - Per-component metrics config

### May Need Addition
- Faro-specific environment variables (`NEXT_PUBLIC_FARO_*`)
- Separate metrics port if needed (likely not - use same port)

---

## Sources

### HIGH Confidence (Official Documentation)
- [Next.js OpenTelemetry Guide](https://nextjs.org/docs/app/guides/open-telemetry) - Official setup instructions, package requirements
- [Grafana Faro Web SDK](https://github.com/grafana/faro-web-sdk) - Official SDK features and architecture
- [Grafana Faro Next.js Example](https://github.com/grafana/faro-nextjs-example) - Official integration pattern

### MEDIUM Confidence (Verified Community Sources)
- [prom-client npm](https://www.npmjs.com/package/prom-client) - Node.js Prometheus client
- [OpenTelemetry Context Propagation](https://opentelemetry.io/docs/concepts/context-propagation/) - W3C trace context standard
- [Core Web Vitals 2025](https://web.dev/articles/vitals) - INP replaced FID as of March 2024

### LOW Confidence (WebSearch Only - Verify Before Implementation)
- Custom Next.js metrics patterns from blog posts
- prom-client + Next.js API route patterns (common approach but verify compatibility with App Router)
