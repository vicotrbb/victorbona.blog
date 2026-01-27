# Phase 3: Helm Chart & Deployment - Research

**Researched:** 2026-01-27
**Domain:** Helm chart configuration, Kubernetes deployment, health probes, HPA, Cloudflare Tunnel integration
**Confidence:** HIGH

## Summary

This phase customizes an existing multi-component Helm chart template for deploying the containerized Next.js blog to Kubernetes via ArgoCD. The chart already contains all necessary templates (Deployment, Service, HPA, PDB, ServiceMonitor); the work is purely configuration in values.yaml.

Key findings:
- The existing chart uses a `components` map structure where each component becomes a Deployment + optional Service + Ingress
- For this blog deployment, we use a single component (rename from `api` to `web` or similar) with ingress disabled (Cloudflare Tunnel routes directly to ClusterIP)
- The chart already supports all required features: health probes, HPA, PDB, security contexts, OTEL environment injection
- No template modifications needed - all configuration is via values.yaml overrides

**Primary recommendation:** Configure the existing `components.api` (or rename to `web`) with the blog-specific settings. Disable all unnecessary features (ingress, external services, internal dependencies). Enable HPA and PDB per CONTEXT.md decisions.

## Standard Stack

The established patterns for Helm chart configuration:

### Core Configuration Structure

| Configuration Area | Chart Location | Purpose |
|-------------------|----------------|---------|
| `global.nameOverride` | values.yaml | Release naming |
| `components.<name>` | values.yaml | Per-component settings (image, probes, resources) |
| `observability.otel` | values.yaml | OTEL environment variables (placeholders for Phase 5) |
| `serviceAccount` | values.yaml | Service account creation |

### Required Values to Configure

| Value Path | Setting | Reason |
|------------|---------|--------|
| `global.nameOverride` | `"victorbona-blog"` | Consistent resource naming |
| `components.web.image.repository` | `ghcr.io/vicotrbb/victorbona.blog` | Image from Phase 2 |
| `components.web.image.tag` | `"latest"` | Default tag, overridden at deploy |
| `components.web.replicaCount` | `2` | Per CONTEXT.md decision |
| `components.web.ports[0].containerPort` | `3000` | Next.js default |
| `components.web.service.type` | `ClusterIP` | Cloudflare Tunnel connects directly |
| `components.web.ingress.enabled` | `false` | No in-cluster ingress needed |

### Components to Disable

| Component/Feature | Setting | Reason |
|-------------------|---------|--------|
| `components.worker` | `enabled: false` | No worker needed for blog |
| `externalServices.postgres` | `enabled: false` | No database |
| `externalServices.redis` | `enabled: false` | No cache |
| `externalServices.minio` | `enabled: false` | No object storage |
| `postgresql` | `enabled: false` | No in-cluster postgres |
| `redis` | `enabled: false` | No in-cluster redis |
| `minio` | `enabled: false` | No in-cluster minio |
| `networkPolicy` | `enabled: false` | Defer to later phase |

## Architecture Patterns

### Pattern 1: Single-Component Blog Configuration

**What:** Configure one component for the stateless Next.js blog
**When to use:** Simple web applications without background workers

**Example values.yaml structure:**
```yaml
# Source: Existing chart README.md + CONTEXT.md decisions
global:
  nameOverride: "victorbona-blog"
  fullnameOverride: ""

  # Security: Non-root user matching Dockerfile UID
  podSecurityContext:
    runAsUser: 1001
    runAsGroup: 1001
    runAsNonRoot: true
    fsGroup: 1001

  securityContext:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: false  # Next.js needs to write cache
    capabilities:
      drop:
        - ALL

components:
  web:  # Renamed from 'api' for clarity
    enabled: true
    replicaCount: 2

    image:
      repository: ghcr.io/vicotrbb/victorbona.blog
      tag: "latest"
      pullPolicy: IfNotPresent
```

### Pattern 2: Health Probe Configuration

**What:** Configure liveness, readiness, and startup probes with appropriate timing
**When to use:** All Kubernetes deployments

**Example:**
```yaml
# Source: Kubernetes best practices + CONTEXT.md decisions
components:
  web:
    # Liveness: Is the process alive? Simple check, higher failure tolerance
    livenessProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
      successThreshold: 1

    # Readiness: Can it serve traffic? Gates Service endpoints
    readinessProbe:
      httpGet:
        path: /api/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
      successThreshold: 1

    # Startup: Delay liveness until app is ready (slow-starting protection)
    startupProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 0
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 30  # 30 * 5s = 150s max startup time
      successThreshold: 1
```

### Pattern 3: Resource Limits and HPA Configuration

**What:** Set requests/limits and horizontal pod autoscaler
**When to use:** Production deployments requiring cost control and auto-scaling

**Example:**
```yaml
# Source: CONTEXT.md decisions
components:
  web:
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "200m"

    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 4
      targetCPUUtilizationPercentage: 70  # Scale up at 70% CPU
      # Memory-based scaling disabled (CPU is safer - memory OOMKills are abrupt)
```

### Pattern 4: HOSTNAME Environment Variable

**What:** Set HOSTNAME=0.0.0.0 for Kubernetes pod networking
**When to use:** All containerized Next.js deployments

**Example:**
```yaml
# Source: Phase 1 research - critical for pod networking
components:
  web:
    env:
      - name: HOSTNAME
        value: "0.0.0.0"
      - name: PORT
        value: "3000"
      - name: NODE_ENV
        value: "production"
```

### Pattern 5: Observability Placeholders

**What:** Configure OTEL environment variables as placeholders for future enablement
**When to use:** Preparing for Phase 5 observability setup

**Example:**
```yaml
# Source: Chart README.md - OTEL integration
observability:
  otel:
    enabled: false  # Placeholder - enable in Phase 5
    serviceName: "victorbona-blog"
    endpoint: ""  # Set to alloy endpoint when enabled
    protocol: "http/protobuf"
    headers: ""
    resourceAttributes: {}

  serviceMonitor:
    enabled: false  # Enable in Phase 5 with Prometheus
```

### Anti-Patterns to Avoid

- **Using Ingress with Cloudflare Tunnel:** The tunnel connects directly to ClusterIP; adding Ingress adds unnecessary complexity
- **LoadBalancer or NodePort service type:** Not needed with Cloudflare Tunnel; wastes cloud resources
- **Memory-based HPA scaling:** Memory hitting limits causes OOMKills, not graceful scaling; prefer CPU
- **Setting liveness probe to check external dependencies:** Causes cascading pod restarts during DB outages
- **Too-short probe timeouts:** Traffic spikes can cause probe failures; use generous timeouts

## Don't Hand-Roll

Problems that have existing solutions in the chart:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OTEL env injection | Manual env vars | `observability.otel.enabled` | Chart already has `_helpers.tpl` template |
| Service selector labels | Custom labels | Chart's `app-template.selectorLabels` | Ensures Deployment/Service/PDB alignment |
| HPA targeting | Custom HPA manifest | `components.web.autoscaling` | Chart generates correct scaleTargetRef |
| PDB configuration | Custom PDB manifest | `components.web.pdb` | Chart generates correct selector |
| Security contexts | Per-container settings | `global.podSecurityContext` | Applied uniformly to all components |

**Key insight:** The existing chart template handles all common Kubernetes patterns. Configuration is purely values.yaml changes - no template modifications needed.

## Common Pitfalls

### Pitfall 1: HOSTNAME Not Set

**What goes wrong:** Next.js binds to localhost, making the container unreachable from the Kubernetes network
**Why it happens:** Next.js defaults to localhost for development security; Dockerfile may not override
**How to avoid:** Explicitly set `HOSTNAME: "0.0.0.0"` in component env vars
**Warning signs:** Readiness probe fails with "connection refused"

### Pitfall 2: Probe Paths Don't Match Application

**What goes wrong:** Health probes return 404, causing pod restarts
**Why it happens:** Probe configuration uses different paths than application implements
**How to avoid:** Verify `/api/health` and `/api/ready` endpoints exist (created in Phase 1)
**Warning signs:** Pods stuck in CrashLoopBackOff with "probe failed" events

### Pitfall 3: Too-Short Probe Timeouts

**What goes wrong:** Pods restart during traffic spikes when probe responses are slow
**Why it happens:** Default 1-second timeout is too aggressive for real applications
**How to avoid:** Use 3-5 second timeouts; higher failureThreshold for liveness
**Warning signs:** Intermittent pod restarts during high load

### Pitfall 4: HPA Without Resource Requests

**What goes wrong:** HPA cannot calculate CPU utilization, scaling never triggers
**Why it happens:** HPA uses resource requests as the denominator; missing requests = undefined %
**How to avoid:** Always set `resources.requests.cpu` when using CPU-based HPA
**Warning signs:** HPA status shows "unable to fetch metrics"

### Pitfall 5: PDB Blocking Node Drains

**What goes wrong:** Node drains timeout or fail because PDB prevents eviction
**Why it happens:** `minAvailable: 2` with `replicaCount: 2` means no pods can be evicted
**How to avoid:** Set `minAvailable: 1` with `replicaCount: 2` (50% availability during drains)
**Warning signs:** `kubectl drain` hangs indefinitely

### Pitfall 6: Security Context UID Mismatch

**What goes wrong:** Container fails to start with permission denied errors
**Why it happens:** Kubernetes securityContext UID differs from Dockerfile USER
**How to avoid:** Match `runAsUser: 1001` with Dockerfile's `USER nextjs` (uid 1001)
**Warning signs:** CrashLoopBackOff with "permission denied" in logs

## Code Examples

Verified patterns from official sources and the existing chart:

### Complete values.yaml for Blog Deployment

```yaml
# Source: Synthesized from chart README.md, CONTEXT.md, and research
# victorbona.blog Helm values configuration

global:
  nameOverride: "victorbona-blog"
  fullnameOverride: ""

  labels: {}
  annotations: {}
  podLabels: {}
  podAnnotations: {}

  imagePullSecrets: []
  nodeSelector: {}
  tolerations: []
  affinity: {}

  # Security: Run as non-root user matching Dockerfile UID 1001
  podSecurityContext:
    runAsUser: 1001
    runAsGroup: 1001
    runAsNonRoot: true
    fsGroup: 1001

  securityContext:
    allowPrivilegeEscalation: false
    readOnlyRootFilesystem: false  # Next.js needs .next/cache write access
    capabilities:
      drop:
        - ALL

  env: []
  envFrom: []
  volumes: []
  volumeMounts: []

serviceAccount:
  create: true
  name: ""
  annotations: {}
  automountServiceAccountToken: false  # Not needed for blog

components:
  # Main web component (renamed from 'api' for clarity)
  web:
    enabled: true
    replicaCount: 2

    image:
      repository: ghcr.io/vicotrbb/victorbona.blog
      tag: "latest"  # Override at deploy time
      pullPolicy: IfNotPresent

    command: []
    args: []

    ports:
      - name: http
        containerPort: 3000
        protocol: TCP

    service:
      enabled: true
      type: ClusterIP  # Cloudflare Tunnel connects directly
      ports:
        - name: http
          port: 80
          targetPort: http

    ingress:
      enabled: false  # No in-cluster ingress - Cloudflare Tunnel handles routing

    # Environment variables
    env:
      - name: HOSTNAME
        value: "0.0.0.0"  # Critical for Kubernetes networking
      - name: PORT
        value: "3000"
      - name: NODE_ENV
        value: "production"

    envFrom: []

    # Resource limits per CONTEXT.md decisions
    resources:
      requests:
        memory: "128Mi"
        cpu: "100m"
      limits:
        memory: "256Mi"
        cpu: "200m"

    # Health probes - endpoints from Phase 1
    livenessProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3
      successThreshold: 1

    readinessProbe:
      httpGet:
        path: /api/ready
        port: 3000
      initialDelaySeconds: 5
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 3
      successThreshold: 1

    startupProbe:
      httpGet:
        path: /api/health
        port: 3000
      initialDelaySeconds: 0
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 30  # 150s max startup
      successThreshold: 1

    nodeSelector: {}
    tolerations: []
    affinity: {}
    volumes: []
    volumeMounts: []

    # HPA per CONTEXT.md: scale 2-4 based on CPU
    autoscaling:
      enabled: true
      minReplicas: 2
      maxReplicas: 4
      targetCPUUtilizationPercentage: 70
      # Memory scaling disabled - CPU is safer

    # PDB per CONTEXT.md: minAvailable=1
    pdb:
      enabled: true
      minAvailable: 1

    # Metrics placeholder for Phase 5
    metrics:
      enabled: false
      portName: http
      path: /metrics
      interval: 30s
      scrapeTimeout: 10s
      scheme: http
      honorLabels: false

  # Disable worker component
  worker:
    enabled: false

# Disable all external services (blog has no dependencies)
externalServices:
  postgres:
    enabled: false
  redis:
    enabled: false
  minio:
    enabled: false

# Observability - placeholders for Phase 5
observability:
  otel:
    enabled: false
    serviceName: "victorbona-blog"
    endpoint: ""  # Example: http://alloy.observability-system.svc.cluster.local:4318
    protocol: "http/protobuf"
    headers: ""
    resourceAttributes: {}

  serviceMonitor:
    enabled: false
    labels: {}
    namespace: ""

  podMonitor:
    enabled: false

networkPolicy:
  enabled: false

# Disable in-cluster dependencies
postgresql:
  enabled: false

redis:
  enabled: false

minio:
  enabled: false
```

### Chart.yaml Updates

```yaml
# Source: Chart best practices
apiVersion: v2
name: victorbona-blog  # Renamed from app-template
description: Victor Bona's personal blog
type: application
version: 0.1.0  # Chart version - increment on changes
appVersion: "0.1.0"  # Application version - sync with releases

# Remove unnecessary dependencies (no postgres/redis/minio)
dependencies: []
```

### Probe Timing Rationale

```yaml
# Source: Kubernetes documentation + best practices research
#
# Startup Probe:
#   - failureThreshold: 30, periodSeconds: 5 = 150s max startup
#   - Next.js standalone starts fast (~5-10s) but gives buffer for cold starts
#   - Disables liveness/readiness until startup succeeds
#
# Readiness Probe:
#   - initialDelaySeconds: 5 - wait for startup probe to pass first
#   - periodSeconds: 5, failureThreshold: 3 = 15s before traffic removed
#   - Quick to detect issues, quick to recover
#
# Liveness Probe:
#   - initialDelaySeconds: 10 - longer delay after startup
#   - periodSeconds: 10, failureThreshold: 3 = 30s before restart
#   - More forgiving than readiness - restart is expensive
#   - Higher failureThreshold prevents restart during transient issues
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `autoscaling/v2beta2` | `autoscaling/v2` | Kubernetes 1.26 | Chart already uses v2 |
| `policy/v1beta1` PDB | `policy/v1` | Kubernetes 1.21 | Chart already uses v1 |
| Single probe type | Three probe types | Kubernetes 1.16+ | Startup probe prevents premature restarts |
| Default security context | Explicit non-root | Pod Security Standards | Required for restricted namespaces |

**Current best practices:**
- Always use startup probes for slow-starting apps
- Set explicit security contexts for Pod Security Admission
- Use `autoscaling/v2` for advanced metrics options
- CPU-based HPA is safer than memory-based

## Open Questions

Things that couldn't be fully resolved:

1. **Exact HPA stabilization window**
   - What we know: Default behavior may cause flapping during variable traffic
   - What's unclear: Whether to add `behavior.scaleDown.stabilizationWindowSeconds`
   - Recommendation: Start with defaults; add stabilization if flapping observed

2. **Service account token mounting**
   - What we know: Blog doesn't need Kubernetes API access
   - What's unclear: Whether disabling `automountServiceAccountToken` causes issues
   - Recommendation: Set to `false` to follow least-privilege; revert if needed

3. **Observability endpoint URL**
   - What we know: OTEL collector exists in cluster (alloy)
   - What's unclear: Exact service URL for OTEL endpoint
   - Recommendation: Leave as placeholder; configure in Phase 5

## Sources

### Primary (HIGH confidence)
- Existing chart templates at `/Users/victorbona/Personal/victorbona.blog/chart/` - Actual implementation
- CONTEXT.md decisions - User-locked decisions on resources, replicas, PDB
- Phase 1 RESEARCH.md - Health endpoint paths, Dockerfile UID

### Secondary (MEDIUM confidence)
- [Helm Best Practices - Values](https://helm.sh/docs/chart_best_practices/values/) - Naming conventions, structure
- [Kubernetes Liveness, Readiness, Startup Probes](https://kubernetes.io/docs/concepts/configuration/liveness-readiness-startup-probes/) - Probe configuration
- [Kubernetes Configure Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) - Timing parameters
- [Cloudflare Tunnel Kubernetes Deployment](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/deployment-guides/kubernetes/) - ClusterIP integration

### Tertiary (LOW confidence)
- [Kubernetes HPA Best Practices](https://www.devzero.io/blog/kubernetes-hpa) - CPU threshold recommendations
- [Kubernetes Security Context](https://kubernetes.io/docs/tasks/configure-pod-container/security-context/) - runAsNonRoot patterns
- [Kubernetes Rolling Update](https://semaphore.io/blog/kubernetes-rolling-update-deployment) - Deployment strategy

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using existing chart, configuration-only changes
- Architecture: HIGH - Chart templates verified, patterns documented
- Pitfalls: HIGH - Common issues well-documented in Kubernetes ecosystem
- Probe timing: MEDIUM - Values based on best practices, may need tuning

**Research date:** 2026-01-27
**Valid until:** 60 days (Helm/Kubernetes patterns are stable; chart template unlikely to change)
