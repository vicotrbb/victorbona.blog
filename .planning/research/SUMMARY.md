# Project Research Summary

**Project:** victorbona.blog Kubernetes Deployment with Observability
**Domain:** Next.js containerization for Kubernetes with OTEL/Faro observability
**Researched:** 2026-01-26
**Confidence:** MEDIUM-HIGH

## Executive Summary

This project involves containerizing an existing Next.js blog (canary, App Router) for deployment to a home Kubernetes cluster with full observability stack integration. The recommended approach is a multi-stage Docker build with `output: 'standalone'`, server-side OpenTelemetry via `@vercel/otel` exporting to Alloy/Tempo, and Grafana Faro for browser RUM. The existing Helm chart already has excellent observability scaffolding that needs enabling rather than building.

The primary technical risks center on container networking (HOSTNAME binding, SIGTERM handling) and observability SDK initialization (Edge runtime incompatibility, Faro timing). These are well-documented pitfalls with clear prevention strategies. The GitOps workflow via ArgoCD is straightforward given the existing Helm chart infrastructure.

For a personal blog, the build should prioritize simplicity over scale. Avoid over-engineering with complex distributed tracing spans, APM SaaS, or real-time alerting. The existing Grafana stack (Tempo, Loki, Prometheus) provides sufficient observability. Focus phases on getting a working containerized deployment first, then layer observability incrementally.

## Key Findings

### Recommended Stack

The stack leverages official/maintained packages with minimal custom configuration.

**Core technologies:**
- **node:22-alpine + distroless runner**: Multi-stage build with 141MB production image, minimal CVEs
- **@vercel/otel ^2.1.0**: Official Next.js OTEL wrapper, handles Node.js/Edge runtime automatically
- **@grafana/faro-web-sdk ^2.0.0**: Browser RUM with Web Vitals v5 (INP), traces to existing Faro receiver
- **prom-client**: Prometheus metrics at `/metrics`, scraped by existing ServiceMonitor
- **GitHub Actions**: docker/build-push-action v6 to GHCR with multi-arch builds

**Critical version notes:**
- gRPC exporter uses port 4317 (not 4318), expects hostname:port only
- Faro v2 uses INP instead of deprecated FID for Web Vitals
- OpenTelemetry packages need version alignment (all ^0.205.0)

### Expected Features

**Must have (table stakes):**
- Structured JSON logs (auto-collected by Alloy DaemonSet)
- Server-side OTEL traces to Tempo
- Health endpoints for Kubernetes probes
- `/metrics` endpoint for Prometheus scraping

**Should have (differentiators):**
- Grafana Faro RUM (Core Web Vitals, JS errors)
- Node.js runtime metrics (memory, event loop lag)
- Service name and version in all telemetry

**Defer (v2+):**
- Frontend-backend trace correlation (high complexity)
- Custom business metrics
- Verbose span mode (debugging only)

**Anti-features (do NOT build):**
- APM SaaS integration
- 100% trace sampling
- Real-time alerting
- User session recording

### Architecture Approach

The architecture follows a clean separation: container image encapsulates the application, Helm chart defines Kubernetes resources, GitHub Actions handles CI/CD, and observability SDKs run within the application. Traffic flows through Cloudflare Tunnel to a ClusterIP Service, with telemetry exported to the existing Alloy/Tempo/Loki/Prometheus stack.

**Major components:**
1. **Dockerfile** — Multi-stage build producing standalone Next.js server
2. **Helm Chart** — Deployment, Service, ServiceMonitor, observability env vars
3. **GitHub Actions** — Build, push to GHCR, trigger ArgoCD sync
4. **instrumentation.ts** — Server-side OTEL SDK initialization
5. **FaroInit client component** — Browser RUM initialization
6. **/api/metrics route** — Prometheus metrics endpoint
7. **/api/health route** — Kubernetes probe target

### Critical Pitfalls

1. **SIGTERM handling** — Use `CMD ["node", "server.js"]` not `npm start`; npm doesn't forward signals causing 502s during deployments
2. **HOSTNAME binding** — Set `HOSTNAME=0.0.0.0` in Dockerfile; K8s sets it to container ID causing connection failures
3. **OTEL in Edge runtime** — Use conditional imports (`if (process.env.NEXT_RUNTIME === 'nodejs')`); NodeSDK crashes Edge routes
4. **Sharp missing** — Install sharp explicitly or set `images.unoptimized: true`; standalone doesn't include it
5. **Faro initialization timing** — Initialize before any client code; late init misses early errors and Web Vitals

## Implications for Roadmap

Based on research, suggested phase structure:

### Phase 1: Container Foundation
**Rationale:** Everything depends on a working container image. Dockerfile must be correct before any deployment.
**Delivers:** Multi-stage Dockerfile, next.config.mjs with `output: 'standalone'`, health endpoint
**Addresses:** Table stakes for deployment
**Avoids:** SIGTERM handling, HOSTNAME binding, Sharp missing pitfalls

### Phase 2: CI/CD Pipeline
**Rationale:** Need automated builds before iterating on deployment config
**Delivers:** GitHub Actions workflow building multi-arch images to GHCR
**Uses:** docker/build-push-action, docker/metadata-action
**Depends on:** Phase 1 Dockerfile

### Phase 3: Helm Values & Deployment
**Rationale:** Can't test observability without running pods
**Delivers:** Customized values.yaml enabling observability config sections, first ArgoCD deployment
**Uses:** Existing Helm chart scaffolding
**Avoids:** Missing health probes, missing resource limits pitfalls

### Phase 4: Server-Side Tracing
**Rationale:** Highest debugging value, auto-instrumentation covers most needs
**Delivers:** instrumentation.ts with OTEL SDK, traces flowing to Tempo
**Uses:** @vercel/otel, OTLP gRPC exporter
**Avoids:** Edge runtime errors, file location pitfalls

### Phase 5: Prometheus Metrics
**Rationale:** Enables dashboards and alerting via existing Prometheus/Grafana
**Delivers:** /api/metrics route, ServiceMonitor enabled
**Uses:** prom-client, existing ServiceMonitor templates

### Phase 6: Browser RUM (Optional)
**Rationale:** Nice-to-have for a blog; lower priority than server observability
**Delivers:** Faro client component, Web Vitals in Grafana
**Uses:** @grafana/faro-web-sdk
**Avoids:** Faro timing, CORS misconfiguration pitfalls

### Phase 7: Renovate Configuration
**Rationale:** Only configure after stable deployment; prevents churn during development
**Delivers:** renovate.json with ArgoCD file patterns, pinned dependencies
**Avoids:** ArgoCD files not detected, canary auto-merge pitfalls

### Phase Ordering Rationale

- **Phases 1-3 form deployment foundation**: Cannot iterate on observability without deployable container
- **Phase 4 before Phase 5**: Traces provide more debugging value than metrics for initial troubleshooting
- **Phase 6 optional**: Browser RUM is differentiator, not table stakes for a blog
- **Phase 7 last**: Automation after stability; Renovate on unstable setup creates noise

### Research Flags

Phases likely needing deeper research during planning:
- **Phase 4 (OTEL):** gRPC exporter configuration details may vary by OTEL version
- **Phase 6 (Faro):** CORS configuration depends on Alloy faro.receiver setup

Phases with standard patterns (skip research-phase):
- **Phase 1 (Dockerfile):** Well-documented Next.js standalone pattern
- **Phase 2 (CI/CD):** Standard GitHub Actions Docker workflow
- **Phase 3 (Helm):** Existing chart already has templates, just needs values
- **Phase 5 (Metrics):** Standard prom-client + ServiceMonitor pattern

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Official docs verified, @vercel/otel maintained by Vercel |
| Features | HIGH | Cross-referenced with existing Helm chart capabilities |
| Architecture | HIGH | Standard Kubernetes patterns, official docs |
| Pitfalls | HIGH | Multiple community sources confirmed each pitfall |

**Overall confidence:** MEDIUM-HIGH

### Gaps to Address

- **OpenTelemetry version alignment**: Verify peer dependencies during npm install; OTEL ecosystem has many packages
- **Faro exact versions**: npm registry not directly fetched; verify `npm info @grafana/faro-web-sdk` at implementation
- **Alloy CORS for Faro**: Requires Alloy-side configuration not covered in this research
- **NEXT_PUBLIC variables**: Strategy needed if any client config varies by environment (currently none identified)

## Sources

### Primary (HIGH confidence)
- [Next.js OpenTelemetry Guide](https://nextjs.org/docs/app/guides/open-telemetry) — OTEL setup, instrumentation.ts
- [Next.js Deployment Docs](https://nextjs.org/docs/app/getting-started/deploying) — standalone output, Docker
- [@vercel/otel npm](https://www.npmjs.com/package/@vercel/otel) — package API
- [Grafana Faro Web SDK](https://github.com/grafana/faro-web-sdk) — SDK features
- [Renovate ArgoCD Manager](https://docs.renovatebot.com/modules/manager/argocd/) — file pattern configuration

### Secondary (MEDIUM confidence)
- [Arcjet Security Advice](https://blog.arcjet.com/security-advice-for-self-hosting-next-js-in-docker/) — Docker best practices
- [Grafana Faro Next.js Example](https://github.com/grafana/faro-nextjs-example) — integration pattern
- [RisingStack Graceful Shutdown](https://blog.risingstack.com/graceful-shutdown-node-js-kubernetes/) — SIGTERM handling

### Tertiary (LOW confidence)
- Community blog posts on prom-client + Next.js App Router (common approach, verify compatibility)

---
*Research completed: 2026-01-26*
*Ready for roadmap: yes*
