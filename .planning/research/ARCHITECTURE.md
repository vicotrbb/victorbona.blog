# Architecture Patterns

**Domain:** Next.js Blog Kubernetes Deployment with Observability
**Researched:** 2026-01-28
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

## Grafana Dashboard Provisioning via ConfigMaps

### Sidecar Discovery Pattern

Grafana in Kubernetes typically uses the **kiwigrid/k8s-sidecar** pattern for dashboard discovery. The sidecar container:

1. Watches for ConfigMaps across configured namespaces
2. Filters by a specific label (default: `grafana_dashboard: "1"`)
3. Extracts dashboard JSON from ConfigMap data
4. Writes JSON files to a mounted volume
5. Grafana reads dashboards from this volume on startup and at intervals

```
[ConfigMap with label]        [Grafana Pod]
  grafana_dashboard: "1"      +-------------------+
         |                    | sidecar container |
         |                    |  (k8s-sidecar)    |
         +---(watches)------->|        |          |
                              |        v          |
                              | /tmp/dashboards/  |
                              |        |          |
                              +-------------------+
                              | grafana container |
                              |        ^          |
                              |        |          |
                              | reads dashboards  |
                              +-------------------+
```

### Required ConfigMap Structure

For the Grafana sidecar to discover and load a dashboard, the ConfigMap must:

1. Have the correct **label** (matches sidecar configuration)
2. Contain valid **dashboard JSON** in the data section
3. Optionally include a **folder annotation** for organization

```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: victorbona-blog-dashboard
  namespace: victorbona-blog  # Same namespace as blog app
  labels:
    grafana_dashboard: "1"    # REQUIRED: sidecar discovery label
  annotations:
    # OPTIONAL: Organize into specific Grafana folder
    grafana_folder: "victorbona-blog"
data:
  victorbona-blog.json: |
    {
      "title": "victorbona.blog Analytics",
      "uid": "victorbona-blog-analytics",
      ... dashboard JSON ...
    }
```

**Critical Label:** The default label is `grafana_dashboard: "1"`. The exact label depends on your Grafana Helm chart configuration:

```yaml
# In kube-prometheus-stack or grafana values.yaml
grafana:
  sidecar:
    dashboards:
      enabled: true
      label: grafana_dashboard
      labelValue: "1"
      searchNamespace: ALL  # Or specific namespace list
```

### Namespace Considerations

The sidecar's `searchNamespace` setting determines where it looks for ConfigMaps:

| Setting | Behavior |
|---------|----------|
| `null` (default) | Only searches the namespace where Grafana is deployed |
| `ALL` | Searches all namespaces in the cluster |
| `["ns1", "ns2"]` | Searches only the specified namespaces |

**Recommendation:** If your Grafana is in `observability-system` but your app is in `victorbona-blog`, either:
- Set `searchNamespace: ALL` in Grafana config, OR
- Deploy the dashboard ConfigMap to the Grafana namespace

### Dashboard JSON for GitOps

#### Datasource References: The Portable Pattern

For dashboards to work across environments without manual UID updates, use **datasource template variables**:

```json
{
  "title": "victorbona.blog Analytics",
  "uid": "victorbona-blog-analytics",
  "templating": {
    "list": [
      {
        "name": "DS_PROMETHEUS",
        "type": "datasource",
        "query": "prometheus",
        "current": {
          "selected": false,
          "text": "default",
          "value": "default"
        },
        "hide": 0,
        "includeAll": false,
        "multi": false,
        "refresh": 1,
        "skipUrlSync": false
      },
      {
        "name": "DS_LOKI",
        "type": "datasource",
        "query": "loki",
        "current": {
          "selected": false,
          "text": "default",
          "value": "default"
        },
        "hide": 0,
        "includeAll": false,
        "multi": false,
        "refresh": 1,
        "skipUrlSync": false
      }
    ]
  },
  "panels": [
    {
      "title": "Page Views",
      "type": "timeseries",
      "datasource": {
        "type": "prometheus",
        "uid": "${DS_PROMETHEUS}"
      },
      "targets": [
        {
          "expr": "sum(rate(blog_page_views_total[5m])) by (path)",
          "legendFormat": "{{path}}"
        }
      ]
    },
    {
      "title": "Active Sessions (Faro)",
      "type": "timeseries",
      "datasource": {
        "type": "loki",
        "uid": "${DS_LOKI}"
      },
      "targets": [
        {
          "expr": "{app=\"victorbona-blog\"} |= \"session\"",
          "queryType": "range"
        }
      ]
    }
  ]
}
```

**Key Points:**
- `"type": "datasource"` in templating creates a datasource picker
- `"query": "prometheus"` or `"query": "loki"` filters to that datasource type
- Panels reference via `"uid": "${DS_PROMETHEUS}"` or `"uid": "${DS_LOKI}"`
- Users can switch datasources in the Grafana UI if multiple exist

#### Alternative: Hardcoded Datasource Names

If your environment has consistent datasource names, you can hardcode:

```json
{
  "datasource": {
    "type": "prometheus",
    "uid": "prometheus"
  }
}
```

**Trade-off:** Simpler JSON, but breaks if datasource UID differs between environments.

### Helm Template for Dashboard ConfigMap

Add to your Helm chart (`chart/templates/dashboard-configmap.yaml`):

```yaml
{{- if .Values.dashboard.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "victorbona-blog.fullname" . }}-dashboard
  labels:
    {{- include "victorbona-blog.labels" . | nindent 4 }}
    grafana_dashboard: "1"
  {{- with .Values.dashboard.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
data:
  {{ .Values.dashboard.filename | default "victorbona-blog.json" }}: |
    {{- .Values.dashboard.json | nindent 4 }}
{{- end }}
```

With values configuration:

```yaml
# chart/values.yaml
dashboard:
  enabled: true
  filename: "victorbona-blog.json"
  annotations:
    grafana_folder: "Applications"
  json: |
    {
      "title": "victorbona.blog Analytics",
      ... full dashboard JSON ...
    }
```

**Better Pattern:** Store dashboard JSON as a separate file:

```yaml
# chart/templates/dashboard-configmap.yaml
{{- if .Values.dashboard.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "victorbona-blog.fullname" . }}-dashboard
  labels:
    {{- include "victorbona-blog.labels" . | nindent 4 }}
    grafana_dashboard: "1"
  annotations:
    grafana_folder: {{ .Values.dashboard.folder | default "General" | quote }}
data:
  victorbona-blog.json: |-
{{ .Files.Get "dashboards/victorbona-blog.json" | indent 4 }}
{{- end }}
```

This allows storing `chart/dashboards/victorbona-blog.json` as a proper JSON file.

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
                              OTLPTraceExporter (HTTP)
                                         |
                                         v
                        [Alloy @ alloy.observability-system:4318]
                                         |
                                         v
                                     [Tempo]
                                         |
                                         v
                                    [Grafana]
```

**Configuration Points:**
- `OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy.observability-system.svc.cluster.local:4318`
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
- `components.web.metrics.enabled: true`
- `components.web.metrics.path: /metrics`
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

### Dashboard Provisioning Flow

```
[Git Repository]
       |
       | (push)
       v
[ArgoCD] ---(sync)---> [Kubernetes]
       |                     |
       v                     v
[Helm render]       [ConfigMap created]
       |                     |
       v                     v
[dashboard-configmap.yaml]  [Grafana sidecar watches]
                                    |
                                    v
                            [writes to /tmp/dashboards/]
                                    |
                                    v
                            [Grafana loads dashboard]
```

**GitOps Benefits:**
- Dashboard changes tracked in Git
- Rollback via Git revert
- No manual Grafana UI changes
- Consistent across environments

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
  web:
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
| ConfigMap (Dashboard) | Yes | Grafana dashboard provisioning |
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
  web:
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
    endpoint: "http://alloy.observability-system.svc.cluster.local:4318"
    protocol: "http/protobuf"
  serviceMonitor:
    enabled: true
    labels:
      release: prometheus  # Match Prometheus Operator selector

# NEW: Dashboard configuration
dashboard:
  enabled: true
  folder: "Applications"
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
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-proto');
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

### Phase Dependency Graph for v1.1 (Analytics Dashboard)

```
[1. Page View Metrics]
     |
     +--> depends on: existing /metrics endpoint
     +--> output: blog_page_views_total counter
     |
     v
[2. Verify Prometheus Scraping]
     |
     +--> depends on: metrics exposed
     +--> output: confirm data in Prometheus
     |
     v
[3. Dashboard JSON Creation]
     |
     +--> depends on: metrics available to query
     +--> depends on: Faro data in Loki
     +--> output: dashboard JSON file
     |
     v
[4. Dashboard ConfigMap Template]
     |
     +--> depends on: dashboard JSON
     +--> output: Helm template
     |
     v
[5. Values Configuration]
     |
     +--> depends on: template exists
     +--> output: dashboard.enabled: true
     |
     v
[6. ArgoCD Sync]
     |
     +--> depends on: Git push
     +--> output: Dashboard visible in Grafana
```

### Suggested Build Order for v1.1

1. **Add page view metrics to application** - Counter incremented on each request
2. **Verify Prometheus is scraping** - Check `/metrics` and Prometheus targets
3. **Create dashboard JSON** - Design in Grafana UI, export JSON
4. **Add datasource template variables** - Make dashboard portable
5. **Create Helm template for ConfigMap** - `chart/templates/dashboard-configmap.yaml`
6. **Add dashboard values configuration** - `dashboard.enabled`, folder, etc.
7. **Test locally with helm template** - Verify valid YAML output
8. **Deploy via ArgoCD** - Push to main, verify dashboard appears

### Parallelization Opportunities

- Dashboard JSON design can happen while metrics are being added
- Helm template can be drafted before dashboard JSON is finalized
- Faro/Loki queries can be tested in Grafana Explore while Prometheus panels are built

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Hardcoded Datasource UIDs

**What:** Using fixed UIDs like `"uid": "abc123xyz"` in dashboard JSON
**Why bad:** Different Grafana instances have different UIDs. Dashboard breaks when deployed elsewhere.
**Instead:** Use datasource template variables: `"uid": "${DS_PROMETHEUS}"`

### Anti-Pattern 2: Dashboard JSON in values.yaml

**What:** Embedding full dashboard JSON inline in `values.yaml`
**Why bad:** YAML escaping issues, hard to read/edit, merge conflicts
**Instead:** Use `.Files.Get` to load from separate JSON file in `chart/dashboards/`

### Anti-Pattern 3: Missing Sidecar Label

**What:** Creating ConfigMap without `grafana_dashboard: "1"` label
**Why bad:** Sidecar won't discover the dashboard, it never appears in Grafana
**Instead:** Always include the exact label expected by your Grafana sidecar config

### Anti-Pattern 4: Multiple Dashboards per ConfigMap

**What:** Putting several dashboards in one ConfigMap
**Why bad:** Sidecar has issues with multi-dashboard ConfigMaps; deletion/updates don't sync properly
**Instead:** One dashboard per ConfigMap (official recommendation)

### Anti-Pattern 5: Provisioned Dashboard Edits in UI

**What:** Expecting to edit a sidecar-provisioned dashboard via Grafana UI
**Why bad:** Changes are lost on pod restart; Grafana shows "Dashboard cannot be deleted because it was provisioned"
**Instead:** Edit the source JSON in Git, let ArgoCD sync the change

### Anti-Pattern 6: ServiceMonitor Without Service

**What:** Enabling ServiceMonitor but service.enabled: false
**Why bad:** ServiceMonitor targets Services, not Pods directly
**Instead:** Ensure both `service.enabled: true` and `metrics.enabled: true`

---

## Sources

**Grafana Sidecar Dashboard Provisioning:**
- [Grafana Helm Chart - Sidecar Configuration](https://github.com/grafana/helm-charts/blob/main/charts/grafana/values.yaml) - Official values.yaml with sidecar.dashboards options
- [kube-prometheus-stack README](https://github.com/prometheus-community/helm-charts/blob/main/charts/kube-prometheus-stack/README.md) - Dashboard provisioning in Prometheus stack
- [Provision Grafana Dashboards and Alerts Using Helm and Sidecars](https://medium.com/cloud-native-daily/provision-grafana-dashboards-and-alerts-using-helm-and-sidecars-733dcd223037) - Comprehensive guide with examples

**Dashboard JSON Model:**
- [Grafana Dashboard JSON Model](https://grafana.com/docs/grafana/latest/dashboards/build-dashboards/view-dashboard-json-model/) - Official JSON structure documentation
- [Grafana Provisioning Documentation](https://grafana.com/docs/grafana/latest/administration/provisioning/) - Datasource and dashboard provisioning

**Datasource Portability:**
- [Should provisioned dashboards have datasource uids?](https://community.grafana.com/t/should-provisioned-dashboards-have-datasource-uids/65463) - Community discussion on portable dashboards
- [How to fix DS_PROMETHEUS not found](https://community.grafana.com/t/how-to-fix-error-updating-options-datasource-named-ds-prometheus-was-not-found-in-provisioned-dashboard/46538) - Solution for datasource template variables

**Container Architecture:**
- [Next.js Deployment Documentation](https://nextjs.org/docs/app/getting-started/deploying) - Official docs
- [Next.js standalone output configuration](https://nextjs.org/docs/pages/api-reference/config/next-config-js/output) - Official docs

**OpenTelemetry:**
- [Next.js OpenTelemetry Guide](https://nextjs.org/docs/app/guides/open-telemetry) - Official docs (HIGH confidence)

**Grafana Faro:**
- [Grafana Faro Web SDK](https://github.com/grafana/faro-web-sdk) - Official repository
