# Victor Bona Blog - Kubernetes Migration

## What This Is

A personal tech blog running on a self-hosted Kubernetes cluster with full observability integration. The blog features MDX-based content, project showcases, and article listings. Deployed via ArgoCD with GitHub Actions CI/CD pushing multi-arch images to GHCR.

## Core Value

The blog runs reliably on the home Kubernetes cluster with the same performance as Vercel, while providing full observability (logs, traces, metrics, RUM) through the existing stack.

## Requirements

### Validated

- Docker image with multi-stage build, non-root execution, and standalone output - v1.0
- Health endpoints at /api/health (liveness) and /api/ready (readiness) - v1.0
- GitHub Actions CI/CD for multi-arch builds (amd64, arm64) to GHCR - v1.0
- Helm chart with HPA, PDB, security contexts for ArgoCD - v1.0
- ClusterIP service for Cloudflare Tunnel ingress (no TLS config needed) - v1.0
- OpenTelemetry tracing via HTTP/protobuf to Alloy port 4318 - v1.0
- Prometheus metrics at /metrics with ServiceMonitor - v1.0
- Grafana Faro browser RUM with Core Web Vitals and error tracking - v1.0
- Blog posts rendered from MDX with frontmatter metadata - existing
- Projects showcase with status badges and tech stack details - existing
- Articles/papers section with academic metadata - existing
- RSS feed generation at /rss - existing
- Dynamic OG image generation at /og - existing
- Sitemap and robots.txt generation - existing
- LLM discovery file at /llms.txt - existing
- Dark mode support via Tailwind - existing
- Tag-based blog post filtering - existing
- Reading progress indicator - existing
- Social sharing functionality - existing

### Active

(Empty - define next milestone with `/gsd:new-milestone`)

### Out of Scope

- nginx-ingress configuration - using Cloudflare Tunnel exclusively
- TLS/cert-manager setup - Cloudflare handles TLS termination
- Database integration - blog is static, no database needed
- In-cluster PostgreSQL/Redis/MinIO - not required for this app
- Vercel Analytics - replacing with self-hosted observability
- Multi-replica horizontal scaling - single replica sufficient for personal blog
- Frontend-backend trace correlation - high complexity, consider for future
- Custom business metrics - not needed for personal blog
- Real-time alerting - monitor dashboards sufficient
- Renovate automation - considered but removed from v1.0 scope

## Context

**Current State:**
- Shipped v1.0 with 2,817 LOC TypeScript
- Tech stack: Next.js 15, React 19, Tailwind CSS v4, TypeScript
- Container: node:22-alpine, 381MB image with Sharp
- Observability: OTEL traces, Prometheus metrics, Faro RUM
- Deployment: ArgoCD syncing from Git, GHCR container registry

**Target Environment:**
- Home Kubernetes cluster with existing infrastructure
- ArgoCD for GitOps deployments
- Observability stack: Alloy, Tempo, Loki, Prometheus, Faro

**Known Tech Debt:**
- Image size 381MB (target was <300MB) - Sharp native binaries
- @vercel/analytics still loaded alongside Faro RUM

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js standalone output mode | Produces minimal Docker image without node_modules | Good |
| Cloudflare Tunnel for ingress | Existing infrastructure, handles TLS, public exposure | Good |
| HTTP/protobuf OTEL export to 4318 | gRPC causes Next.js bundling errors with @grpc/grpc-js | Good |
| Grafana Faro for RUM | Existing Faro receiver in cluster at faro.bonalab.org | Good |
| CPU-based HPA only | Memory OOMKills are abrupt, CPU scaling is graceful | Good |
| globalThis singleton for metrics | Survives HMR cycles, prevents duplicate registration | Good |
| DNT guard for Faro | Privacy compliance for browser RUM | Good |
| Renovate deferred | Complexity vs value for personal blog, can add later | Pending |

## Constraints

- **Ingress**: Cloudflare Tunnel only - no nginx-ingress class
- **TLS**: Handled by Cloudflare - ingresses set `tls: false`
- **GitOps**: All configuration must be in Helm values.yaml - no manual cluster changes
- **Registry**: GHCR only - images published to GitHub Container Registry
- **Observability**: Must integrate with existing stack - no new observability components

---
*Last updated: 2026-01-28 after v1.0 milestone*
