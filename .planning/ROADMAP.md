# Roadmap

**Project:** victorbona.blog Kubernetes Migration
**Milestone:** v1.0 — Production Deployment
**Created:** 2026-01-26

---

## Milestone Overview

Migrate the Next.js blog from Vercel to a self-hosted Kubernetes cluster with full observability integration. The milestone follows a dependency-driven sequence: containerization → CI/CD → deployment → observability → automation.

---

## Phase 1: Container Foundation

**Goal:** Create a production-ready Docker image for the Next.js blog

**Plans:** 2 plans

Plans:
- [ ] 01-01-PLAN.md — Configure standalone output and health endpoints
- [ ] 01-02-PLAN.md — Create Dockerfile and verify build

**Delivers:**
- Multi-stage Dockerfile with standalone output
- next.config.mjs with `output: 'standalone'`
- Health endpoint at `/api/health`
- Readiness endpoint at `/api/ready`

**Requirements Addressed:**
- REQ-INF-001: Docker Image
- REQ-INF-002: Health Endpoints

**Key Files:**
- `Dockerfile` (new)
- `next.config.mjs` (modify)
- `app/api/health/route.ts` (new)
- `app/api/ready/route.ts` (new)
- `.dockerignore` (new)

**Critical Pitfalls:**
- Use `CMD ["node", "server.js"]` not `npm start` (SIGTERM handling)
- Set `HOSTNAME=0.0.0.0` in Dockerfile
- Install sharp explicitly for image optimization

**Dependencies:** None (first phase)

---

## Phase 2: CI/CD Pipeline

**Goal:** Automate Docker image builds and push to GHCR

**Delivers:**
- GitHub Actions workflow for Docker builds
- Multi-architecture support (amd64, arm64)
- Automatic tagging with git SHA and `latest`
- Push to `ghcr.io/vicotrbb/victorbona.blog`

**Requirements Addressed:**
- REQ-INF-003: GitHub Actions CI/CD

**Key Files:**
- `.github/workflows/build.yml` (new)

**Critical Pitfalls:**
- Use docker/build-push-action@v6 for caching
- Configure GHCR authentication properly
- Enable multi-platform builds with QEMU

**Dependencies:** Phase 1 (Dockerfile must exist)

---

## Phase 3: Helm Chart & Deployment

**Goal:** Configure Helm chart for ArgoCD deployment

**Delivers:**
- Customized values.yaml for blog deployment
- ClusterIP service configuration
- Resource limits and requests
- Health probe configuration
- Observability environment variables (placeholders)

**Requirements Addressed:**
- REQ-INF-004: Helm Chart Customization
- REQ-INF-005: Cloudflare Tunnel Ingress

**Key Files:**
- `chart/values.yaml` (modify)
- `chart/templates/deployment.yaml` (verify/modify)
- `chart/templates/service.yaml` (verify/modify)

**Critical Pitfalls:**
- Ensure HOSTNAME env var is set in deployment
- Configure probes with correct paths and ports
- No ingress TLS (Cloudflare handles it)

**Dependencies:** Phase 2 (need image in GHCR to deploy)

---

## Phase 4: Server-Side Tracing

**Goal:** Enable OpenTelemetry traces to Tempo via Alloy

**Delivers:**
- instrumentation.ts with OTEL SDK configuration
- OTLP gRPC exporter to Alloy
- Service name and version in spans
- Helm values for OTEL configuration

**Requirements Addressed:**
- REQ-OBS-002: Server-Side Tracing

**Key Files:**
- `instrumentation.ts` (new, project root)
- `package.json` (add @vercel/otel, OTEL packages)
- `chart/values.yaml` (add OTEL env vars)

**Critical Pitfalls:**
- instrumentation.ts must be in project root (not app/)
- Use conditional imports for Edge runtime compatibility
- gRPC port is 4317 (not 4318)

**Dependencies:** Phase 3 (need running deployment to verify)

---

## Phase 5: Prometheus Metrics

**Goal:** Expose metrics endpoint for Prometheus scraping

**Delivers:**
- /api/metrics route with prom-client
- Default Node.js runtime metrics
- ServiceMonitor enabled in Helm chart

**Requirements Addressed:**
- REQ-OBS-003: Prometheus Metrics

**Key Files:**
- `app/api/metrics/route.ts` (new)
- `package.json` (add prom-client)
- `chart/values.yaml` (enable ServiceMonitor)

**Critical Pitfalls:**
- Use singleton pattern for metrics registry
- Ensure ServiceMonitor selector matches service labels

**Dependencies:** Phase 3 (need running deployment)

---

## Phase 6: Browser RUM (Faro)

**Goal:** Enable client-side observability with Grafana Faro

**Delivers:**
- FaroInit client component
- Core Web Vitals collection (LCP, CLS, INP)
- JavaScript error tracking
- Helm values for Faro endpoint

**Requirements Addressed:**
- REQ-OBS-004: Browser RUM (Faro)

**Key Files:**
- `app/components/faro-init.tsx` (new)
- `app/layout.tsx` (add FaroInit)
- `package.json` (add @grafana/faro-web-sdk)
- `chart/values.yaml` (add Faro endpoint)

**Critical Pitfalls:**
- Initialize Faro before any other client code
- Handle CORS if Alloy receiver not configured
- Use 'use client' directive for client component

**Dependencies:** Phase 3 (need deployment for testing)

---

## Phase 7: Renovate Configuration

**Goal:** Automate dependency updates with ArgoCD awareness

**Delivers:**
- renovate.json with ArgoCD file patterns
- Dependency grouping rules
- Auto-merge configuration for patches

**Requirements Addressed:**
- REQ-AUTO-001: Renovate Configuration

**Key Files:**
- `renovate.json` (new)

**Critical Pitfalls:**
- Add managerFilePatterns for ArgoCD detection
- Pin canary dependencies to prevent auto-merge issues
- Test with dry-run before enabling

**Dependencies:** Phase 3 (stable deployment before automation)

---

## Phase Summary

| Phase | Goal | Requirements | Dependencies |
|-------|------|--------------|--------------|
| 1 | Container Foundation | REQ-INF-001, REQ-INF-002 | None |
| 2 | CI/CD Pipeline | REQ-INF-003 | Phase 1 |
| 3 | Helm & Deployment | REQ-INF-004, REQ-INF-005 | Phase 2 |
| 4 | Server-Side Tracing | REQ-OBS-002 | Phase 3 |
| 5 | Prometheus Metrics | REQ-OBS-003 | Phase 3 |
| 6 | Browser RUM | REQ-OBS-004 | Phase 3 |
| 7 | Renovate | REQ-AUTO-001 | Phase 3 |

**Execution Order:**
- Phases 1-3: Sequential (strict dependencies)
- Phases 4-6: Can run in parallel after Phase 3
- Phase 7: After deployment is stable

---

## Success Criteria

**Milestone Complete When:**
1. Blog accessible at victorbona.dev and blog.victorbona.dev
2. Traces visible in Grafana Tempo
3. Logs visible in Grafana Loki
4. Metrics scraped by Prometheus
5. Faro RUM data in Grafana
6. Renovate creating dependency update PRs

---

*Roadmap created: 2026-01-26*
*Status: Ready for execution*
