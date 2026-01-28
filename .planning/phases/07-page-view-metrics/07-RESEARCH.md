# Phase 7: Page View Metrics - Research

**Researched:** 2026-01-28
**Domain:** Server-side request metrics with prom-client in Next.js middleware
**Confidence:** HIGH

## Summary

This research covers implementing page view and request metrics in a Next.js application using middleware for request interception and prom-client for Prometheus metrics. The existing metrics infrastructure (globalThis singleton, `/metrics` endpoint) from Phase 5 will be extended with custom Counter and Histogram metrics.

The key challenge is that **Next.js middleware runs BEFORE routes render**, meaning it cannot directly access response status codes. The solution is a hybrid approach: middleware records page views (200 responses assumed), while 404s are tracked by calling `notFound()` which renders the not-found.tsx page - we can increment a counter when that page renders.

For request latency, middleware can measure time from request start, but cannot measure actual response completion time. The pragmatic approach is to measure middleware execution time plus a fixed overhead estimate, or rely on OTEL auto-instrumentation for accurate latency (already configured in Phase 4).

**Primary recommendation:** Extend `app/lib/metrics.ts` with Counter and Histogram metrics, create `middleware.ts` for request interception with path normalization and bot detection, and track 404s via the not-found.tsx component.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| prom-client | ^15.1.3 | Counter and Histogram metrics | Already installed, de facto Prometheus client |
| isbot | ^5.1.x | Bot detection from User-Agent | 2.8M weekly downloads, actively maintained, accurate patterns |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none required) | - | Path normalization | Use native string methods - simple regex patterns |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| isbot | Custom regex | isbot is maintained with updated bot patterns; custom regex becomes stale |
| Middleware timing | OTEL spans | OTEL already captures request latency; consider relying on existing traces instead of duplicating |

**Installation:**
```bash
npm install isbot
```

## Architecture Patterns

### Recommended Project Structure
```
app/
├── lib/
│   └── metrics.ts         # Extended with Counter/Histogram (modify existing)
├── metrics/
│   └── route.ts           # Existing endpoint (no changes needed)
├── not-found.tsx          # Extend to increment 404 counter
middleware.ts              # NEW - request interception at project root
```

### Pattern 1: Extending Existing Metrics Module
**What:** Add Counter and Histogram metrics to the existing globalThis singleton
**When to use:** For all new metrics to ensure HMR resilience
**Example:**
```typescript
// Source: https://github.com/siimon/prom-client + existing pattern
// app/lib/metrics.ts (extend existing file)
import { Registry, Counter, Histogram, collectDefaultMetrics } from 'prom-client'

declare global {
  var metricsRegistry: Registry | undefined
  var pageViewsCounter: Counter | undefined
  var httpRequestsCounter: Counter | undefined
  var pageDurationHistogram: Histogram | undefined
}

function initializeMetrics(): Registry {
  const registry = new Registry()

  registry.setDefaultLabels({
    app: 'victorbona-blog',
  })

  collectDefaultMetrics({ register: registry })

  return registry
}

function initializePageViewsCounter(registry: Registry): Counter {
  return new Counter({
    name: 'blog_page_views_total',
    help: 'Total page views by path, method, and bot status',
    labelNames: ['path', 'method', 'is_bot'] as const,
    registers: [registry],
  })
}

function initializeHttpRequestsCounter(registry: Registry): Counter {
  return new Counter({
    name: 'blog_http_requests_total',
    help: 'Total HTTP requests by path, method, and status code',
    labelNames: ['path', 'method', 'status_code'] as const,
    registers: [registry],
  })
}

function initializePageDurationHistogram(registry: Registry): Histogram {
  return new Histogram({
    name: 'blog_page_duration_seconds',
    help: 'Page request duration in seconds',
    labelNames: ['path', 'method'] as const,
    // Buckets for typical web page response times
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [registry],
  })
}

// Singleton pattern
export const metricsRegistry = global.metricsRegistry ?? initializeMetrics()
export const pageViewsCounter = global.pageViewsCounter ?? initializePageViewsCounter(metricsRegistry)
export const httpRequestsCounter = global.httpRequestsCounter ?? initializeHttpRequestsCounter(metricsRegistry)
export const pageDurationHistogram = global.pageDurationHistogram ?? initializePageDurationHistogram(metricsRegistry)

if (process.env.NODE_ENV !== 'production') {
  global.metricsRegistry = metricsRegistry
  global.pageViewsCounter = pageViewsCounter
  global.httpRequestsCounter = httpRequestsCounter
  global.pageDurationHistogram = pageDurationHistogram
}
```

### Pattern 2: Next.js Middleware for Request Interception
**What:** Middleware file at project root that intercepts all requests
**When to use:** For page view counting and request timing
**Example:**
```typescript
// Source: https://nextjs.org/docs/app/building-your-application/routing/middleware
// middleware.ts (project root)
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isbot } from 'isbot'
import { pageViewsCounter, pageDurationHistogram } from './app/lib/metrics'

// Static assets and internal routes to exclude
const EXCLUDED_PATTERNS = [
  /^\/_next/,           // Next.js internals
  /^\/api\//,           // API routes (tracked separately if needed)
  /^\/metrics$/,        // Metrics endpoint
  /^\/health$/,         // Health checks
  /^\/api\/health$/,
  /^\/api\/ready$/,
  /\.(js|css|ico|png|jpg|jpeg|gif|svg|woff|woff2|ttf|eot)$/i,  // Static assets
]

function shouldTrack(pathname: string): boolean {
  return !EXCLUDED_PATTERNS.some(pattern => pattern.test(pathname))
}

function normalizePath(pathname: string): string {
  // Strip query parameters (already done by pathname)
  // Normalize trailing slashes - remove trailing slash except for root
  let normalized = pathname.endsWith('/') && pathname !== '/'
    ? pathname.slice(0, -1)
    : pathname

  // Lowercase
  normalized = normalized.toLowerCase()

  return normalized
}

export function middleware(request: NextRequest) {
  const startTime = performance.now()
  const pathname = request.nextUrl.pathname

  // Skip excluded paths
  if (!shouldTrack(pathname)) {
    return NextResponse.next()
  }

  const normalizedPath = normalizePath(pathname)
  const method = request.method
  const userAgent = request.headers.get('user-agent') || ''
  const isBotRequest = isbot(userAgent)

  // Increment page view counter
  // Note: We assume 200 success here since middleware runs before route
  // 404s are tracked separately in not-found.tsx
  pageViewsCounter.inc({
    path: normalizedPath,
    method: method,
    is_bot: isBotRequest ? 'true' : 'false',
  })

  // Measure timing (middleware execution only)
  const response = NextResponse.next()

  const durationSeconds = (performance.now() - startTime) / 1000
  pageDurationHistogram.observe(
    { path: normalizedPath, method: method },
    durationSeconds
  )

  return response
}

export const config = {
  matcher: [
    // Match all paths except static files
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

### Pattern 3: Track 404s in not-found.tsx
**What:** Increment counter when not-found page renders
**When to use:** Since middleware cannot know if a route will 404
**Example:**
```typescript
// app/not-found.tsx
import { httpRequestsCounter } from './lib/metrics'

export default function NotFound() {
  // Track 404 server-side during render
  // This runs on the server, so safe to call metrics
  httpRequestsCounter.inc({
    path: 'not_found',  // Generic label since we don't know exact path here
    method: 'GET',
    status_code: '404',
  })

  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        404 - Page Not Found
      </h1>
      <p className="mb-4">The page you are looking for does not exist.</p>
    </section>
  )
}
```

### Anti-Patterns to Avoid
- **Trying to access response status in middleware:** Middleware runs BEFORE routes - status codes are unknown
- **High-cardinality labels:** Per CONTEXT.md, keeping actual slugs is acceptable for this blog's scale
- **Blocking external calls in middleware:** Never call external APIs from middleware - adds latency
- **Creating metrics in middleware function:** Use singleton pattern to avoid duplicate registration

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Bot detection | Custom User-Agent regex | `isbot` library | Maintained patterns, handles edge cases, 1% false positive fallback |
| Histogram buckets | Custom bucket values | prom-client defaults or web-optimized buckets | Standard buckets work for web requests |
| Path matching | Complex regex | Next.js matcher config | Built-in, handles edge cases, fast |
| HMR-safe metrics | Manual caching | globalThis singleton (existing pattern) | Already proven in Phase 5 |

**Key insight:** The existing metrics infrastructure from Phase 5 handles the hard parts (HMR resilience, Prometheus formatting). This phase just extends it with new metric types.

## Common Pitfalls

### Pitfall 1: Expecting Response Status in Middleware
**What goes wrong:** Middleware always sees successful status because it runs before route execution
**Why it happens:** Next.js middleware is a pre-route interceptor, not a post-route hook
**How to avoid:** Track 404s in not-found.tsx, assume 200 for tracked page views
**Warning signs:** All page views show status 200 even for non-existent pages

### Pitfall 2: Middleware Latency Overhead
**What goes wrong:** Adding 60-70ms latency to every request
**Why it happens:** Middleware runs on every request; heavy operations block response
**How to avoid:** Keep middleware minimal - only increment counters, no external calls
**Warning signs:** TTFB increases significantly after adding middleware

### Pitfall 3: Duplicate Metrics in HMR
**What goes wrong:** "A metric with the name X has already been registered" errors
**Why it happens:** Next.js HMR reloads modules, re-executing metric creation
**How to avoid:** Use globalThis singleton pattern (already established in Phase 5)
**Warning signs:** Works in production, errors in development

### Pitfall 4: isbot Lookbehind Assertion Errors
**What goes wrong:** Regex error in older environments
**Why it happens:** isbot uses lookbehind assertions not supported everywhere
**How to avoid:** Next.js Edge runtime may have issues; test with Node.js runtime if needed
**Warning signs:** "Invalid regular expression" errors in middleware

### Pitfall 5: Middleware Import Errors
**What goes wrong:** Cannot import from app/lib in middleware.ts
**Why it happens:** Middleware runs in Edge runtime with different module resolution
**How to avoid:** May need to move metrics code to project root or use dynamic imports
**Warning signs:** Build errors about module not found

## Code Examples

Verified patterns from official sources:

### Counter with TypeScript Labels
```typescript
// Source: https://github.com/siimon/prom-client
import { Counter } from 'prom-client'

const counter = new Counter({
  name: 'metric_name',
  help: 'metric_help',
  labelNames: ['method', 'path', 'status_code'] as const, // `as const` enforces type safety
})

// Type-safe increment
counter.inc({ method: 'GET', path: '/blog', status_code: '200' })
counter.inc() // Increment by 1 without labels
counter.inc({ method: 'POST', path: '/api' }, 5) // Increment by 5
```

### Histogram with Timer
```typescript
// Source: https://github.com/siimon/prom-client
import { Histogram } from 'prom-client'

const histogram = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request duration in seconds',
  labelNames: ['path', 'method'] as const,
  buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
})

// Method 1: Direct observation
histogram.observe({ path: '/blog', method: 'GET' }, 0.234)

// Method 2: Timer utility
const end = histogram.startTimer({ path: '/blog', method: 'GET' })
// ... do work ...
const durationSeconds = end() // Observes and returns duration
```

### isbot Usage
```typescript
// Source: https://github.com/omrilotan/isbot
import { isbot } from 'isbot'

// Basic usage
isbot(request.headers.get('User-Agent')) // true or false

// Common bot examples detected:
// - Googlebot, Bingbot, Yandex
// - Facebook, Twitter, LinkedIn crawlers
// - curl, wget, Python-urllib
// - Lighthouse, PageSpeed Insights
```

### Next.js Middleware Matcher
```typescript
// Source: https://nextjs.org/docs/app/building-your-application/routing/middleware
export const config = {
  matcher: [
    // Match all paths except:
    // - _next/static (static files)
    // - _next/image (image optimization)
    // - favicon.ico (browser icon)
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| middleware.ts | proxy.ts (experimental) | Next.js 16+ | File renamed; middleware still works in 15.x |
| Edge-only middleware | Node.js runtime option | Next.js 15.2 | Can use Node.js APIs in middleware |
| UA regex for bots | isbot library | Ongoing | Better accuracy, maintained patterns |

**Deprecated/outdated:**
- Express-style `res.on('finish')` in middleware: Not available in Next.js
- Synchronous `registry.metrics()`: Now async, use `await registry.metrics()`

## Important Limitations

### Cannot Track in Middleware
1. **Response status codes:** Middleware runs before routes
2. **Actual response time:** Cannot hook into response completion
3. **Response body size:** Not accessible in middleware

### Workarounds
1. **404 tracking:** Increment counter in not-found.tsx
2. **Response time:** Rely on OTEL auto-instrumentation (already configured in Phase 4)
3. **2xx/3xx/5xx tracking:** Would require custom server or OTEL; consider deferring

### Recommended Scope Adjustment
Per CONTEXT.md requirements:
- METRICS-01 (page views with path): Achievable via middleware
- METRICS-02 (status codes): Partial - 404 via not-found.tsx; others need OTEL
- METRICS-03 (content type): Achievable via path pattern matching
- METRICS-04 (latency histogram): Middleware timing only (not full response time)

**Recommendation:** Focus on what middleware CAN do well (page views, bot detection, content types). For accurate status codes and latency, leverage existing OTEL traces from Phase 4.

## Open Questions

Things that couldn't be fully resolved:

1. **Middleware Module Resolution**
   - What we know: Middleware runs in Edge runtime with different module resolution
   - What's unclear: Whether importing from `./app/lib/metrics` will work
   - Recommendation: Test during implementation; may need to move metrics to project root

2. **Node.js vs Edge Runtime for Middleware**
   - What we know: Next.js 15.2+ supports `runtime: 'nodejs'` in middleware
   - What's unclear: Whether project's Next.js canary version includes this
   - Recommendation: Start with default Edge; switch to Node.js if import issues occur

3. **Duplicate 404 Counting**
   - What we know: Middleware increments page view, then not-found.tsx increments 404
   - What's unclear: Best way to avoid double-counting
   - Recommendation: Don't count page views for paths that result in 404; or accept the duplication and filter in Grafana queries

## Sources

### Primary (HIGH confidence)
- [prom-client GitHub](https://github.com/siimon/prom-client) - Counter, Histogram, TypeScript labels
- [Next.js Middleware Documentation](https://nextjs.org/docs/app/building-your-application/routing/middleware) - Request interception, matcher config
- [isbot GitHub](https://github.com/omrilotan/isbot) - Bot detection patterns, usage

### Secondary (MEDIUM confidence)
- [Next.js GitHub Discussion #34420](https://github.com/vercel/next.js/discussions/34420) - Request timing limitations
- [Next.js GitHub Discussion #31365](https://github.com/vercel/next.js/discussions/31365) - Response access limitations
- [Prometheus Histogram Best Practices](https://prometheus.io/docs/practices/histograms/) - Bucket configuration

### Tertiary (LOW confidence)
- WebSearch results for middleware timing workarounds - Community patterns, not official

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - prom-client v15, isbot are well-documented
- Architecture: HIGH - Middleware patterns from official Next.js docs
- Pitfalls: HIGH - Confirmed limitations through official discussions

**Research date:** 2026-01-28
**Valid until:** 60 days (stable libraries, Next.js middleware API stable)
