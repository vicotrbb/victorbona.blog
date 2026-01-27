# Domain Pitfalls: Next.js Kubernetes Deployment with Observability

**Domain:** Next.js containerization for Kubernetes with OTEL/Faro observability
**Researched:** 2026-01-26
**Project Context:** Next.js canary, App Router, Tailwind v4 alpha, traces to Alloy, RUM to Faro, Cloudflare Tunnel ingress, ArgoCD GitOps with Renovate

---

## Critical Pitfalls

Mistakes that cause deployment failures, broken observability, or require significant rework.

---

### Pitfall 1: Using npm/yarn to Start Container (SIGTERM Handling)

**What goes wrong:** Container ignores SIGTERM signal during Kubernetes pod termination. Pod receives requests during shutdown, causing 502 errors to users. Kubernetes eventually sends SIGKILL after grace period, forcefully terminating in-flight requests.

**Why it happens:** When using `CMD ["npm", "start"]` in Dockerfile, npm spawns Node as a child process. SIGTERM is sent to PID 1 (npm), which doesn't forward it to Node. Next.js server never receives shutdown signal.

**Consequences:**
- Requests fail during rolling deployments
- Connection errors during scale-down
- User-facing 502/503 errors during any pod lifecycle event
- No graceful draining of in-flight requests

**Prevention:**
```dockerfile
# WRONG - npm doesn't forward SIGTERM
CMD ["npm", "start"]

# CORRECT - Node receives SIGTERM directly as PID 1
CMD ["node", "server.js"]
```

Additionally, set `NEXT_MANUAL_SIG_HANDLE=true` environment variable and implement signal handlers if using custom server.

**Detection:**
- Watch pod termination during deploys: `kubectl logs -f <pod> --previous`
- Look for abrupt termination without "graceful shutdown" messages
- Monitor 502 errors during deployments

**Phase to address:** Dockerfile creation phase

**Sources:**
- [RisingStack: Graceful shutdown with Node.js and Kubernetes](https://blog.risingstack.com/graceful-shutdown-node-js-kubernetes/)
- [Next.js Discussion #19693: Graceful shutdown](https://github.com/vercel/next.js/discussions/19693)
- [DEV.to: Top Mistakes When Deploying Next.js Apps](https://dev.to/kuberns_cloud/top-mistakes-when-deploying-nextjs-apps-170f)

---

### Pitfall 2: HOSTNAME Environment Variable Override

**What goes wrong:** Next.js standalone server fails to bind to correct network interface, making container unreachable in Kubernetes. Health checks fail, pods restart in CrashLoopBackOff.

**Why it happens:** Since Next.js 13.4, the standalone server reads `HOSTNAME` environment variable to determine bind address. Kubernetes/Docker sets `HOSTNAME` to container ID by default. Next.js tries to bind to that string instead of `0.0.0.0`.

**Consequences:**
- Container starts but doesn't accept connections
- Health probes fail immediately
- Service load balancer can't reach pods
- Difficult to debug (logs show "started" but nothing works)

**Prevention:**
```dockerfile
# In Dockerfile
ENV HOSTNAME="0.0.0.0"
```

Or in Kubernetes deployment:
```yaml
env:
  - name: HOSTNAME
    value: "0.0.0.0"
```

**Detection:**
- Health probes fail on new pods
- `kubectl exec` into pod and `curl localhost:3000` works but external doesn't
- Logs show server started on unexpected interface

**Phase to address:** Dockerfile creation phase

**Sources:**
- [GitHub Issue #58657: AWS ECS Docker deploy HOSTNAME override](https://github.com/vercel/next.js/issues/58657)
- [Markus Oberlehner: Running Next.js with Docker](https://markus.oberlehner.net/blog/running-nextjs-with-docker)

---

### Pitfall 3: OTEL NodeSDK in Edge Runtime

**What goes wrong:** Build fails or runtime errors when OpenTelemetry SDK is imported in edge runtime context. Error: "Module not found" or "process is not defined".

**Why it happens:** `@opentelemetry/sdk-node` requires Node.js APIs (file system, process) that don't exist in Edge runtime. Next.js analyzes all imports at build time, including for edge routes.

**Consequences:**
- Build failures blocking deployment
- Runtime crashes on edge routes
- No traces from edge middleware/routes

**Prevention:**
```typescript
// instrumentation.ts
export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    await import('./instrumentation.node')
  }
  // Edge runtime gets no-op or @vercel/otel
}
```

Keep `@opentelemetry/sdk-node` and related packages in a separate `instrumentation.node.ts` file that's only imported conditionally.

**Detection:**
- Build errors mentioning "fs" or "process" in edge context
- Runtime errors in middleware routes
- Missing spans from edge functions

**Phase to address:** OTEL instrumentation phase

**Sources:**
- [Next.js OpenTelemetry Guide](https://nextjs.org/docs/app/guides/open-telemetry)
- [GitHub Issue #86479: Instrumentation hook edge runtime analysis](https://github.com/vercel/next.js/issues/86479)
- [Highlight.io: Complete guide to OpenTelemetry in Next.js](https://www.highlight.io/blog/the-complete-guide-to-opentelemetry-in-next-js)

---

### Pitfall 4: Sharp Missing in Standalone Output

**What goes wrong:** Image optimization fails with error: "'sharp' is required to be installed in standalone mode for the image optimization to function correctly."

**Why it happens:** Next.js standalone output doesn't include all node_modules. Sharp is an optional peer dependency that needs explicit installation. Multi-stage Docker builds often miss copying sharp's native binaries.

**Consequences:**
- All `<Image>` components fail to render
- Fallback to unoptimized images (massive payload)
- 500 errors on `/_next/image` routes

**Prevention:**
```dockerfile
# In Dockerfile - install sharp for the target platform
FROM node:20-alpine AS deps
RUN npm install sharp

# In final stage, copy sharp specifically
COPY --from=deps /app/node_modules/.pnpm/sharp* ./node_modules/.pnpm/
```

Or disable image optimization if not needed:
```javascript
// next.config.mjs
export default {
  images: {
    unoptimized: true,
  },
}
```

**Detection:**
- Check `/_next/image?url=...` routes return 500
- Console errors about sharp
- Massive image payload sizes in network tab

**Phase to address:** Dockerfile creation phase

**Sources:**
- [Next.js Discussion #59460: Sharp required in standalone mode](https://github.com/vercel/next.js/discussions/59460)
- [Next.js Docs: Install sharp](https://nextjs.org/docs/messages/install-sharp)
- [DEV.to: NextJs Deployment with Docker Complete Guide 2025](https://dev.to/codeparrot/nextjs-deployment-with-docker-complete-guide-for-2025-3oe8)

---

### Pitfall 5: NEXT_PUBLIC Variables Frozen at Build Time

**What goes wrong:** Environment-specific configuration (API URLs, feature flags) is hardcoded into the JavaScript bundle. Same Docker image behaves differently than expected across environments.

**Why it happens:** Next.js inlines `NEXT_PUBLIC_*` variables during build. Docker image built in CI has CI's values permanently embedded. Runtime environment variables are ignored for these.

**Consequences:**
- Production pointing to staging APIs
- Feature flags stuck in wrong state
- Need to rebuild image per environment (defeating container portability)
- Security: secrets might be in bundle

**Prevention:**

Option 1: Use server-side only environment variables and expose via API route:
```typescript
// app/api/config/route.ts
export async function GET() {
  return Response.json({
    apiUrl: process.env.API_URL, // Not NEXT_PUBLIC_
  })
}
```

Option 2: Runtime replacement script in Docker entrypoint:
```bash
#!/bin/sh
# Replace placeholders at container start
find /app/.next -type f -name "*.js" -exec sed -i "s|PLACEHOLDER_API_URL|$API_URL|g" {} +
exec "$@"
```

Option 3: Use `publicRuntimeConfig` (Pages Router only, deprecated approach).

**Detection:**
- Grep built JS for hardcoded values: `grep -r "staging.api" .next/`
- Different behavior between local and deployed
- Environment variables not taking effect

**Phase to address:** Dockerfile creation phase, architecture planning

**Sources:**
- [DEV.to: Next.js with Public Environment Variables in Docker](https://dev.to/vorillaz/nextjs-with-public-environment-variables-in-docker-4ogf)
- [Next.js Discussion #17641: Docker image with NEXT_PUBLIC_ env variables](https://github.com/vercel/next.js/discussions/17641)
- [ABGEO.dev: Dynamic Environment Variables in Dockerized Next.js](https://www.abgeo.dev/blog/dynamic-environment-variables-dockerized-nextjs/)

---

## Moderate Pitfalls

Mistakes that cause degraded observability, operational issues, or technical debt.

---

### Pitfall 6: instrumentation.ts File Location

**What goes wrong:** OpenTelemetry instrumentation silently doesn't run. No traces appear in backend, but no errors either.

**Why it happens:** Next.js has strict requirements for instrumentation file location:
- Must be in project root OR `src/` folder
- Must NOT be inside `app/` or `pages/` directories
- Must match `pageExtensions` if configured

**Prevention:**
```
# Correct locations:
/instrumentation.ts        # Project root
/src/instrumentation.ts    # If using src directory

# WRONG locations:
/app/instrumentation.ts
/pages/instrumentation.ts
/lib/instrumentation.ts
```

**Detection:**
- Add `console.log('Instrumentation loaded')` at top of file
- Check server logs at startup
- Verify with `OTEL_LOG_LEVEL=debug`

**Phase to address:** OTEL instrumentation phase

**Sources:**
- [Next.js: File-system conventions instrumentation.js](https://nextjs.org/docs/app/api-reference/file-conventions/instrumentation)
- [Next.js: Instrumentation Guide](https://nextjs.org/docs/app/guides/instrumentation)

---

### Pitfall 7: Missing Health Check Endpoints

**What goes wrong:** Kubernetes can't determine pod health. Either no probes configured (dangerous), or probes hit non-existent endpoints causing restart loops.

**Why it happens:** Next.js doesn't provide health endpoints out of the box (unlike Spring Boot Actuator). Developers forget to implement them, or configure probes to wrong paths.

**Consequences:**
- No liveness probe: Hung processes never restart
- Failed liveness probe: Healthy pods constantly restarted
- No readiness probe: Traffic sent to unready pods during startup
- Failed readiness probe: Pods never receive traffic

**Prevention:**
```typescript
// app/api/health/live/route.ts
export async function GET() {
  return new Response('OK', { status: 200 })
}

// app/api/health/ready/route.ts
export async function GET() {
  // Check dependencies if needed
  return new Response('OK', { status: 200 })
}
```

```yaml
# In Helm values
livenessProbe:
  httpGet:
    path: /api/health/live
    port: 3000
  initialDelaySeconds: 10
  periodSeconds: 10
  failureThreshold: 3

readinessProbe:
  httpGet:
    path: /api/health/ready
    port: 3000
  initialDelaySeconds: 5
  periodSeconds: 5
  failureThreshold: 2

startupProbe:
  httpGet:
    path: /api/health/live
    port: 3000
  failureThreshold: 30
  periodSeconds: 2
```

**Detection:**
- Pod events show probe failures
- Pods cycle between Running and CrashLoopBackOff
- Service has no ready endpoints

**Phase to address:** Helm chart configuration phase

**Sources:**
- [Kubernetes: Configure Liveness, Readiness and Startup Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/)
- [Next.js Discussion #53492: Graceful Shutdown and Readiness Probe](https://github.com/vercel/next.js/discussions/53492)
- [Better Stack: Kubernetes Health Checks and Probes](https://betterstack.com/community/guides/monitoring/kubernetes-health-checks/)

---

### Pitfall 8: Faro Initialization Timing

**What goes wrong:** Early errors and page load metrics are missed. Faro captures only partial user session data.

**Why it happens:** Faro must initialize before any errors can occur or metrics can be captured. Lazy loading or late initialization misses the critical initial page load phase.

**Consequences:**
- First contentful paint not captured
- JavaScript errors during hydration missed
- Web vitals incomplete
- User sessions appear to start mid-journey

**Prevention:**
```typescript
// Initialize Faro as early as possible - in layout.tsx or _app.tsx
// Before any other client-side code
import { initializeFaro } from '@grafana/faro-web-sdk'

if (typeof window !== 'undefined') {
  initializeFaro({
    url: 'https://your-faro-endpoint',
    app: {
      name: 'your-app-name',
      version: '1.0.0',
    },
  })
}
```

Note: Adding tracing will add approximately 500kB to your JavaScript payload.

**Detection:**
- Compare Faro sessions to server logs
- Check web vitals completeness
- Look for missing early errors that appear in other tools

**Phase to address:** Faro integration phase

**Sources:**
- [Grafana Cloud: Quickstart setup for Faro-React](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/quickstart/react/)
- [GitHub: grafana/faro-nextjs-example](https://github.com/grafana/faro-nextjs-example)
- [GitHub Issue #496: Instrument NextJS apps](https://github.com/grafana/faro-web-sdk/issues/496)

---

### Pitfall 9: Renovate Not Detecting ArgoCD Files

**What goes wrong:** Renovate doesn't create PRs for Helm chart version updates in ArgoCD application definitions. Dependencies become stale without notification.

**Why it happens:** Renovate's ArgoCD manager has NO default file patterns. Unlike other managers, it won't scan any files unless explicitly configured with `managerFilePatterns`.

**Consequences:**
- ArgoCD Applications never get updated
- Helm charts drift to outdated versions
- Security vulnerabilities not flagged
- Manual tracking required

**Prevention:**
```json
// renovate.json
{
  "argocd": {
    "managerFilePatterns": [
      "argocd-apps/**/*.yaml",
      "manifests/applications/**/*.yaml"
    ]
  }
}
```

For image tags in Helm values that Renovate doesn't auto-detect:
```json
{
  "regexManagers": [
    {
      "description": "Update docker image references in ArgoCD apps",
      "fileMatch": ["^applications\\/.*\\.yaml$"],
      "matchStrings": [
        "image:\\s*(?<depName>.*?):(?<currentValue>.*?)\\s+"
      ],
      "datasourceTemplate": "docker"
    }
  ]
}
```

**Detection:**
- Renovate dashboard shows no ArgoCD updates
- Run `renovate --dry-run` locally to verify file matching
- Check Renovate logs for "argocd" manager activity

**Phase to address:** Renovate configuration phase

**Sources:**
- [Renovate Docs: Automated Dependency Updates for Argo CD](https://docs.renovatebot.com/modules/manager/argocd/)
- [DEV.to: Automatically Updating Helm Charts with ArgoCD and Renovate](https://dev.to/corrupt952/automatically-updating-helm-charts-referenced-by-argo-cd-with-renovate-5g79)
- [GitHub Discussion #16292: Helm image tags in values not updated](https://github.com/renovatebot/renovate/discussions/16292)

---

### Pitfall 10: Cloudflare Tunnel with TUNNEL_TOKEN Ignores Local Config

**What goes wrong:** Cloudflare Tunnel ignores the `ingress` configuration in your config.yaml when using TUNNEL_TOKEN authentication. Routes don't work as expected.

**Why it happens:** When using TUNNEL_TOKEN (remotely managed tunnel), cloudflared fetches configuration from Cloudflare API, ignoring local config.yaml entirely. This is different from credentials.json based configuration.

**Consequences:**
- Local ingress rules have no effect
- Tunnel behavior differs from what's defined in Git
- GitOps principles violated (source of truth split)

**Prevention:**

Option 1: Use credentials.json locally managed tunnel:
```yaml
# credentials stored in Kubernetes secret
tunnel: <tunnel-id>
credentials-file: /etc/cloudflared/credentials.json
ingress:
  - hostname: blog.example.com
    service: http://blog-service:80
  - service: http_status:404
```

Option 2: If using TUNNEL_TOKEN, manage routing via Cloudflare Dashboard/API instead of config.yaml. Accept that configuration lives in Cloudflare, not Git.

**Detection:**
- Ingress rules in config.yaml don't affect routing
- Tunnel works but with unexpected behavior
- Changes to config.yaml require dashboard updates to take effect

**Phase to address:** Cloudflare Tunnel setup phase

**Sources:**
- [GitHub Issue #633: Helm chart ingress definitions ignored with TUNNEL_TOKEN](https://github.com/cloudflare/cloudflared/issues/633)
- [Cloudflare Docs: Kubernetes deployment guide](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/deployment-guides/kubernetes/)
- [Snowgoons.ro: Exposing Kubernetes Services through Cloudflare Tunnels](https://snowgoons.ro/posts/2025-05-20-cloudflare-tunnel-ingress/)

---

## Minor Pitfalls

Mistakes that cause annoyance, minor issues, or are easily fixable.

---

### Pitfall 11: Image Cache Not Shared Across Replicas

**What goes wrong:** Each pod re-optimizes the same images independently. Increased latency for first visitors to each pod. Wasted compute resources.

**Why it happens:** Next.js image optimization cache is stored on local filesystem (`.next/cache`). Multiple pod replicas don't share this cache.

**Prevention:**

Option 1: Use persistent volume shared across replicas (complex, may have performance issues):
```yaml
volumes:
  - name: image-cache
    persistentVolumeClaim:
      claimName: nextjs-image-cache
```

Option 2: Use external image CDN (Cloudflare Images, Imgix) and bypass Next.js optimization.

Option 3: Accept the tradeoff for small sites - cache will warm up quickly.

**Detection:**
- First image requests slow across all pods
- High CPU during image optimization
- Cache size grows independently per pod

**Phase to address:** Helm chart configuration phase (if addressing)

**Sources:**
- [Sherpa.sh: Secrets of Self-hosting Nextjs at Scale in 2025](https://www.sherpa.sh/blog/secrets-of-self-hosting-nextjs-at-scale-in-2025)

---

### Pitfall 12: Next.js Canary Breaking Changes

**What goes wrong:** Next.js canary version introduces breaking changes without warning. Build or runtime failures after automatic updates.

**Why it happens:** Canary releases are unstable by definition. They may contain incomplete features, bugs, or breaking changes that won't be in stable releases.

**Consequences:**
- Unexpected build failures
- Runtime errors after dependency updates
- Time spent debugging framework issues vs application code

**Prevention:**
- Pin to specific canary version in package.json (e.g., `"next": "15.2.0-canary.54"`)
- Configure Renovate to NOT auto-merge Next.js canary updates:
```json
{
  "packageRules": [
    {
      "matchPackageNames": ["next"],
      "matchCurrentVersion": "/canary/",
      "automerge": false,
      "prPriority": -1
    }
  ]
}
```
- Test canary updates in staging before production

**Detection:**
- Monitor Renovate PRs for Next.js updates
- Subscribe to Next.js release notes

**Phase to address:** Renovate configuration phase

---

### Pitfall 13: Missing Resource Limits

**What goes wrong:** Pods consume unbounded resources. Node pressure causes evictions. Noisy neighbor problems in shared clusters.

**Why it happens:** Default Helm values often have empty `resources: {}`. Developers forget to set limits, especially for "simple" applications.

**Prevention:**
```yaml
# In values.yaml
resources:
  requests:
    cpu: 100m
    memory: 256Mi
  limits:
    cpu: 500m
    memory: 512Mi
```

Start conservative and adjust based on actual usage via metrics.

**Detection:**
- Pods show no resource limits: `kubectl describe pod`
- OOMKilled events in pod history
- Node resource pressure warnings

**Phase to address:** Helm chart configuration phase

---

### Pitfall 14: Faro CORS Misconfiguration

**What goes wrong:** Faro RUM data silently fails to send. No errors in production, but no data in Grafana either.

**Why it happens:** Faro endpoint requires CORS configuration matching your application's domain. Localhost works in dev, but production domain is missing.

**Prevention:**
- Configure CORS Allowed Origins in Grafana Cloud Frontend Observability settings
- Include all environments: production domain, staging domain, localhost for dev
- Test CORS with browser devtools network tab

**Detection:**
- Browser console shows CORS errors (if you look)
- Faro dashboard shows no sessions
- Network tab shows failed requests to Faro endpoint

**Phase to address:** Faro integration phase

**Sources:**
- [Grafana Cloud: Quickstart setup for Faro](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/quickstart/javascript/)

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|----------------|------------|
| Dockerfile creation | SIGTERM handling, HOSTNAME binding, sharp installation | Use `node server.js`, set `HOSTNAME=0.0.0.0`, install sharp explicitly |
| OTEL instrumentation | Edge runtime errors, file location | Conditional imports by runtime, verify file location |
| Faro integration | Initialization timing, CORS | Initialize early, configure all domains |
| Helm chart config | Missing probes, no resource limits | Implement health endpoints, set conservative limits |
| Renovate setup | ArgoCD files not detected | Configure explicit `managerFilePatterns` |
| Cloudflare Tunnel | TUNNEL_TOKEN ignores config | Use credentials.json or accept Cloudflare-managed routing |

---

## Pre-Flight Checklist

Before deploying to production, verify:

- [ ] Container starts with `node server.js` (not npm/yarn)
- [ ] `HOSTNAME=0.0.0.0` is set in deployment
- [ ] Health endpoints exist and probes are configured
- [ ] instrumentation.ts is in correct location (root or src/)
- [ ] OTEL uses conditional imports for runtime
- [ ] Sharp is installed or image optimization is disabled
- [ ] Faro initializes before any client code
- [ ] Resource limits are set
- [ ] Renovate has ArgoCD file patterns configured
- [ ] NEXT_PUBLIC variables strategy is defined

---

## Sources

### Docker/Kubernetes
- [DEV.to: Top Mistakes When Deploying Next.js Apps](https://dev.to/kuberns_cloud/top-mistakes-when-deploying-nextjs-apps-170f)
- [Deni Bertovic: Deploying Next.js to Kubernetes](https://denibertovic.com/posts/deploying-nextjs-to-kubernetes-a-practical-guide-with-a-complete-devops-pipeline/)
- [Sherpa.sh: Secrets of Self-hosting Nextjs at Scale in 2025](https://www.sherpa.sh/blog/secrets-of-self-hosting-nextjs-at-scale-in-2025)

### OpenTelemetry
- [Next.js: OpenTelemetry Guide](https://nextjs.org/docs/app/guides/open-telemetry)
- [SigNoz: Monitor NextJS with OpenTelemetry](https://signoz.io/blog/opentelemetry-nextjs/)
- [Highlight.io: Complete guide to OpenTelemetry in Next.js](https://www.highlight.io/blog/the-complete-guide-to-opentelemetry-in-next-js)

### Grafana Faro
- [GitHub: grafana/faro-nextjs-example](https://github.com/grafana/faro-nextjs-example)
- [Grafana Cloud: Faro Quickstart](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/quickstart/javascript/)

### ArgoCD/Renovate
- [Renovate Docs: ArgoCD Manager](https://docs.renovatebot.com/modules/manager/argocd/)
- [DEV.to: Automatically Updating Helm Charts with Renovate](https://dev.to/corrupt952/automatically-updating-helm-charts-referenced-by-argo-cd-with-renovate-5g79)

### Cloudflare Tunnel
- [Cloudflare: Kubernetes deployment guide](https://developers.cloudflare.com/cloudflare-one/networks/connectors/cloudflare-tunnel/deployment-guides/kubernetes/)
- [GitHub Issue #633: TUNNEL_TOKEN ignores local config](https://github.com/cloudflare/cloudflared/issues/633)
