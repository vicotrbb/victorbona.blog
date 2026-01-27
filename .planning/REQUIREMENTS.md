# Requirements

**Project:** victorbona.blog Kubernetes Migration
**Version:** v1.0
**Created:** 2026-01-26

## Overview

This document captures scoped requirements for migrating the blog from Vercel to a self-hosted Kubernetes cluster with full observability integration.

---

## Infrastructure Requirements

### REQ-INF-001: Docker Image
**Priority:** Must Have
**Category:** Container Foundation
**Status:** Complete (Phase 1)

The blog must be containerized using an optimized multi-stage Docker build:
- Base: `node:22-alpine` for build stage
- Runner: Minimal production image with standalone output
- HOSTNAME=0.0.0.0 for Kubernetes networking
- Signal handling via direct `node server.js` (not npm)
- Image size target: <150MB

### REQ-INF-002: Health Endpoints
**Priority:** Must Have
**Category:** Container Foundation
**Status:** Complete (Phase 1)

Kubernetes-compatible health endpoints:
- `/api/health` — Liveness probe (returns 200 if process running)
- `/api/ready` — Readiness probe (returns 200 when ready to serve traffic)

### REQ-INF-003: GitHub Actions CI/CD
**Priority:** Must Have
**Category:** CI/CD Pipeline
**Status:** Complete (Phase 2)

Automated build pipeline:
- Trigger on push to main branch
- Multi-architecture builds (amd64, arm64)
- Push to GHCR at `ghcr.io/vicotrbb/victorbona.blog`
- Tag with git SHA and `latest`

### REQ-INF-004: Helm Chart Customization
**Priority:** Must Have
**Category:** Deployment
**Status:** Complete (Phase 3)

Customize existing Helm chart at `/chart`:
- Single-service blog deployment
- Configurable image repository and tag
- Resource limits and requests
- All observability settings via values.yaml

### REQ-INF-005: Cloudflare Tunnel Ingress
**Priority:** Must Have
**Category:** Deployment
**Status:** Complete (Phase 3)

Ingress configuration for Cloudflare Tunnel:
- Support both `victorbona.dev` and `blog.victorbona.dev` domains
- No TLS configuration (handled by Cloudflare)
- ClusterIP service (no LoadBalancer/NodePort needed)

---

## Observability Requirements

### REQ-OBS-001: Structured Logging
**Priority:** Must Have
**Category:** Observability

JSON-formatted logs for Loki ingestion:
- Logs to stdout (auto-collected by Alloy DaemonSet)
- Include request context where available
- No custom log configuration needed (Alloy handles collection)

### REQ-OBS-002: Server-Side Tracing
**Priority:** Must Have
**Category:** Observability

OpenTelemetry traces to Tempo:
- Use `@vercel/otel` for Next.js integration
- Export via OTLP gRPC to `alloy.observability-system.svc.cluster.local:4317`
- Service name and version in all spans
- Configurable endpoint via Helm values

### REQ-OBS-003: Prometheus Metrics
**Priority:** Must Have
**Category:** Observability

Metrics endpoint for Prometheus scraping:
- `/api/metrics` route exposing prom-client metrics
- Default Node.js runtime metrics (memory, event loop)
- ServiceMonitor enabled in Helm chart
- Configurable scrape interval

### REQ-OBS-004: Browser RUM (Faro)
**Priority:** Should Have
**Category:** Observability

Grafana Faro for Real User Monitoring:
- Core Web Vitals (LCP, CLS, INP)
- JavaScript error tracking
- Export to `faro.bonalab.org`
- Configurable endpoint via Helm values
- Client-side initialization in root layout

---

## Automation Requirements

### REQ-AUTO-001: Renovate Configuration
**Priority:** Should Have
**Category:** Automation

Automated dependency updates:
- renovate.json in repository root
- ArgoCD file pattern recognition (`chart/**`)
- Pin canary/alpha dependencies (no auto-merge)
- Group minor/patch updates
- Auto-merge for non-breaking patches

---

## Out of Scope (v1)

The following are explicitly deferred:

- **Frontend-backend trace correlation** — High complexity, defer to v2
- **Custom business metrics** — Not needed for personal blog
- **100% trace sampling** — Use probabilistic sampling
- **Real-time alerting** — Monitor dashboards sufficient for v1
- **User session recording** — Privacy concerns, not needed
- **APM SaaS integration** — Using self-hosted stack only
- **Multi-replica scaling** — Single replica sufficient
- **Database integration** — Blog is static, no database needed

---

## Acceptance Criteria

### Deployment Success
- [ ] Docker image builds successfully via GitHub Actions
- [ ] Image pushed to GHCR with correct tags
- [ ] ArgoCD syncs and deploys to cluster
- [ ] Blog accessible at victorbona.dev and blog.victorbona.dev
- [ ] Health probes pass (liveness and readiness)

### Observability Success
- [ ] Traces visible in Grafana Tempo
- [ ] Logs visible in Grafana Loki
- [ ] Metrics scrapable at /api/metrics
- [ ] ServiceMonitor working with Prometheus
- [ ] Faro RUM data in Grafana (if enabled)

### Automation Success
- [ ] Renovate creates PRs for dependency updates
- [ ] ArgoCD file changes detected by Renovate

---

*Requirements defined: 2026-01-26*
*Ready for roadmap: yes*
