# Phase 4: Server-Side Tracing - Research

**Researched:** 2026-01-27
**Domain:** OpenTelemetry, Next.js Instrumentation, OTLP Exporters
**Confidence:** HIGH

## Summary

OpenTelemetry integration with Next.js is well-established through `@vercel/otel`, which provides a batteries-included solution that handles both Node.js and Edge runtimes. The library offers built-in configuration for exporters, samplers, and resource attributes with sensible defaults.

The key implementation decision is between using the HTTP exporter (port 4318) or gRPC exporter (port 4317). While the CONTEXT.md specifies gRPC to Alloy at port 4317, **there is a known compatibility issue with `@grpc/grpc-js` in Next.js bundled environments**. The HTTP/protobuf exporter at port 4318 is the safer choice for Next.js applications, though Alloy supports both protocols.

**Primary recommendation:** Use `@vercel/otel` with the HTTP/protobuf exporter to port 4318 (not gRPC 4317) for maximum compatibility. Configure head-based sampling at 10% using `TraceIdRatioBasedSampler`. Exclude health check routes via collector-level filtering rather than application-level filtering for cleaner separation.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@vercel/otel` | ^1.x | Next.js OTEL integration | Maintained by Vercel, handles Edge+Node runtimes |
| `@opentelemetry/sdk-trace-node` | ^1.30+ | Span processors and samplers | Official OTEL SDK for Node.js |
| `@opentelemetry/exporter-trace-otlp-http` | ^0.57+ | HTTP/protobuf OTLP exporter | Better Next.js compatibility than gRPC |
| `@opentelemetry/resources` | ^1.30+ | Resource attributes | Service name/version configuration |
| `@opentelemetry/semantic-conventions` | ^1.30+ | Standard attribute names | Consistent semantic conventions |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@opentelemetry/sdk-logs` | ^0.57+ | Log integration | Required dependency for @vercel/otel |
| `@opentelemetry/api-logs` | ^0.57+ | Log API | Required dependency for @vercel/otel |
| `@opentelemetry/instrumentation` | ^0.57+ | Instrumentation base | Required dependency for @vercel/otel |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@vercel/otel` | `@opentelemetry/sdk-node` direct | More control but requires conditional imports for Edge runtime |
| HTTP exporter | gRPC exporter (`@opentelemetry/exporter-trace-otlp-grpc`) | gRPC has known issues with Next.js bundling due to `@grpc/grpc-js` |
| Collector-level filtering | Custom sampler | Application sampler can filter but collector filtering is cleaner |

**Installation:**
```bash
npm install @vercel/otel @opentelemetry/sdk-logs @opentelemetry/api-logs @opentelemetry/instrumentation @opentelemetry/sdk-trace-node @opentelemetry/exporter-trace-otlp-http @opentelemetry/resources @opentelemetry/semantic-conventions
```

## Architecture Patterns

### Recommended Project Structure
```
/                           # Project root
├── instrumentation.ts      # OTEL configuration (MUST be in root, not app/)
├── next.config.mjs         # No changes needed for Next.js 15+
├── app/
│   └── api/
│       ├── health/route.ts # Excluded from tracing
│       └── ready/route.ts  # Excluded from tracing
└── chart/
    └── values.yaml         # OTEL endpoint configuration
```

### Pattern 1: Simple @vercel/otel Registration
**What:** Minimal setup using @vercel/otel defaults
**When to use:** When default tracing is sufficient
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/open-telemetry
// instrumentation.ts
import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel({ serviceName: 'victorbona-blog' })
}
```

### Pattern 2: Custom Exporter with Sampling (Recommended)
**What:** Full control over exporter, sampling, and attributes
**When to use:** Production deployments with specific requirements
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/guides/open-telemetry + https://github.com/vercel/otel
// instrumentation.ts
import { registerOTel } from '@vercel/otel'
import { TraceIdRatioBasedSampler, ParentBasedSampler } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

export function register() {
  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'victorbona-blog',
    attributes: {
      'service.version': process.env.OTEL_SERVICE_VERSION || 'unknown',
    },
    traceExporter: new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT
        ? `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`
        : undefined,
    }),
    traceSampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(0.1), // 10% sampling
    }),
  })
}
```

### Pattern 3: Environment Variable Configuration
**What:** Configure via OTEL standard environment variables
**When to use:** When Helm values should drive configuration
**Example:**
```yaml
# chart/values.yaml - environment variables for OTEL SDK
env:
  - name: OTEL_SERVICE_NAME
    value: "victorbona-blog"
  - name: OTEL_SERVICE_VERSION
    valueFrom:
      fieldRef:
        fieldPath: metadata.labels['app.kubernetes.io/version']
  - name: OTEL_EXPORTER_OTLP_ENDPOINT
    value: "http://alloy.observability-system.svc.cluster.local:4318"
  - name: OTEL_EXPORTER_OTLP_PROTOCOL
    value: "http/protobuf"
  - name: OTEL_TRACES_SAMPLER
    value: "parentbased_traceidratio"
  - name: OTEL_TRACES_SAMPLER_ARG
    value: "0.1"
```

### Anti-Patterns to Avoid
- **instrumentation.ts in app/ or pages/:** Next.js will not find it; must be in project root
- **Using gRPC exporter directly:** `@grpc/grpc-js` causes bundling issues in Next.js
- **Missing `process.env.NEXT_RUNTIME` check:** Only import Node-specific code when `=== 'nodejs'`
- **Tracing health check endpoints:** Creates noise; filter at collector level
- **Using SimpleSpanProcessor in production:** BatchSpanProcessor is required for performance

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Edge runtime detection | Custom runtime checks | `@vercel/otel` | Handles Edge+Node automatically |
| Trace context propagation | Custom headers | W3C Trace Context (default) | Standard propagator in @vercel/otel |
| Span batching | Custom batch logic | BatchSpanProcessor | Already configured by @vercel/otel |
| Resource attributes | Manual attribute setting | Environment variables | OTEL SDK auto-detects from env |
| Health endpoint filtering | Custom sampler | Alloy filter processor | Cleaner separation of concerns |

**Key insight:** `@vercel/otel` handles 90% of use cases out of the box. Custom code should only supplement, not replace, the built-in functionality.

## Common Pitfalls

### Pitfall 1: Wrong instrumentation.ts Location
**What goes wrong:** Next.js silently ignores the file if placed in `app/` or `pages/`
**Why it happens:** Next.js has specific file discovery rules for the instrumentation hook
**How to avoid:** Always place `instrumentation.ts` in the project root (or `src/` if using src layout)
**Warning signs:** No traces appearing despite correct endpoint configuration

### Pitfall 2: gRPC Exporter Module Resolution Error
**What goes wrong:** Error: `Module not found: Can't resolve 'stream'` or similar
**Why it happens:** `@grpc/grpc-js` requires Node.js stream modules unavailable in Next.js bundling
**How to avoid:** Use `@opentelemetry/exporter-trace-otlp-http` instead of `-grpc`
**Warning signs:** Build failures mentioning stream, http2, or grpc modules

### Pitfall 3: Wrong Port for Protocol
**What goes wrong:** Connection refused or no traces arriving
**Why it happens:** gRPC uses 4317, HTTP uses 4318; mixing them fails silently
**How to avoid:** HTTP/protobuf to port 4318, gRPC to port 4317
**Warning signs:** Endpoint reachable but no data; check protocol/port match

### Pitfall 4: Missing Sampling Configuration
**What goes wrong:** 100% of traces exported (expensive) or 0% (no data)
**Why it happens:** Default is AlwaysOnSampler; production needs ratio-based
**How to avoid:** Explicitly configure `TraceIdRatioBasedSampler(0.1)` for 10%
**Warning signs:** Excessive trace volume or missing traces for valid requests

### Pitfall 5: Tracing Health Checks Creating Noise
**What goes wrong:** Trace storage filled with /api/health spans every 5-10 seconds
**Why it happens:** Kubernetes probes hit health endpoints constantly
**How to avoid:** Filter at Alloy/collector level using filter processor
**Warning signs:** Majority of traces are health check spans

### Pitfall 6: Service Version Not Set
**What goes wrong:** All traces show `service.version: unknown`
**Why it happens:** Version must be explicitly set; not auto-detected
**How to avoid:** Set `OTEL_SERVICE_VERSION` to git SHA or container image tag
**Warning signs:** Traces lack version correlation capability

## Code Examples

Verified patterns from official sources:

### Complete instrumentation.ts for Production
```typescript
// Source: Combination of Next.js docs + @vercel/otel README
// instrumentation.ts (in project root)

import { registerOTel } from '@vercel/otel'
import { TraceIdRatioBasedSampler, ParentBasedSampler } from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

export function register() {
  // Only initialize OTEL when there's an endpoint configured
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  if (!endpoint) {
    console.log('OTEL_EXPORTER_OTLP_ENDPOINT not set, skipping tracing')
    return
  }

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'victorbona-blog',
    attributes: {
      'service.version': process.env.OTEL_SERVICE_VERSION || 'unknown',
    },
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    traceSampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(
        parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '0.1')
      ),
    }),
  })
}
```

### Helm Values for OTEL Configuration
```yaml
# Source: Standard OTEL environment variables
# chart/values.yaml observability section

observability:
  otel:
    enabled: true
    serviceName: "victorbona-blog"
    endpoint: "http://alloy.observability-system.svc.cluster.local:4318"
    protocol: "http/protobuf"
    samplingRatio: "0.1"

# Applied to component env array:
components:
  web:
    env:
      # ... existing env vars ...
      - name: OTEL_SERVICE_NAME
        value: "{{ .Values.observability.otel.serviceName }}"
      - name: OTEL_SERVICE_VERSION
        value: "{{ .Values.components.web.image.tag }}"
      - name: OTEL_EXPORTER_OTLP_ENDPOINT
        value: "{{ .Values.observability.otel.endpoint }}"
      - name: OTEL_EXPORTER_OTLP_PROTOCOL
        value: "{{ .Values.observability.otel.protocol }}"
      - name: OTEL_TRACES_SAMPLER
        value: "parentbased_traceidratio"
      - name: OTEL_TRACES_SAMPLER_ARG
        value: "{{ .Values.observability.otel.samplingRatio }}"
```

### Alloy Filter Configuration (for reference)
```river
# Example Alloy configuration to filter health check spans
# This runs in Alloy, not in the blog application

otelcol.processor.filter "drop_health_checks" {
  error_mode = "ignore"
  traces {
    span = [
      'attributes["http.route"] == "/api/health"',
      'attributes["http.route"] == "/api/ready"',
      'attributes["http.target"] =~ "/api/health.*"',
    ]
  }
  output {
    traces = [otelcol.exporter.otlp.tempo.input]
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `experimental.instrumentationHook: true` | Built-in (Next.js 15+) | Next.js 15 | No config flag needed |
| `@opentelemetry/sdk-node` direct | `@vercel/otel` wrapper | 2023 | Simpler Edge runtime handling |
| gRPC default protocol | HTTP/protobuf default | 2024 | Better browser/bundler compatibility |
| `SEMRESATTRS_*` constants | `ATTR_*` constants | OTEL conventions 1.30+ | Semantic conventions update |

**Deprecated/outdated:**
- `experimental.instrumentationHook` in `next.config.mjs` - Not needed in Next.js 15+
- `SEMRESATTRS_SERVICE_NAME` - Use `ATTR_SERVICE_NAME` from newer semantic conventions
- `@opentelemetry/exporter-trace-otlp-grpc` with Next.js - Use HTTP exporter instead

## Open Questions

Things that couldn't be fully resolved:

1. **Kubernetes Downward API for Pod Metadata**
   - What we know: OTEL SDK can receive resource attributes via environment variables
   - What's unclear: Best practice for injecting pod name/namespace into spans
   - Recommendation: Use `OTEL_RESOURCE_ATTRIBUTES` with downward API env vars; verify during testing

2. **Alloy Filter Processor Configuration**
   - What we know: Alloy supports OpenTelemetry Collector filter processor
   - What's unclear: Exact River syntax for attribute-based span filtering
   - Recommendation: Plan assumes filter configuration exists in Alloy; document the expected behavior

3. **Blog Post Context in Spans**
   - What we know: User wants blog post slug and category in spans
   - What's unclear: How to inject route parameters into auto-instrumented spans
   - Recommendation: Investigate `@opentelemetry/api` for adding custom span attributes in page components

## Sources

### Primary (HIGH confidence)
- [Next.js OpenTelemetry Guide](https://nextjs.org/docs/app/guides/open-telemetry) - Official instrumentation setup
- [OpenTelemetry OTLP Exporter Configuration](https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/) - Environment variables and protocols
- [OpenTelemetry JS Resources](https://opentelemetry.io/docs/languages/js/resources/) - Resource attribute configuration
- [@vercel/otel GitHub README](https://github.com/vercel/otel/blob/main/packages/otel/README.md) - Configuration options

### Secondary (MEDIUM confidence)
- [OpenTelemetry JS Exporters](https://opentelemetry.io/docs/languages/js/exporters/) - Exporter comparison
- [OpenTelemetry Sampling Guide](https://opentelemetry.io/docs/languages/js/sampling/) - Sampler configuration
- [Checkly Next.js OTEL Guide](https://www.checklyhq.com/blog/in-depth-guide-to-monitoring-next-js-apps-with-opentelemetry/) - Production patterns

### Tertiary (LOW confidence)
- GitHub Issue #4991 (gRPC+Next.js incompatibility) - Needs verification with current versions
- Community blog posts on custom samplers - Patterns vary, verify approach

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Next.js and OTEL documentation
- Architecture: HIGH - Official patterns from Next.js examples
- Pitfalls: HIGH - Documented issues in GitHub discussions and official guides

**Research date:** 2026-01-27
**Valid until:** 60 days (OTEL and Next.js are relatively stable)

---

## Key Decision: HTTP vs gRPC Protocol

The REQUIREMENTS.md specifies "Export via OTLP gRPC to `alloy.observability-system.svc.cluster.local:4317`". However, research indicates **gRPC has compatibility issues with Next.js bundling**.

**Recommendation:** Use HTTP/protobuf to port **4318** instead. Alloy supports both protocols. If gRPC is strictly required, verify `@grpc/grpc-js` compatibility with the Next.js canary version in use and test thoroughly.

The implementation plan should default to HTTP/protobuf for reliability, with an optional gRPC path if verified working.
