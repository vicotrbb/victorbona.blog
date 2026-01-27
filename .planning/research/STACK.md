# Technology Stack

**Project:** victorbona.blog Kubernetes Deployment with Observability
**Researched:** 2026-01-26
**Overall Confidence:** MEDIUM-HIGH

## Executive Summary

This document specifies the recommended technology stack for containerizing the existing Next.js blog and adding full observability (OpenTelemetry traces, Grafana Faro RUM). The stack is optimized for a home Kubernetes cluster deployment with GHCR image storage and ArgoCD GitOps.

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
npm install \
  @vercel/otel \
  @opentelemetry/sdk-logs \
  @opentelemetry/api-logs \
  @opentelemetry/instrumentation \
  @opentelemetry/exporter-trace-otlp-grpc \
  @grafana/faro-web-sdk \
  @grafana/faro-web-tracing \
  @grafana/faro-react
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
    "@grafana/faro-react": "^2.0.0"
  }
}
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

---

## Open Questions / Gaps

1. **Faro exact versions**: npm registry not directly fetchable; versions marked as `^2.0.0` based on documentation references to v2. Verify with `npm info @grafana/faro-web-sdk` at implementation time.

2. **OpenTelemetry version alignment**: The OTEL ecosystem has many packages that need version alignment. Check for peer dependency warnings during install.

3. **Edge Runtime compatibility**: If using Next.js Edge Runtime for any routes, `@vercel/otel` handles it automatically, but manual NodeSDK configuration does NOT work in Edge.

4. **Alloy configuration**: The Faro receiver configuration on Alloy side needs to be set up separately. Ensure CORS is configured for browser requests.
