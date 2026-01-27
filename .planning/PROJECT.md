# Victor Bona Blog - Kubernetes Migration

## What This Is

A personal tech blog currently running on Vercel, being migrated to a self-hosted Kubernetes cluster with full observability integration. The blog features MDX-based content, project showcases, and article listings. This milestone focuses on infrastructure: containerization, Helm chart customization, CI/CD automation, and integration with an existing observability stack (Tempo, Loki, Alloy, Prometheus, Faro).

## Core Value

The blog must run reliably on the home Kubernetes cluster with the same performance as Vercel, while providing full observability (logs, traces, metrics, RUM) through the existing stack.

## Requirements

### Validated

<!-- Existing capabilities from codebase -->

- ✓ Blog posts rendered from MDX with frontmatter metadata — existing
- ✓ Projects showcase with status badges and tech stack details — existing
- ✓ Articles/papers section with academic metadata — existing
- ✓ RSS feed generation at /rss — existing
- ✓ Dynamic OG image generation at /og — existing
- ✓ Sitemap and robots.txt generation — existing
- ✓ LLM discovery file at /llms.txt — existing
- ✓ Dark mode support via Tailwind — existing
- ✓ Tag-based blog post filtering — existing
- ✓ Reading progress indicator — existing
- ✓ Social sharing functionality — existing

### Active

<!-- Infrastructure migration scope -->

- [ ] Optimized Docker image for Next.js standalone build
- [ ] GitHub Actions workflow to build and push Docker image to GHCR
- [ ] Helm chart customized for single-service blog deployment
- [ ] Ingress configuration for Cloudflare Tunnel (victorbona.dev + blog.victorbona.dev)
- [ ] OTEL instrumentation for traces → Alloy (gRPC endpoint)
- [ ] Faro SDK integration for browser RUM → faro.bonalab.org
- [ ] ServiceMonitor for Prometheus metrics scraping
- [ ] Renovate configuration for automated dependency updates
- [ ] All observability settings configurable via Helm values.yaml

### Out of Scope

- nginx-ingress configuration — using Cloudflare Tunnel exclusively
- TLS/cert-manager setup — Cloudflare handles TLS termination
- Database integration — blog is static, no database needed
- In-cluster PostgreSQL/Redis/MinIO — not required for this app
- Vercel Analytics — replacing with self-hosted observability
- Multi-replica horizontal scaling — single replica sufficient for personal blog

## Context

**Current State:**
- Blog runs successfully on Vercel at blog.victorbona.dev
- Next.js App Router with static site generation
- TypeScript + Tailwind CSS v4 (alpha)
- No existing CI/CD or containerization

**Target Environment:**
- Home Kubernetes cluster with existing infrastructure
- ArgoCD for GitOps deployments
- Observability stack already deployed:
  - Alloy DaemonSet (logs auto-scraped, traces via OTLP push)
  - Tempo for distributed tracing
  - Loki for log aggregation
  - Prometheus for metrics
  - Grafana Faro for browser RUM

**Observability Endpoints:**
- Traces (OTLP gRPC): `alloy.observability-system.svc.cluster.local:4317`
- Traces (OTLP HTTP): `alloy.observability-system.svc.cluster.local:4318`
- Faro (browser RUM): `faro.bonalab.org`

**Registry:**
- Docker images: `ghcr.io/vicotrbb/victorbona.blog`
- Helm chart: Same repository, ArgoCD syncs from Git

## Constraints

- **Ingress**: Cloudflare Tunnel only — no nginx-ingress class
- **TLS**: Handled by Cloudflare — ingresses set `tls: false`
- **GitOps**: All configuration must be in Helm values.yaml — no manual cluster changes
- **Registry**: GHCR only — images and charts published to GitHub Container Registry
- **Observability**: Must integrate with existing stack — no new observability components

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Next.js standalone output mode | Produces minimal Docker image without node_modules | — Pending |
| Cloudflare Tunnel for ingress | Existing infrastructure, handles TLS, public exposure | — Pending |
| OTEL SDK for traces | Standard, works with Alloy OTLP receiver | — Pending |
| Grafana Faro for RUM | Existing Faro receiver in cluster at faro.bonalab.org | — Pending |
| Renovate over Dependabot | Better GitOps integration with ArgoCD | — Pending |

---
*Last updated: 2026-01-26 after initialization*
