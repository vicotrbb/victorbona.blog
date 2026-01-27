# Phase 1: Container Foundation - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Create a production-ready Docker image for the Next.js blog with health/readiness endpoints. The image must support Kubernetes deployment with proper probe configuration. CI/CD pipeline and Helm deployment are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Health Check Behavior
- Health endpoint (`/api/health`): Simple ping, returns 200 OK when process is running
- Readiness endpoint (`/api/ready`): Verifies Next.js is fully initialized and ready to serve
- Response body: Minimal — just `{"status": "ok"}`, no internal details exposed
- Access: Public endpoints, no authentication (standard for K8s probes)

### Image Configuration
- Base image: `node:22-alpine` — smallest footprint
- User: Non-root user for security
- Environment variables: Build-time defaults baked in, override at runtime via Helm
- Labels: OCI standard labels (`org.opencontainers.image.*`) with version, commit SHA, build date

### Build Optimization
- Priority: Balance size and build speed — reasonable optimization without over-engineering
- Dependencies: Production only in final stage, dev deps excluded
- Size constraint: No hard limit, optimize reasonably
- Network: Standard builds with network access (not air-gapped)

### Runtime Behavior
- Logging: JSON structured format (compatible with Loki)
- Graceful shutdown: 30 second timeout (K8s default)
- Debug: No debug/profiling endpoints in production
- Port: 3000 (Next.js default)

### Claude's Discretion
- Multi-stage Dockerfile structure and layer ordering
- Exact Alpine packages needed for sharp/image optimization
- .dockerignore patterns
- Specific OCI label values beyond the standard set

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches. User wants production-grade defaults that work well with Kubernetes and the existing observability stack (Loki for logs).

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-container-foundation*
*Context gathered: 2026-01-27*
