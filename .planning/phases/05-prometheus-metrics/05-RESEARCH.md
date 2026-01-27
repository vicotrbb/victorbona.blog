# Phase 5: Prometheus Metrics - Research

**Researched:** 2026-01-27
**Domain:** Prometheus metrics exposition for Node.js/Next.js applications
**Confidence:** HIGH

## Summary

This research covers implementing Prometheus metrics exposition in a Next.js application using prom-client, the standard Node.js Prometheus client library. The implementation involves creating a `/metrics` API route that exposes default Node.js runtime metrics, using a singleton pattern to handle Next.js HMR in development, and enabling the existing ServiceMonitor in the Helm chart.

The key challenge is handling Next.js's Hot Module Replacement (HMR) in development mode, which can cause duplicate metric registration errors. The standard solution is the `globalThis` pattern, which caches the registry instance across HMR cycles.

**Primary recommendation:** Use prom-client v15.x with `collectDefaultMetrics()`, implement a globalThis singleton pattern for HMR resilience, expose metrics at `/metrics` with `text/plain` content type, and enable the existing ServiceMonitor by setting `metrics.enabled: true` and `observability.serviceMonitor.enabled: true` in values.yaml.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| prom-client | ^15.1.3 | Prometheus client for Node.js | Official Prometheus client, 3.4k GitHub stars, actively maintained |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none required) | - | - | prom-client is self-contained |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| prom-client | @opentelemetry/exporter-prometheus | OTEL approach requires separate metrics port (9464), more complex setup; prom-client integrates with existing HTTP server |
| Manual metrics | express-prom-bundle | Would require custom server; user decided on Next.js API route approach |

**Installation:**
```bash
npm install prom-client@^15.1.3
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── api/
│   └── metrics/
│       └── route.ts       # Metrics endpoint (new)
└── lib/
    └── metrics.ts         # Singleton registry module (new)
```

### Pattern 1: GlobalThis Singleton for Metrics Registry
**What:** Store the prom-client registry in `globalThis` to survive HMR cycles
**When to use:** Always in Next.js applications to prevent duplicate metric registration
**Example:**
```typescript
// Source: https://github.com/vercel/next.js/discussions/55263
// app/lib/metrics.ts
import { Registry, collectDefaultMetrics } from 'prom-client'

declare global {
  var metricsRegistry: Registry | undefined
}

function createRegistry(): Registry {
  const registry = new Registry()

  collectDefaultMetrics({
    register: registry,
    // No prefix - use standard names like nodejs_heap_size_bytes
  })

  return registry
}

// Use globalThis in development for HMR resilience
// In production, module caching handles singleton naturally
export const metricsRegistry =
  global.metricsRegistry || createRegistry()

if (process.env.NODE_ENV !== 'production') {
  global.metricsRegistry = metricsRegistry
}
```

### Pattern 2: Metrics API Route Handler
**What:** Next.js API route that serves metrics in Prometheus text format
**When to use:** For the `/metrics` endpoint
**Example:**
```typescript
// Source: https://github.com/siimon/prom-client
// app/api/metrics/route.ts
import { metricsRegistry } from '@/lib/metrics'

export async function GET() {
  try {
    const metrics = await metricsRegistry.metrics()
    return new Response(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    return new Response('Metrics collection failed', {
      status: 503,
    })
  }
}
```

### Anti-Patterns to Avoid
- **Creating registry in route handler:** Causes duplicate registration on every request
- **Using `register.clear()` to work around duplicates:** Loses accumulated metrics data
- **Not using globalThis in development:** Leads to "metric already registered" errors during HMR
- **Custom prefix without good reason:** Standard metric names (`nodejs_*`) are expected by dashboards

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Node.js runtime metrics | Manual gauges for heap, CPU | `collectDefaultMetrics()` | Covers 13+ metrics including heap, GC, event loop, handles |
| Metric formatting | String concatenation | `registry.metrics()` | Handles Prometheus text format correctly |
| Content-Type header | Hardcoded string | `Registry.PROMETHEUS_CONTENT_TYPE` | Ensures compatibility with Prometheus scrapers |
| ServiceMonitor YAML | Manual scrape configs | Helm chart template | Already exists, just needs enabling |

**Key insight:** prom-client's `collectDefaultMetrics()` provides comprehensive Node.js observability out of the box. Custom metrics are a separate concern (not in this phase).

## Common Pitfalls

### Pitfall 1: Duplicate Metric Registration During HMR
**What goes wrong:** Error "A metric with the name X has already been registered"
**Why it happens:** Next.js HMR reloads modules, re-executing metric registration code
**How to avoid:** Use globalThis singleton pattern; store registry in global scope for development mode
**Warning signs:** Works in production but errors in `npm run dev`

### Pitfall 2: ServiceMonitor Selector Mismatch
**What goes wrong:** Prometheus doesn't discover the metrics endpoint
**Why it happens:** ServiceMonitor `selector.matchLabels` doesn't match Service labels
**How to avoid:** Ensure ServiceMonitor selector uses same labels as Service (the Helm template already handles this via `selectorLabels` helper)
**Warning signs:** ServiceMonitor exists but no targets appear in Prometheus

### Pitfall 3: Wrong Content-Type Header
**What goes wrong:** Prometheus fails to parse metrics or shows warnings
**Why it happens:** Using `application/json` or wrong text encoding
**How to avoid:** Use `text/plain; charset=utf-8` or `Registry.PROMETHEUS_CONTENT_TYPE`
**Warning signs:** Prometheus scrape errors or empty metrics

### Pitfall 4: Metrics Path vs Convention
**What goes wrong:** Prometheus can't find metrics at expected path
**Why it happens:** Using `/api/metrics` instead of `/metrics`
**How to avoid:** Use standard `/metrics` path (as decided in CONTEXT.md); the existing values.yaml already configures `path: /metrics`
**Warning signs:** 404 errors in Prometheus scrape logs

### Pitfall 5: Failing to Return 503 on Collection Error
**What goes wrong:** Prometheus records successful scrape with no data
**Why it happens:** Swallowing errors and returning empty 200 response
**How to avoid:** Catch errors from `registry.metrics()` and return 503 Service Unavailable
**Warning signs:** Prometheus shows successful scrapes but metrics are missing

## Code Examples

Verified patterns from official sources:

### Complete Metrics Module
```typescript
// Source: https://github.com/siimon/prom-client + Next.js patterns
// app/lib/metrics.ts
import { Registry, collectDefaultMetrics } from 'prom-client'

declare global {
  var metricsRegistry: Registry | undefined
}

function initializeMetrics(): Registry {
  const registry = new Registry()

  // Set default labels for all metrics
  registry.setDefaultLabels({
    app: 'victorbona-blog',
  })

  // Collect default Node.js metrics
  // - process_cpu_user_seconds_total
  // - process_cpu_system_seconds_total
  // - process_start_time_seconds
  // - process_resident_memory_bytes
  // - nodejs_eventloop_lag_seconds
  // - nodejs_eventloop_lag_min_seconds
  // - nodejs_eventloop_lag_max_seconds
  // - nodejs_eventloop_lag_mean_seconds
  // - nodejs_eventloop_lag_stddev_seconds
  // - nodejs_eventloop_lag_p50_seconds
  // - nodejs_eventloop_lag_p90_seconds
  // - nodejs_eventloop_lag_p99_seconds
  // - nodejs_active_handles_total
  // - nodejs_active_requests_total
  // - nodejs_heap_size_total_bytes
  // - nodejs_heap_size_used_bytes
  // - nodejs_external_memory_bytes
  // - nodejs_gc_duration_seconds (histogram)
  // - nodejs_version_info
  collectDefaultMetrics({
    register: registry,
    // eventLoopMonitoringPrecision defaults to 10ms
  })

  return registry
}

// Singleton pattern for HMR resilience
export const metricsRegistry =
  global.metricsRegistry ?? initializeMetrics()

if (process.env.NODE_ENV !== 'production') {
  global.metricsRegistry = metricsRegistry
}
```

### Complete Route Handler
```typescript
// Source: https://github.com/siimon/prom-client
// app/api/metrics/route.ts (note: Next.js will serve at /api/metrics)
// For /metrics path, use app/metrics/route.ts

import { metricsRegistry } from '@/lib/metrics'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const metrics = await metricsRegistry.metrics()

    return new Response(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Metrics collection failed:', error)
    return new Response('Service Unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}
```

### Values.yaml Configuration
```yaml
# Source: Existing chart/values.yaml structure
components:
  web:
    metrics:
      enabled: true          # Enable metrics for this component
      portName: http         # Use existing HTTP port
      path: /metrics         # Standard Prometheus path
      interval: 30s          # Per CONTEXT.md decision
      scrapeTimeout: 10s     # Per CONTEXT.md decision

observability:
  serviceMonitor:
    enabled: true            # Enable ServiceMonitor creation
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Callback-based push gateway | Promise-based push gateway | prom-client v15.0.0 (Oct 2023) | Breaking change if using push gateway |
| Stable eventloop_lag metrics | Reset-on-observe eventloop_lag | prom-client v15.0.0 (Oct 2023) | More responsive to recent changes |
| Node.js 14 support | Node.js 16+ only | prom-client v15.0.0 (Oct 2023) | Project uses Node 22, compatible |

**Deprecated/outdated:**
- prom-client v14.x: Dropped support in v15, use v15.1.3+
- `promClient.register.metrics()` synchronous call: Now async, use `await registry.metrics()`

## Open Questions

Things that couldn't be fully resolved:

1. **Per-pod vs aggregated metrics**
   - What we know: Each pod exposes its own metrics; Prometheus handles aggregation via `sum()`, `avg()` queries
   - What's unclear: None - per-pod is the standard pattern
   - Recommendation: Use per-pod metrics (default behavior), aggregation happens at query time

2. **Optimal eventLoopMonitoringPrecision**
   - What we know: Default is 10ms, lower = more accurate but higher CPU overhead
   - What's unclear: Ideal value for this workload
   - Recommendation: Use default 10ms initially, tune if needed based on observability vs overhead

## Sources

### Primary (HIGH confidence)
- [prom-client GitHub](https://github.com/siimon/prom-client) - API documentation, default metrics, registry patterns
- [prom-client releases](https://github.com/siimon/prom-client/releases) - Version 15.1.3 confirmed as latest
- [Next.js discussions #55263](https://github.com/vercel/next.js/discussions/55263) - Singleton pattern for route handlers
- [Next.js discussions #39401](https://github.com/vercel/next.js/discussions/39401) - Prometheus integration patterns

### Secondary (MEDIUM confidence)
- [Prometheus Operator ServiceMonitor](https://observability.thomasriley.co.uk/prometheus/configuring-prometheus/using-service-monitors/) - ServiceMonitor configuration best practices
- [prometheus-operator examples](https://github.com/prometheus-operator/prometheus-operator/blob/main/example/user-guides/getting-started/example-app-service-monitor.yaml) - Official ServiceMonitor examples

### Tertiary (LOW confidence)
- None - all critical findings verified with primary sources

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - prom-client is the de facto standard, version verified
- Architecture: HIGH - globalThis pattern is well-documented for Next.js
- Pitfalls: HIGH - verified through official issues and documentation

**Research date:** 2026-01-27
**Valid until:** 60 days (prom-client is stable, v15.1.3 released June 2024)
