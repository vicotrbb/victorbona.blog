# Phase 1: Container Foundation - Research

**Researched:** 2026-01-27
**Domain:** Docker containerization, Next.js standalone output, Kubernetes health probes
**Confidence:** HIGH

## Summary

This phase creates a production-ready Docker image for the Next.js blog with health and readiness endpoints for Kubernetes deployment. The research confirms Next.js has well-documented patterns for standalone output mode and Docker deployment, with an official example Dockerfile maintained by Vercel.

Key findings:
- Next.js standalone output with `output: 'standalone'` creates a self-contained `.next/standalone` folder that dramatically reduces image size (up to 75% reduction)
- The official Next.js Docker example uses `node:20-alpine` as base with `libc6-compat` for native module compatibility
- Signal handling requires `CMD ["node", "server.js"]` instead of npm/yarn to properly receive SIGTERM for graceful shutdown
- Health endpoints should be simple route handlers returning minimal JSON; liveness must not depend on external systems

**Primary recommendation:** Use the official Vercel Docker example as the foundation, with additions for sharp installation and OCI labels per user decisions.

## Standard Stack

The established tools and patterns for this domain:

### Core

| Library/Tool | Version | Purpose | Why Standard |
|--------------|---------|---------|--------------|
| node:22-alpine | LTS | Docker base image | Smallest footprint (~5MB base), requested in requirements |
| libc6-compat | Alpine pkg | glibc compatibility layer | Required for native Node.js modules like sharp |
| sharp | latest | Image optimization | Required for Next.js Image component in standalone mode |
| Next.js standalone | output mode | Self-contained deployment | Official production deployment method |

### Supporting

| Tool | Purpose | When to Use |
|------|---------|-------------|
| next-logger | JSON structured logging | If logs need Loki-compatible JSON format (user decision) |
| tini | Init process | Alternative to `--init` flag for zombie process handling |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| node:22-alpine | node:22-slim | Larger image (~200MB vs ~180MB), but no musl/glibc issues |
| libc6-compat | gcompat | gcompat is newer (Alpine 3.19+), same purpose |
| direct node | npm start | npm doesn't forward SIGTERM properly - AVOID |

**Installation:**
```bash
npm install sharp
# Note: sharp is added explicitly for standalone mode image optimization
```

## Architecture Patterns

### Recommended Dockerfile Structure

```
Dockerfile
├── FROM base          # node:22-alpine - shared base
├── FROM deps          # Install dependencies only
├── FROM builder       # Build application
└── FROM runner        # Production image (minimal)
```

### Pattern 1: Multi-Stage Docker Build

**What:** Separate build and runtime stages to minimize final image size
**When to use:** Always for production Next.js deployments

**Example:**
```dockerfile
# Source: https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile
# syntax=docker.io/docker/dockerfile:1

FROM node:22-alpine AS base

# Dependencies stage
FROM base AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci

# Builder stage
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# Runner stage (production)
FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
```

### Pattern 2: Next.js App Router Health Endpoints

**What:** Route handlers for Kubernetes liveness and readiness probes
**When to use:** Any Kubernetes deployment

**Example:**
```typescript
// Source: Next.js App Router documentation
// app/api/health/route.ts - Liveness probe
export async function GET() {
  return Response.json({ status: 'ok' })
}

// app/api/ready/route.ts - Readiness probe
export async function GET() {
  // For a frontend app with no external dependencies,
  // readiness can be identical to liveness
  return Response.json({ status: 'ok' })
}
```

### Pattern 3: OCI Image Labels

**What:** Standard metadata labels for container images
**When to use:** All production Docker images (user decision)

**Example:**
```dockerfile
# Source: https://specs.opencontainers.org/image-spec/annotations/
LABEL org.opencontainers.image.title="victorbona.blog"
LABEL org.opencontainers.image.description="Victor Bona's personal blog"
LABEL org.opencontainers.image.version="${VERSION}"
LABEL org.opencontainers.image.revision="${GIT_SHA}"
LABEL org.opencontainers.image.created="${BUILD_DATE}"
LABEL org.opencontainers.image.source="https://github.com/vicotrbb/victorbona.blog"
LABEL org.opencontainers.image.licenses="MIT"
```

### Anti-Patterns to Avoid

- **Using npm/yarn start:** Does not forward SIGTERM signals properly, causing ungraceful shutdowns
- **Liveness probe checking external services:** If database is down, pods restart in a loop - liveness should only check process health
- **Running as root:** Security risk; always create non-root user in Dockerfile
- **Including node_modules in final image:** Use standalone output which traces only required dependencies

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Standalone output tracing | Manual file copying | `output: 'standalone'` | Next.js traces dependencies automatically |
| Signal handling | Custom signal handlers | Direct `node server.js` | npm/yarn don't forward signals properly |
| Alpine compatibility | Manual library installation | `libc6-compat` package | Maintained solution for musl/glibc issues |
| Image labels | Custom metadata files | OCI standard labels | Industry standard, tooling support |
| Non-root user creation | Manual uid/gid | `addgroup --system` / `adduser --system` | Proper system user creation |

**Key insight:** The official Next.js Docker example handles 90% of the complexity. Deviating from it introduces risk for minimal benefit.

## Common Pitfalls

### Pitfall 1: SIGTERM Not Handled

**What goes wrong:** Container receives SIGTERM during Kubernetes pod termination but doesn't shut down gracefully, causing dropped requests
**Why it happens:** Using `npm start` or `yarn start` instead of `node server.js`; npm/yarn do not forward signals to child processes
**How to avoid:** Always use `CMD ["node", "server.js"]` in Dockerfile
**Warning signs:** Pod takes 30+ seconds to terminate, logs show "SIGKILL" instead of "SIGTERM"

### Pitfall 2: HOSTNAME Not Set

**What goes wrong:** Container listens on localhost instead of 0.0.0.0, making it unreachable from outside the container
**Why it happens:** Next.js defaults to binding to localhost for security in development
**How to avoid:** Set `ENV HOSTNAME="0.0.0.0"` in Dockerfile (AFTER setting PORT)
**Warning signs:** Kubernetes readiness probes fail with "connection refused"

### Pitfall 3: Sharp Missing in Standalone Mode

**What goes wrong:** Image optimization fails with error "'sharp' is required to be installed in standalone mode"
**Why it happens:** Standalone output tracing doesn't always include sharp, especially with Alpine's musl libc
**How to avoid:** Either install sharp explicitly in runner stage OR set `NEXT_SHARP_PATH` environment variable
**Warning signs:** Console warnings about image optimization, images not being processed

### Pitfall 4: Liveness Probe Too Complex

**What goes wrong:** Database outage causes all pods to restart repeatedly
**Why it happens:** Liveness probe checks database connectivity; when DB is down, all pods fail liveness and restart
**How to avoid:** Liveness should ONLY check if the Node.js process is responsive; use readiness for dependency checks
**Warning signs:** Pods in CrashLoopBackOff during external service outages

### Pitfall 5: Large Docker Image

**What goes wrong:** Image is 500MB+ instead of expected ~150MB
**Why it happens:** Not using standalone output, including dev dependencies, or including .next cache
**How to avoid:** Use `output: 'standalone'` and proper .dockerignore
**Warning signs:** Long image pull times, CI/CD timeouts

## Code Examples

Verified patterns from official sources:

### next.config.mjs with Standalone Output

```javascript
// Source: https://nextjs.org/docs/app/guides/self-hosting
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // Existing config preserved
  async rewrites() {
    return [
      {
        source: "/js/script.js",
        destination: "https://datafa.st/js/script.js",
      },
      {
        source: "/api/events",
        destination: "https://datafa.st/api/events",
      },
    ];
  },
};

export default nextConfig;
```

### Liveness Endpoint (app/api/health/route.ts)

```typescript
// Source: Next.js App Router docs + Kubernetes best practices
// Liveness: Is the process running? Should be lightweight.
export async function GET() {
  return Response.json({ status: 'ok' })
}
```

### Readiness Endpoint (app/api/ready/route.ts)

```typescript
// Source: Next.js App Router docs + Kubernetes best practices
// Readiness: Is the app ready to serve traffic?
// For a frontend app with no external dependencies, this can be simple.
export async function GET() {
  return Response.json({ status: 'ok' })
}
```

### Complete .dockerignore

```
# Source: https://github.com/vercel/next.js/blob/canary/examples/with-docker/.dockerignore
Dockerfile
.dockerignore
node_modules
npm-debug.log
README.md
.next
.git
# Additional recommended exclusions
.env*
.planning
chart
.github
*.md
```

### Sharp Installation in Dockerfile (Runner Stage)

```dockerfile
# Option 1: Install in runner stage
FROM base AS runner
WORKDIR /app
RUN npm install sharp

# Option 2: Set NEXT_SHARP_PATH (if sharp is in standalone output)
ENV NEXT_SHARP_PATH=/app/node_modules/sharp
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `npm start` in Docker | `node server.js` | Always (clarified 2024) | Proper signal handling |
| Manual file copying | `output: 'standalone'` | Next.js 12+ | 75% image size reduction |
| Pages Router API | App Router route handlers | Next.js 13+ | Web standard Request/Response APIs |
| Label Schema | OCI annotations | 2018 (OCI 1.0) | Industry standard labels |

**Deprecated/outdated:**
- Pages Router API routes (`pages/api/*`): Superseded by App Router route handlers
- Label Schema (`org.label-schema.*`): Superseded by OCI annotations (`org.opencontainers.image.*`)

## Open Questions

Things that couldn't be fully resolved:

1. **Sharp installation method**
   - What we know: Sharp is required for standalone image optimization; there are multiple installation approaches
   - What's unclear: Whether `npm install sharp` in runner stage is sufficient or if `NEXT_SHARP_PATH` is needed for node:22-alpine specifically
   - Recommendation: Try installing sharp explicitly in deps stage first; if issues arise, try the `NEXT_SHARP_PATH` approach

2. **JSON structured logging**
   - What we know: User decided on JSON format for Loki compatibility; next-logger is the main solution
   - What's unclear: Whether to implement logging in this phase or defer to a later phase
   - Recommendation: Defer structured logging to Phase 4 (Server-Side Tracing) as it's more closely related to observability; this phase focuses on container foundation

## Sources

### Primary (HIGH confidence)

- [Official Next.js Self-Hosting Guide](https://nextjs.org/docs/app/guides/self-hosting) - Standalone output, graceful shutdown
- [Official Next.js Docker Example](https://github.com/vercel/next.js/blob/canary/examples/with-docker/Dockerfile) - Complete Dockerfile reference
- [Next.js Route Handlers Documentation](https://nextjs.org/docs/app/getting-started/route-handlers) - API route implementation
- [OCI Image Spec Annotations](https://specs.opencontainers.org/image-spec/annotations/) - Standard label format

### Secondary (MEDIUM confidence)

- [Kubernetes Configure Liveness, Readiness Probes](https://kubernetes.io/docs/tasks/configure-pod-container/configure-liveness-readiness-startup-probes/) - Probe design principles
- [Node.js Reference Architecture - Health Checks](https://nodeshift.dev/nodejs-reference-architecture/operations/healthchecks/) - Health endpoint patterns
- [Alpine Linux libc6-compat](https://pkgs.alpinelinux.org/package/v3.15/main/ppc64le/libc6-compat) - Compatibility package documentation

### Tertiary (LOW confidence)

- Various blog posts on Next.js Docker deployment - Verified against official docs
- GitHub discussions on sharp installation - Multiple approaches reported, some conflicting

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Next.js example provides authoritative reference
- Architecture: HIGH - Well-documented multi-stage pattern from Vercel
- Pitfalls: HIGH - Documented in official guides and GitHub discussions
- Sharp installation: MEDIUM - Multiple approaches exist, may need validation

**Research date:** 2026-01-27
**Valid until:** 60 days (stable patterns, Next.js standalone mode is mature)
