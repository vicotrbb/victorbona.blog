# Technology Stack

**Project:** victorbona.blog Kubernetes Deployment with Observability
**Researched:** 2026-01-26 (initial), 2026-01-28 (analytics milestone update)
**Overall Confidence:** MEDIUM-HIGH

## Executive Summary

This document specifies the recommended technology stack for containerizing the existing Next.js blog and adding full observability (OpenTelemetry traces, Grafana Faro RUM). The stack is optimized for a home Kubernetes cluster deployment with GHCR image storage and ArgoCD GitOps.

**Analytics Milestone Addition (2026-01-28):** Added stack for page analytics metrics and Grafana dashboard provisioning.

---

## Docker / Container Stack

### Recommended Approach: Multi-Stage Build with Distroless

| Technology | Version/Tag | Purpose | Confidence |
|------------|-------------|---------|------------|
| `node:22-alpine` | `22-alpine3.23` | Build stage base image | HIGH |
| `gcr.io/distroless/nodejs22-debian12` | `:nonroot` | Production runner image | MEDIUM |
| Next.js standalone output | `output: 'standalone'` | Optimized production bundle | HIGH |

**Rationale:**

- **node:22-alpine for builds**: 153MB compressed, sufficient for npm install and next build. Pin to `22-alpine3.23` for reproducibility.
- **Distroless for production**: 141MB, minimal attack surface (no shell, no package manager), only 15 CVEs (0 critical/high). The `:nonroot` tag runs as non-root user for security.
- **Standalone output**: Next.js bundles only required dependencies, resulting in ~50-100MB application size vs 500MB+ with full node_modules.

**Alternative Considered:**

| Option | Why Not |
|--------|---------|
| `node:22-alpine` for runner | Larger image (~153MB vs 141MB), includes shell and unnecessary tooling |
| `node:22-slim` | 240MB, larger attack surface |
| Full `node:22` | 1.12GB, excessive for production |

**Tradeoff:** Distroless has no shell, making container debugging harder. Use `:debug-nonroot` tag in staging environments if shell access is needed.

### Docker Configuration Requirements

```dockerfile
# next.config.mjs must include:
output: 'standalone'
```

**Critical:** The existing `next.config.mjs` needs modification to enable standalone output mode.

### Dockerfile Structure

```dockerfile
# Build stage
FROM node:22-alpine3.23 AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production=false
COPY . .
RUN npm run build

# Production stage
FROM gcr.io/distroless/nodejs22-debian12:nonroot AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["server.js"]
```

**Sources:**
- [Next.js Docker Discussion #16995](https://github.com/vercel/next.js/discussions/16995)
- [GoogleContainerTools/distroless](https://github.com/GoogleContainerTools/distroless/blob/main/nodejs/README.md)
- [Arcjet Security Advice](https://blog.arcjet.com/security-advice-for-self-hosting-next-js-in-docker/)

---

## OpenTelemetry Instrumentation

### Recommended Stack

| Package | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| `@vercel/otel` | `^2.1.0` | OTEL wrapper for Next.js | HIGH |
| `@opentelemetry/sdk-logs` | `^0.205.0` | Logging SDK (peer dep) | HIGH |
| `@opentelemetry/api-logs` | `^0.205.0` | Logging API (peer dep) | HIGH |
| `@opentelemetry/instrumentation` | `^0.205.0` | Instrumentation core (peer dep) | HIGH |
| `@opentelemetry/exporter-trace-otlp-grpc` | Latest | gRPC exporter to Alloy | MEDIUM |

**Rationale:**

- **@vercel/otel** is the official Vercel/Next.js maintained package. It handles both Node.js and Edge runtime automatically, provides sane defaults, and eliminates manual SDK configuration.
- For **gRPC export** to Alloy, you need `@opentelemetry/exporter-trace-otlp-grpc` since `@vercel/otel` defaults to HTTP/protobuf.

### Installation

```bash
npm install @vercel/otel @opentelemetry/sdk-logs @opentelemetry/api-logs @opentelemetry/instrumentation
# For gRPC export to Alloy:
npm install @opentelemetry/exporter-trace-otlp-grpc @opentelemetry/sdk-trace-node
```

### Configuration Files

**instrumentation.ts** (root of project or src/):

```typescript
import { registerOTel } from '@vercel/otel'

export function register() {
  registerOTel({
    serviceName: 'victorbona-blog',
  })
}
```

**For gRPC to Alloy with custom exporter:**

```typescript
// instrumentation.node.ts
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc'
import { resourceFromAttributes } from '@opentelemetry/resources'
import { NodeSDK } from '@opentelemetry/sdk-node'
import { BatchSpanProcessor } from '@opentelemetry/sdk-trace-node'
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions'

const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: 'victorbona-blog',
  }),
  spanProcessor: new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT,
    })
  ),
})
sdk.start()
```

### Environment Variables

```bash
# For gRPC to Alloy (port 4317)
OTEL_EXPORTER_OTLP_ENDPOINT=http://alloy.observability-system.svc.cluster.local:4317
OTEL_EXPORTER_OTLP_PROTOCOL=grpc
OTEL_SERVICE_NAME=victorbona-blog
OTEL_RESOURCE_ATTRIBUTES=service.namespace=blog,deployment.environment=production
```

**Key Note:** The gRPC exporter expects hostname:port only, NOT a path like `/v1/traces`. Use port 4317 for gRPC (4318 is for HTTP).

**Sources:**
- [Next.js OpenTelemetry Guide](https://nextjs.org/docs/app/guides/open-telemetry)
- [@vercel/otel npm](https://www.npmjs.com/package/@vercel/otel)
- [OpenTelemetry OTLP Exporter Configuration](https://opentelemetry.io/docs/languages/sdk-configuration/otlp-exporter/)
- [OpenTelemetry JS Exporters](https://opentelemetry.io/docs/languages/js/exporters/)

---

## Grafana Faro RUM (Browser SDK)

### Recommended Stack

| Package | Version | Purpose | Confidence |
|---------|---------|---------|------------|
| `@grafana/faro-web-sdk` | `^2.0.0` | Core Faro SDK | MEDIUM |
| `@grafana/faro-web-tracing` | `^2.0.0` | Browser tracing instrumentation | MEDIUM |
| `@grafana/faro-react` | `^2.0.0` | React-specific integration | MEDIUM |

**Rationale:**

- Faro v2 is the current major version with modernized APIs, Web Vitals v5 support (INP instead of deprecated FID), and cleaner tracing.
- `@grafana/faro-web-tracing` enables correlation between browser and backend spans.
- `@grafana/faro-react` provides React-specific hooks and error boundaries.

### Installation

```bash
npm install @grafana/faro-web-sdk @grafana/faro-web-tracing @grafana/faro-react
```

### Client Component Implementation

Create `app/components/FaroInit.tsx`:

```tsx
'use client'

import { useEffect, useRef } from 'react'
import { initializeFaro, getWebInstrumentations } from '@grafana/faro-web-sdk'
import { TracingInstrumentation } from '@grafana/faro-web-tracing'

export function FaroInit() {
  const initialized = useRef(false)

  useEffect(() => {
    if (initialized.current) return
    initialized.current = true

    initializeFaro({
      url: process.env.NEXT_PUBLIC_FARO_URL || 'https://faro.bonalab.org/collect',
      app: {
        name: 'victorbona-blog',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
      },
      instrumentations: [
        ...getWebInstrumentations(),
        new TracingInstrumentation(),
      ],
    })
  }, [])

  return null
}
```

Add to root layout (`app/layout.tsx`):

```tsx
import { FaroInit } from './components/FaroInit'

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <FaroInit />
        {children}
      </body>
    </html>
  )
}
```

### Environment Variables

```bash
# Client-side (must be NEXT_PUBLIC_)
NEXT_PUBLIC_FARO_URL=https://faro.bonalab.org/collect
NEXT_PUBLIC_APP_VERSION=1.0.0
```

**Note:** The Faro URL points to your Alloy instance with faro.receiver enabled. Alloy must have CORS configured to accept requests from your blog domain.

### Alloy Configuration (Reference)

Your Alloy instance needs `faro.receiver` configured:

```alloy
faro.receiver "default" {
  server {
    listen_address = "0.0.0.0"
    listen_port = 12345
    cors_allowed_origins = ["https://blog.victorbona.dev", "https://victorbona.blog"]
  }

  output {
    logs = [loki.write.default.receiver]
    traces = [otelcol.exporter.otlp.traces.input]
  }
}
```

**Sources:**
- [Grafana Faro Web SDK](https://github.com/grafana/faro-web-sdk)
- [Grafana Faro Next.js Example](https://github.com/grafana/faro-nextjs-example)
- [Faro Receiver Documentation](https://grafana.com/docs/alloy/latest/reference/components/faro/faro.receiver/)
- [Faro + OTEL Integration Guide](https://hackmd.io/@lilybon/faro-web-sdk-and-opentelemetry)

---

## Prometheus Metrics (prom-client)

**Status:** Already integrated - existing `prom-client` ^15.1.3 at `/metrics` endpoint.

The existing metrics module at `app/lib/metrics.ts` provides:
- Singleton `metricsRegistry` with HMR resilience
- Default Node.js metrics (CPU, memory, event loop, GC)
- ServiceMonitor for Prometheus scraping

---

## Page Analytics Metrics (NEW - Analytics Milestone)

### User Agent Parsing Library

#### Recommendation: `bowser` v2.13.1

| Aspect | Value |
|--------|-------|
| Package | `bowser` |
| Version | 2.13.1 (latest as of 2026-01-28) |
| License | MIT |
| Weekly Downloads | ~18.7M |
| Bundle Size | ~4.9 KB minified + gzipped |

**Why bowser over alternatives:**

| Library | Version | License | Recommendation |
|---------|---------|---------|----------------|
| **bowser** | 2.13.1 | MIT | **USE THIS** - MIT license, actively maintained, lightweight |
| ua-parser-js | 2.0.8 | AGPL-3.0 | AVOID - AGPL requires source disclosure for server-side use |
| useragent | 2.3.0 | MIT | AVOID - Requires separate `useragent-update` for current data |

**Critical note on ua-parser-js:** As of v2.0, ua-parser-js switched from MIT to AGPL-3.0 + commercial license. AGPL requires disclosing source code of any server-side application using the library. For a personal blog this might be acceptable, but bowser provides equivalent functionality under MIT with no legal complexity.

**Sources:**
- [bowser npm](https://www.npmjs.com/package/bowser) - MIT license, 18.7M weekly downloads
- [bowser GitHub](https://github.com/bowser-js/bowser) - API documentation
- [ua-parser-js License Change Analysis](https://blog.logrocket.com/user-agent-detection-ua-parser-js-license-change/) - AGPL implications

#### API Usage Pattern

```typescript
import Bowser from 'bowser'

// In request handler or middleware
const ua = request.headers.get('user-agent') ?? ''
const result = Bowser.parse(ua)

// Result structure:
// {
//   browser: { name: 'Chrome', version: '120.0' },
//   os: { name: 'macOS', version: '14.2' },
//   platform: { type: 'desktop' },  // or 'mobile', 'tablet'
//   engine: { name: 'Blink' }
// }

// For metrics labels (LOW cardinality):
const browserFamily = result.browser.name ?? 'unknown'  // Chrome, Safari, Firefox, etc.
const platformType = result.platform.type ?? 'unknown'  // desktop, mobile, tablet
const osFamily = result.os.name ?? 'unknown'           // Windows, macOS, Linux, iOS, Android
```

#### Installation

```bash
npm install bowser@^2.13.1
```

TypeScript types are included - no separate `@types/bowser` needed.

### Prometheus Metrics Design

#### Cardinality Guidelines (CRITICAL)

From Prometheus best practices:
- Keep cardinality below 10 per metric where possible
- Never use high-cardinality labels (user IDs, full URLs, IP addresses)
- Use route patterns, not actual paths with parameters

**For this blog:** Since we have static routes (finite set of blog posts), using `path` as a label is acceptable. If you had dynamic routes like `/users/:id`, you'd need to normalize to patterns.

**Sources:**
- [Prometheus Labels Best Practices](https://middleware.io/blog/prometheus-labels/) - Cardinality guidelines
- [Managing High Cardinality Metrics](https://last9.io/blog/how-to-manage-high-cardinality-metrics-in-prometheus/) - Keep labels under 10
- [prom-client GitHub](https://github.com/siimon/prom-client) - Counter API with labels

#### Recommended Metrics

Using existing `metricsRegistry` singleton pattern:

```typescript
import { Counter } from 'prom-client'
import { metricsRegistry } from '@/app/lib/metrics'

// 1. Page Views - Counter with path label
export const pageViewsTotal = new Counter({
  name: 'blog_page_views_total',
  help: 'Total page views by path',
  labelNames: ['path'] as const,
  registers: [metricsRegistry],
})

// 2. Page Views by Browser Family - Counter
export const pageViewsByBrowser = new Counter({
  name: 'blog_page_views_by_browser_total',
  help: 'Total page views by browser family',
  labelNames: ['browser'] as const,  // Chrome, Safari, Firefox, Edge, etc.
  registers: [metricsRegistry],
})

// 3. Page Views by Platform Type - Counter
export const pageViewsByPlatform = new Counter({
  name: 'blog_page_views_by_platform_total',
  help: 'Total page views by platform type',
  labelNames: ['platform'] as const,  // desktop, mobile, tablet
  registers: [metricsRegistry],
})

// 4. Referrers - Counter (OPTIONAL, watch cardinality)
export const referrerTotal = new Counter({
  name: 'blog_referrers_total',
  help: 'Total page views by referrer domain',
  labelNames: ['referrer'] as const,  // Normalize to domain only!
  registers: [metricsRegistry],
})
```

#### Incrementing Pattern

```typescript
// In middleware or page component
pageViewsTotal.inc({ path: '/blog/my-post' })
pageViewsByBrowser.inc({ browser: browserFamily })
pageViewsByPlatform.inc({ platform: platformType })

// For referrer, normalize to domain to limit cardinality:
const referrerDomain = referrer
  ? new URL(referrer).hostname
  : 'direct'
referrerTotal.inc({ referrer: referrerDomain })
```

#### Referrer Cardinality Warning

Referrer tracking can explode cardinality if you see traffic from many unique domains. Mitigation strategies:

1. **Normalize aggressively:** Strip `www.`, use only top-level domain
2. **Allowlist:** Only track known referrers (google.com, twitter.com, etc.), bucket rest as "other"
3. **Skip entirely:** If traffic is low, referrer tracking may not be valuable

**Recommendation:** Start with allowlist approach - track top 10-15 referrer domains, bucket rest as "other".

---

## Grafana Dashboard Provisioning (NEW - Analytics Milestone)

### Approach: ConfigMap with Sidecar Labels

The Grafana Helm chart includes a sidecar container that watches for ConfigMaps with specific labels and automatically provisions them as dashboards.

**No changes to Grafana Helm values needed** if sidecar is already enabled (standard in most observability stacks).

**Sources:**
- [Grafana Helm Chart values.yaml](https://github.com/grafana/helm-charts/blob/main/charts/grafana/values.yaml) - Sidecar configuration reference
- [Provision Grafana Dashboards Using Helm and Sidecars](https://medium.com/cloud-native-daily/provision-grafana-dashboards-and-alerts-using-helm-and-sidecars-733dcd223037) - ConfigMap pattern
- [Grafana Official Provisioning Docs](https://grafana.com/docs/grafana/latest/administration/provisioning/) - Native provisioning system

### ConfigMap Structure

Create in your Helm chart templates:

```yaml
# chart/templates/grafana-dashboard.yaml
{{- if .Values.observability.grafanaDashboard.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "app-template.fullname" . }}-dashboard
  namespace: {{ .Values.observability.grafanaDashboard.namespace | default "observability-system" }}
  labels:
    grafana_dashboard: "1"
    {{- include "app-template.commonLabels" . | nindent 4 }}
  {{- with .Values.observability.grafanaDashboard.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
data:
  victorbona-blog.json: |-
    {{ .Files.Get "dashboards/victorbona-blog.json" | nindent 4 }}
{{- end }}
```

### values.yaml Addition

```yaml
observability:
  # ... existing config ...

  grafanaDashboard:
    enabled: true
    # Namespace where Grafana runs (sidecar watches this namespace)
    namespace: "observability-system"
    # Optional: folder annotation for dashboard organization
    annotations:
      grafana_folder: "Applications"
```

### Key Sidecar Configuration (Reference)

Standard Grafana Helm chart sidecar config (verify your cluster's Grafana matches):

```yaml
# In Grafana Helm values (NOT your blog chart)
sidecar:
  dashboards:
    enabled: true
    label: grafana_dashboard
    labelValue: "1"
    searchNamespace: ALL  # or specific namespace
    folder: /tmp/dashboards
```

### Dashboard JSON Location

Place dashboard JSON file at: `chart/dashboards/victorbona-blog.json`

The dashboard JSON can be:
1. Hand-crafted
2. Exported from Grafana UI
3. Generated by Grafonnet (overkill for a blog)

### Cross-Namespace Considerations

If your blog deploys to `blog` namespace but Grafana runs in `observability-system`:

- **Option A:** Deploy ConfigMap to Grafana's namespace (requires cross-namespace Helm magic or separate manifest)
- **Option B:** Set Grafana sidecar `searchNamespace: ALL` to find ConfigMaps cluster-wide
- **Option C:** Deploy ConfigMap to Grafana's namespace via ArgoCD as separate resource

**Recommendation:** Option B (searchNamespace: ALL) if sidecar already configured this way, otherwise Option C (separate ArgoCD Application) keeps concerns separated.

---

## Renovate for ArgoCD GitOps

### Configuration

Renovate requires explicit file matching for ArgoCD since it cannot auto-detect ArgoCD manifests.

**renovate.json:**

```json
{
  "$schema": "https://docs.renovatebot.com/renovate-schema.json",
  "extends": [
    "config:recommended",
    "docker:enableMajor",
    ":semanticCommits"
  ],
  "argocd": {
    "managerFilePatterns": ["/chart/.+\\.yaml$/"]
  },
  "packageRules": [
    {
      "matchManagers": ["argocd"],
      "matchDatasources": ["docker"],
      "registryUrls": ["https://ghcr.io"]
    },
    {
      "matchPackageNames": ["ghcr.io/vicotrbb/victorbona.blog"],
      "automerge": false,
      "groupName": "blog-image"
    }
  ],
  "docker": {
    "pinDigests": true
  }
}
```

**Key Configuration Points:**

| Setting | Purpose |
|---------|---------|
| `managerFilePatterns` | Match your chart/deployment YAML files |
| `pinDigests` | Pin Docker images by digest for reproducibility |
| `docker:enableMajor` | Allow major version updates for base images |

### Supported Datasources for ArgoCD

Renovate's ArgoCD manager supports:
- **Docker**: Container image updates
- **Git tags**: Git repository references
- **Helm**: Helm chart versions

### Alternative: Image Update Automation

If using ArgoCD Image Updater instead of Renovate for image updates:

```yaml
# Annotation on ArgoCD Application
argocd-image-updater.argoproj.io/image-list: blog=ghcr.io/vicotrbb/victorbona.blog
argocd-image-updater.argoproj.io/blog.update-strategy: semver
```

**Sources:**
- [Renovate ArgoCD Manager](https://docs.renovatebot.com/modules/manager/argocd/)
- [Renovate GitOps Patterns](https://blog.azaurus.dev/continuous-gitops-using-renovate-for-helm-version-management-in-argocd/)

---

## GitHub Actions CI/CD

### Recommended Workflow

**Actions to use:**

| Action | Version | Purpose |
|--------|---------|---------|
| `docker/setup-buildx-action` | `v3` | Multi-arch builds |
| `docker/login-action` | `v3` | GHCR authentication |
| `docker/metadata-action` | `v5` | Image tagging |
| `docker/build-push-action` | `v6` | Build and push |

### Workflow Configuration

**.github/workflows/build-push.yaml:**

```yaml
name: Build and Push

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:

env:
  REGISTRY: ghcr.io
  IMAGE_NAME: ${{ github.repository }}

jobs:
  build-push:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      packages: write
      attestations: write
      id-token: write

    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Set up QEMU
        uses: docker/setup-qemu-action@v3

      - name: Set up Docker Buildx
        uses: docker/setup-buildx-action@v3

      - name: Log in to GHCR
        uses: docker/login-action@v3
        with:
          registry: ${{ env.REGISTRY }}
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Extract metadata
        id: meta
        uses: docker/metadata-action@v5
        with:
          images: ${{ env.REGISTRY }}/${{ env.IMAGE_NAME }}
          tags: |
            type=semver,pattern={{version}}
            type=semver,pattern={{major}}.{{minor}}
            type=sha,prefix=

      - name: Build and push
        uses: docker/build-push-action@v6
        with:
          context: .
          platforms: linux/amd64,linux/arm64
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

**Key Features:**

- **Multi-arch builds**: `linux/amd64,linux/arm64` for both x86 and ARM nodes
- **Smart tagging**: Semantic versioning from git tags, plus commit SHA
- **Build caching**: GitHub Actions cache for faster builds
- **Attestations**: Supply chain security with signed attestations

**Sources:**
- [GitHub Docs: Publishing Docker images](https://docs.github.com/actions/guides/publishing-docker-images)
- [Docker Build Push Action](https://github.com/marketplace/actions/docker-build-push-action)
- [GHCR Documentation](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)

---

## Complete Package Dependencies

### Production Dependencies to Add

```bash
# Original observability stack
npm install \
  @vercel/otel \
  @opentelemetry/sdk-logs \
  @opentelemetry/api-logs \
  @opentelemetry/instrumentation \
  @opentelemetry/exporter-trace-otlp-grpc \
  @grafana/faro-web-sdk \
  @grafana/faro-web-tracing \
  @grafana/faro-react

# Analytics milestone addition
npm install bowser@^2.13.1
```

### Full package.json Additions

```json
{
  "dependencies": {
    "@vercel/otel": "^2.1.0",
    "@opentelemetry/sdk-logs": "^0.205.0",
    "@opentelemetry/api-logs": "^0.205.0",
    "@opentelemetry/instrumentation": "^0.205.0",
    "@opentelemetry/exporter-trace-otlp-grpc": "^0.205.0",
    "@grafana/faro-web-sdk": "^2.0.0",
    "@grafana/faro-web-tracing": "^2.0.0",
    "@grafana/faro-react": "^2.0.0",
    "bowser": "^2.13.1"
  }
}
```

---

## What NOT to Add (Analytics Milestone)

| Technology | Why Not |
|------------|---------|
| **Separate analytics database** | Overkill - Prometheus time-series is sufficient for blog-scale |
| **@grafana/grafana-foundation-sdk** | Generates dashboard JSON programmatically - overkill for 1 dashboard |
| **ua-parser-js v2** | AGPL license requires source disclosure |
| **express-useragent** | Tied to Express.js, doesn't fit Next.js App Router |
| **OpenTelemetry Metrics** | Already using prom-client, no need to add complexity |

---

## File Structure After Analytics Implementation

```
app/
  lib/
    metrics.ts          # Existing - add new counters here
    user-agent.ts       # NEW - bowser parsing utility
  middleware.ts         # NEW or extended - increment counters on requests

chart/
  dashboards/
    victorbona-blog.json  # NEW - Grafana dashboard JSON
  templates/
    grafana-dashboard.yaml  # NEW - ConfigMap for dashboard
  values.yaml             # Updated - add grafanaDashboard config
```

---

## Confidence Assessment

| Component | Confidence | Reasoning |
|-----------|------------|-----------|
| Docker multi-stage + distroless | HIGH | Well-documented pattern, multiple authoritative sources |
| @vercel/otel for OTEL | HIGH | Official Next.js documentation, maintained by Vercel |
| gRPC exporter configuration | MEDIUM | OTEL env vars documented, but gRPC specifics vary by version |
| Faro SDK v2 | MEDIUM | v2 released, but exact version numbers from npm not directly verified |
| Renovate ArgoCD | HIGH | Official Renovate documentation |
| GitHub Actions | HIGH | Official Docker and GitHub documentation |
| bowser UA parsing | HIGH | Verified npm version (2.13.1), MIT license, 18.7M weekly downloads |
| prom-client Counters | HIGH | Already in use, verified Counter API pattern |
| Dashboard Provisioning | HIGH | Standard k8s-sidecar pattern, verified Grafana Helm values |
| Cardinality Design | MEDIUM | Best practices verified, but actual cardinality depends on traffic patterns |

---

## Open Questions / Gaps

1. **Faro exact versions**: npm registry not directly fetchable; versions marked as `^2.0.0` based on documentation references to v2. Verify with `npm info @grafana/faro-web-sdk` at implementation time.

2. **OpenTelemetry version alignment**: The OTEL ecosystem has many packages that need version alignment. Check for peer dependency warnings during install.

3. **Edge Runtime compatibility**: If using Next.js Edge Runtime for any routes, `@vercel/otel` handles it automatically, but manual NodeSDK configuration does NOT work in Edge.

4. **Alloy configuration**: The Faro receiver configuration on Alloy side needs to be set up separately. Ensure CORS is configured for browser requests.

5. **Grafana sidecar searchNamespace**: Verify whether your Grafana's sidecar is configured with `searchNamespace: ALL` or a specific namespace to determine where to deploy the dashboard ConfigMap.
