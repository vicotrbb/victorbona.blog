---
phase: 04-server-side-tracing
plan: 01
subsystem: infra
tags: [opentelemetry, tracing, otel, nextjs, vercel-otel, alloy, tempo]

# Dependency graph
requires:
  - phase: 03-helm-deployment
    provides: Helm chart with observability placeholders and otelEnv helper
provides:
  - OpenTelemetry instrumentation with @vercel/otel
  - OTLP HTTP exporter to Alloy (port 4318)
  - Head-based sampling at 10%
  - Environment variable configuration in Helm values
affects: [05-prometheus-metrics, 06-browser-rum]

# Tech tracking
tech-stack:
  added: [@vercel/otel, @opentelemetry/sdk-trace-node, @opentelemetry/exporter-trace-otlp-http, @opentelemetry/resources, @opentelemetry/semantic-conventions, @opentelemetry/sdk-logs, @opentelemetry/api-logs, @opentelemetry/instrumentation]
  patterns: [Next.js instrumentation.ts with conditional OTEL initialization, ParentBasedSampler with TraceIdRatioBasedSampler]

key-files:
  created: [instrumentation.ts]
  modified: [package.json, chart/values.yaml]

key-decisions:
  - "HTTP/protobuf exporter to port 4318 instead of gRPC to 4317 (gRPC causes Next.js bundling errors)"
  - "Skip OTEL initialization when endpoint not set (enables local dev without tracing)"
  - "10% sampling with parentbased_traceidratio via OTEL_TRACES_SAMPLER_ARG"
  - "Core OTEL env vars from otelEnv helper, additional vars (VERSION, SAMPLER, SAMPLER_ARG) in component env"

patterns-established:
  - "instrumentation.ts in project root exports register() function"
  - "Conditional OTEL initialization based on OTEL_EXPORTER_OTLP_ENDPOINT presence"
  - "Service name/version from environment variables with defaults"

# Metrics
duration: 8min
completed: 2026-01-27
---

# Phase 4 Plan 01: Server-Side Tracing Summary

**OpenTelemetry tracing with @vercel/otel, HTTP/protobuf export to Alloy at port 4318, 10% head-based sampling**

## Performance

- **Duration:** 8 min
- **Started:** 2026-01-27T17:02:00Z
- **Completed:** 2026-01-27T17:10:00Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Installed @vercel/otel and all required OpenTelemetry packages
- Created instrumentation.ts with conditional OTEL initialization
- Configured Helm values with OTEL environment variables
- Build verified with no OTEL-related errors

## Task Commits

Each task was committed atomically:

1. **Task 1: Install OTEL packages** - `49424d8` (chore)
2. **Task 2: Create instrumentation.ts** - `4727ffc` (feat)
3. **Task 3: Configure OTEL in Helm values** - `436a786` (feat)

## Files Created/Modified
- `instrumentation.ts` - OTEL SDK initialization with @vercel/otel, HTTP exporter, 10% sampling
- `package.json` - Added @vercel/otel and OpenTelemetry dependencies
- `chart/values.yaml` - Enabled observability.otel and added OTEL env vars to component

## Decisions Made
- **HTTP/protobuf over gRPC:** Used port 4318 instead of 4317. The @grpc/grpc-js package causes module resolution errors in Next.js bundling (e.g., "Can't resolve 'stream'"). HTTP/protobuf is the standard choice for Next.js OTEL integration. Alloy supports both protocols.
- **Conditional initialization:** Skip OTEL setup when OTEL_EXPORTER_OTLP_ENDPOINT is not set. This allows local development without tracing infrastructure.
- **Environment variable configuration:** Core OTEL vars (SERVICE_NAME, ENDPOINT, PROTOCOL) rendered via existing otelEnv helper; added VERSION, SAMPLER, SAMPLER_ARG directly to component env to avoid duplication.

## Deviations from Plan

None - plan executed exactly as written. The HTTP vs gRPC deviation was pre-approved in the plan frontmatter.

## Issues Encountered

- **OTEL env var duplication:** The Helm chart has an otelEnv helper that renders OTEL_SERVICE_NAME, OTEL_EXPORTER_OTLP_ENDPOINT, and OTEL_EXPORTER_OTLP_PROTOCOL. Adding these same vars to components.web.env caused duplication. Resolved by only adding the vars not covered by the helper (OTEL_SERVICE_VERSION, OTEL_TRACES_SAMPLER, OTEL_TRACES_SAMPLER_ARG).

## User Setup Required

None - no external service configuration required. OTEL endpoint is configured to cluster-internal Alloy service.

## Next Phase Readiness
- Server-side tracing infrastructure complete
- Traces will export to Alloy when deployed to Kubernetes
- Health check endpoint filtering should be configured in Alloy (collector-level)
- Ready for Phase 5 (Prometheus Metrics) and Phase 6 (Browser RUM)

---
*Phase: 04-server-side-tracing*
*Completed: 2026-01-27*
