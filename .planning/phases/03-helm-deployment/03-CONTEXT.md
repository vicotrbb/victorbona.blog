# Phase 3: Helm Chart & Deployment - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Configure Helm chart for deploying the containerized Next.js blog to Kubernetes via ArgoCD. Includes values.yaml customization, deployment configuration, service setup, and health probe wiring. Cloudflare tunnel handles external access (no in-cluster ingress needed).

</domain>

<decisions>
## Implementation Decisions

### Resource Sizing
- 2 replicas for basic redundancy during updates
- Requests: 128Mi memory, 100m CPU (conservative for low-traffic blog)
- Limits: 256Mi memory, 200m CPU (2x requests for burst capacity)
- HPA enabled: scale 2-4 pods based on CPU utilization

### Deployment Strategy
- Rolling update strategy (zero downtime)
- Fast updates: 50% max unavailable (with 2 replicas, 1 can be down)
- PodDisruptionBudget: minAvailable=1 (protect against node drains)
- 30 second termination grace period (default)

### Configuration Exposure
- Single values.yaml with sensible defaults (override at deploy time)
- Observability endpoints as placeholders (empty strings with comments)
- Image tag configurable, default to `latest`
- Secrets referenced externally (chart refs secrets created outside Helm)

### Service & Networking
- ClusterIP service type (Cloudflare tunnel connects directly)
- No Ingress resource (tunnel routes to Service, no in-cluster ingress needed)
- Container port 3000 (Next.js default)
- No service annotations (plain ClusterIP, Prometheus uses ServiceMonitor in Phase 5)

### Claude's Discretion
- Exact HPA CPU threshold percentage
- Health probe timing configuration (initialDelay, period, timeout)
- Label and selector conventions
- Values.yaml structure and commenting style

</decisions>

<specifics>
## Specific Ideas

No specific requirements — open to standard approaches that follow Kubernetes and Helm best practices.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-helm-deployment*
*Context gathered: 2026-01-27*
