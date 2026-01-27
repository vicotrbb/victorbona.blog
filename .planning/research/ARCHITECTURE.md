# Architecture Patterns

**Domain:** Next.js Blog Kubernetes Deployment with Observability
**Researched:** 2026-01-26
**Confidence:** HIGH (official documentation verified)

## System Overview

```
                                    EXTERNAL
                                       |
                              [Cloudflare Edge]
                                       |
                                 TLS Termination
                                       |
                              [Cloudflare Tunnel]
                                       |
                               ----CLUSTER----
                                       |
                              [cloudflared Pod]
                                       |
                           [blog-victorbona Service]
                                       |
                            [Next.js Deployment]
                             /        |        \
                       Metrics    Traces     Logs
                          |          |          |
                   ServiceMonitor  OTLP     stdout
                          |          |          |
                    [Prometheus] [Alloy]   [Alloy]
                                       \   /
                                      [Tempo] [Loki]
                                           |
                                      [Grafana]
                                           |
                              [Faro] <-- Browser RUM
```

## Component Boundaries

### 1. Container Image (Dockerfile)

**Responsibility:** Package Next.js application into minimal, secure container

**Boundary:** Build-time artifact. Contains application code, static assets, and Node.js runtime only.

**Key Files:**
- `Dockerfile` - Multi-stage build definition
- `next.config.mjs` - Must include `output: 'standalone'`
- `.dockerignore` - Exclude node_modules, .git, etc.

**Build Outputs:**
- `.next/standalone/` - Self-contained server
- `.next/static/` - Static assets (CSS, JS chunks)
- `public/` - User-facing static files

**Interface Contracts:**
- Exposes port 3000 (configurable via PORT env)
- Expects `HOSTNAME=0.0.0.0` for container networking
- Health endpoint at `/api/health`

### 2. Helm Chart (chart/)

**Responsibility:** Define Kubernetes resources, expose configuration surface

**Boundary:** Deployment-time configuration. Generates YAML manifests consumed by ArgoCD.

**Key Resources:**
| Resource | Purpose | Configuration Path |
|----------|---------|-------------------|
| Deployment | Run Next.js pods | `components.api.*` |
| Service | ClusterIP for internal routing | `components.api.service.*` |
| ServiceAccount | Pod identity | `serviceAccount.*` |
| ServiceMonitor | Prometheus scraping | `observability.serviceMonitor.*` |
| HPA | Autoscaling (disabled for blog) | `components.api.autoscaling.*` |
| PDB | Disruption budget | `components.api.pdb.*` |
| NetworkPolicy | Network segmentation | `networkPolicy.*` |

**Interface Contracts:**
- ArgoCD syncs from `chart/` directory in repo
- Image tag updated via CI (values override or image.tag)
- Observability OTEL endpoint injected via `observability.otel.*`

### 3. GitHub Actions (CI)

**Responsibility:** Build image, push to GHCR, trigger deployment

**Boundary:** CI-time automation. Produces container images and updates deployment manifests.

**Workflow Stages:**
```
push to main
    |
    v
[Build Stage]
  - npm install
  - next build
    |
    v
[Docker Stage]
  - docker build (multi-stage)
  - docker push ghcr.io/vicotrbb/victorbona.blog:sha-xxxxx
    |
    v
[Update Stage]
  - Update chart/values.yaml with new tag
  - Or: trigger ArgoCD image updater
```

**Interface Contracts:**
- GHCR credentials via repository secrets
- Produces immutable image tags (SHA-based)
- ArgoCD detects changes via Git polling or webhook

### 4. Observability SDKs (Application Layer)

**Responsibility:** Instrument application for traces, metrics, RUM

**Boundary:** Application runtime. Libraries embedded in Next.js code.

**SDK Components:**

| Component | Package | Purpose |
|-----------|---------|---------|
| Traces (server) | `@opentelemetry/sdk-node`, `@opentelemetry/exporter-trace-otlp-grpc` | Server-side distributed tracing |
| Traces (init) | `@vercel/otel` or manual | Instrumentation bootstrap |
| Metrics | `prom-client` | Prometheus metrics endpoint |
| RUM | `@grafana/faro-web-sdk` | Browser real user monitoring |

**Interface Contracts:**
- Traces push to OTLP endpoint (env: `OTEL_EXPORTER_OTLP_ENDPOINT`)
- Metrics exposed at `/metrics` (scraped by ServiceMonitor)
- Faro SDK pushes to `faro.bonalab.org` (configured in client code)

---

## Data Flow Diagrams

### Trace Data Flow

```
[Browser] -----(page request)-----> [Next.js Pod]
                                         |
                                   instrumentation.ts
                                   (OTEL SDK active)
                                         |
                                   span created
                                         |
                              OTLPTraceExporter (gRPC)
                                         |
                                         v
                        [Alloy @ alloy.observability-system:4317]
                                         |
                                         v
                                     [Tempo]
                                         |
                                         v
                                    [Grafana]
```

**Configuration Points:**
- `OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy.observability-system.svc.cluster.local:4317`
- `OTEL_SERVICE_NAME=victorbona-blog`

### Metrics Data Flow

```
[Prometheus Operator] ---(ServiceMonitor)---> discovers Service
         |
         v
   scrape /metrics endpoint every 30s
         |
         v
[Next.js Pod @ port 3000/metrics]
         |
   prom-client collectDefaultMetrics()
   + custom counters/histograms
         |
         v
[Prometheus TSDB]
         |
         v
[Grafana Dashboards]
```

**Configuration Points:**
- `components.api.metrics.enabled: true`
- `components.api.metrics.path: /metrics`
- `observability.serviceMonitor.enabled: true`

### Log Data Flow

```
[Next.js Pod] ---(stdout/stderr)---> [Container Runtime]
                                            |
                                            v
                              [Alloy DaemonSet on Node]
                              (log scraping via Kubernetes API)
                                            |
                                            v
                                        [Loki]
                                            |
                                            v
                                       [Grafana]
```

**Configuration Points:**
- Logs automatically collected by Alloy DaemonSet
- No application-level configuration needed
- Pod labels used for log filtering in Grafana

### RUM Data Flow

```
[Browser] ---(page load)---> [Faro SDK initialized]
                                    |
                             collects:
                             - web vitals
                             - console logs
                             - errors/exceptions
                             - user events
                                    |
                             FetchTransport
                                    |
                                    v
                         [faro.bonalab.org]
                         (Faro receiver in cluster)
                                    |
                                    v
                     [Loki (logs), Tempo (traces)]
                                    |
                                    v
                              [Grafana]
```

**Configuration Points:**
- Faro endpoint configured in client-side code
- App name and version for correlation
- Optional: trace propagation header injection

---

## GitOps Flow

### Deployment Lifecycle

```
Developer pushes code to main
            |
            v
[GitHub Actions] triggered
            |
     +--------------+
     |              |
     v              v
  Build          Lint/Test
  Docker           |
  Image            v
     |          (passes)
     v              |
  Push to          |
  GHCR             |
     |              |
     +------+------+
            |
            v
  Update values.yaml with new image tag
  (or update ArgoCD Image Updater annotation)
            |
            v
  Commit to repo (automated or manual)
            |
            v
[ArgoCD] detects drift
            |
            v
  Sync Application
            |
            v
[Kubernetes] rolling update
            |
            v
  New pods healthy (readinessProbe passes)
            |
            v
  Old pods terminated
```

### ArgoCD Application Structure

```yaml
# argocd/applications/victorbona-blog.yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: victorbona-blog
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/vicotrbb/victorbona.blog
    targetRevision: main
    path: chart
    helm:
      valueFiles:
        - values.yaml
        - values-prod.yaml  # optional environment overlay
  destination:
    server: https://kubernetes.default.svc
    namespace: victorbona-blog
  syncPolicy:
    automated:
      prune: true
      selfHeal: true
```

---

## Container Architecture

### Multi-Stage Dockerfile Pattern

```dockerfile
# Stage 1: Dependencies
FROM node:22-alpine AS deps
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

# Stage 2: Build
FROM node:22-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build

# Stage 3: Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV HOSTNAME=0.0.0.0
ENV PORT=3000

# Security: non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy build outputs
COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

CMD ["node", "server.js"]
```

**Key Points:**
- Uses `output: 'standalone'` in next.config.mjs
- Static assets copied manually (not included in standalone)
- Non-root user for security
- Alpine base for minimal size (~200MB final image)

### Health Check Configuration

```yaml
# Kubernetes probes in Helm values
components:
  api:
    livenessProbe:
      httpGet:
        path: /api/health
        port: http
      initialDelaySeconds: 10
      periodSeconds: 10
      failureThreshold: 3
    readinessProbe:
      httpGet:
        path: /api/health
        port: http
      initialDelaySeconds: 5
      periodSeconds: 5
      failureThreshold: 3
    startupProbe:
      httpGet:
        path: /api/health
        port: http
      initialDelaySeconds: 0
      periodSeconds: 2
      failureThreshold: 30
```

---

## Kubernetes Resources

### Required Resources for Blog

| Resource | Required | Notes |
|----------|----------|-------|
| Deployment | Yes | Single replica sufficient |
| Service | Yes | ClusterIP, internal only |
| ServiceAccount | Yes | Basic identity |
| ServiceMonitor | Yes | Prometheus metrics |
| Ingress | No | Cloudflare Tunnel handles |
| HPA | No | Single replica |
| PDB | No | Single replica |
| NetworkPolicy | Optional | Restrict egress if desired |

### Values Configuration

```yaml
# chart/values-blog.yaml
global:
  nameOverride: "victorbona-blog"

components:
  api:
    enabled: true
    replicaCount: 1
    image:
      repository: ghcr.io/vicotrbb/victorbona.blog
      tag: "latest"  # Replaced by CI
      pullPolicy: IfNotPresent
    ports:
      - name: http
        containerPort: 3000
        protocol: TCP
    service:
      enabled: true
      type: ClusterIP
      ports:
        - name: http
          port: 80
          targetPort: http
    env:
      - name: NODE_ENV
        value: "production"
    resources:
      requests:
        cpu: 100m
        memory: 128Mi
      limits:
        cpu: 500m
        memory: 512Mi
    metrics:
      enabled: true
      portName: http
      path: /metrics
      interval: 30s

  worker:
    enabled: false

observability:
  otel:
    enabled: true
    serviceName: "victorbona-blog"
    endpoint: "http://alloy.observability-system.svc.cluster.local:4317"
    protocol: "grpc"
  serviceMonitor:
    enabled: true
    labels:
      release: prometheus  # Match Prometheus Operator selector
```

---

## Observability Architecture

### Server-Side Instrumentation

```typescript
// instrumentation.ts (project root)
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-grpc');
    const { Resource } = await import('@opentelemetry/resources');
    const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions');

    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'victorbona-blog',
      }),
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
  }
}
```

### Client-Side RUM (Faro)

```typescript
// app/faro.ts
import { getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';
import { TracingInstrumentation } from '@grafana/faro-web-tracing';

export function initFaro() {
  if (typeof window === 'undefined') return;

  initializeFaro({
    url: 'https://faro.bonalab.org/collect',
    app: {
      name: 'victorbona-blog',
      version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    },
    instrumentations: [
      ...getWebInstrumentations(),
      new TracingInstrumentation(),
    ],
  });
}
```

### Metrics Endpoint

```typescript
// app/api/metrics/route.ts
import { NextResponse } from 'next/server';
import client from 'prom-client';

// Initialize default metrics once
const register = new client.Registry();
client.collectDefaultMetrics({ register });

export async function GET() {
  const metrics = await register.metrics();
  return new NextResponse(metrics, {
    headers: {
      'Content-Type': register.contentType,
    },
  });
}
```

---

## Build Order Dependencies

### Phase Dependency Graph

```
[1. Dockerfile]
     |
     +--> depends on: next.config.mjs (output: 'standalone')
     |
     v
[2. Health Endpoint]
     |
     +--> depends on: Dockerfile (app must run)
     |
     v
[3. CI Workflow]
     |
     +--> depends on: Dockerfile (must build)
     +--> depends on: GHCR credentials (secrets)
     |
     v
[4. Helm Values]
     |
     +--> depends on: CI (image tag exists)
     +--> depends on: Service (for ServiceMonitor)
     |
     v
[5. OTEL Instrumentation]
     |
     +--> depends on: Helm values (env vars injected)
     +--> can be parallel with: Faro SDK
     |
     v
[6. Faro SDK]
     |
     +--> depends on: App running in cluster (for testing)
     +--> can be parallel with: OTEL
     |
     v
[7. Metrics Endpoint]
     |
     +--> depends on: ServiceMonitor (for scraping)
     |
     v
[8. Renovate]
     |
     +--> depends on: All above stable
```

### Suggested Build Order

1. **Dockerfile + next.config.mjs** - Foundation for container
2. **Health endpoint** - Required for Kubernetes probes
3. **GitHub Actions workflow** - Build and push capability
4. **Helm values customization** - Deploy to cluster
5. **OTEL instrumentation** - Server-side traces
6. **Faro SDK** - Browser RUM
7. **Metrics endpoint + ServiceMonitor** - Prometheus integration
8. **Renovate config** - Automated updates

### Parallelization Opportunities

- OTEL and Faro can be developed in parallel
- Health endpoint can be developed with Dockerfile
- Renovate can be configured after first successful deployment

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Custom Server with Standalone

**What:** Using a custom server.js with `output: 'standalone'`
**Why bad:** Next.js standalone mode generates its own server.js. Custom servers are not traced.
**Instead:** Use `instrumentation.ts` hook for all initialization

### Anti-Pattern 2: Inline Faro in SSR

**What:** Initializing Faro SDK in server components
**Why bad:** Faro is browser-only. SSR will fail or produce errors.
**Instead:** Initialize in client component or useEffect with window check

### Anti-Pattern 3: Hardcoded OTEL Endpoint

**What:** Hardcoding OTLP endpoint in instrumentation.ts
**Why bad:** Can't override for different environments
**Instead:** Use `process.env.OTEL_EXPORTER_OTLP_ENDPOINT`

### Anti-Pattern 4: Static Export with API Routes

**What:** Using `output: 'export'` while expecting API routes to work
**Why bad:** Static export has no server. API routes won't function.
**Instead:** Use `output: 'standalone'` for self-hosted with API routes

### Anti-Pattern 5: ServiceMonitor Without Service

**What:** Enabling ServiceMonitor but service.enabled: false
**Why bad:** ServiceMonitor targets Services, not Pods directly
**Instead:** Ensure both `service.enabled: true` and `metrics.enabled: true`

---

## Sources

**Container Architecture:**
- [Next.js Deployment Documentation](https://nextjs.org/docs/app/getting-started/deploying) - Official docs
- [Next.js standalone output configuration](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output) - Official docs
- [Security advice for self-hosting Next.js in Docker](https://blog.arcjet.com/security-advice-for-self-hosting-next-js-in-docker/) - Best practices

**OpenTelemetry:**
- [Next.js OpenTelemetry Guide](https://nextjs.org/docs/app/guides/open-telemetry) - Official docs (HIGH confidence)
- [Complete OpenTelemetry Implementation Guide for Next.js](https://last9.io/blog/how-to-implement-opentelemetry-in-next-js/) - Implementation patterns

**Grafana Faro:**
- [Grafana Faro Web SDK](https://github.com/grafana/faro-web-sdk) - Official repository
- [Grafana Faro Next.js Example](https://github.com/grafana/faro-nextjs-example) - Official example

**ArgoCD:**
- [ArgoCD Best Practices](https://argo-cd.readthedocs.io/en/stable/user-guide/best_practices/) - Official docs
- [Helm + ArgoCD GitOps Deployment Complete Guide](https://oneuptime.com/blog/post/2026-01-17-helm-argocd-gitops-deployment/view) - Integration patterns

**Cloudflare Tunnel:**
- [Kubernetes Deployment Guide](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/deployment-guides/kubernetes/) - Official Cloudflare docs
- [Cloudflare Tunnel Ingress Controller](https://github.com/STRRL/cloudflare-tunnel-ingress-controller) - Community controller

**Prometheus/Metrics:**
- [prom-client](https://github.com/siimon/prom-client) - Official repository
- [Next.js Prometheus Discussion](https://github.com/vercel/next.js/discussions/16205) - Community patterns
