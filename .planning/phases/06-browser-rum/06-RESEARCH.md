# Phase 6: Browser RUM (Faro) - Research

**Researched:** 2026-01-27
**Domain:** Client-side observability with Grafana Faro Web SDK
**Confidence:** HIGH

## Summary

Grafana Faro Web SDK is the standard solution for browser Real User Monitoring (RUM) that integrates with the existing Grafana/Alloy observability stack. The project already has Alloy running for server-side traces (Phase 4), making Faro a natural fit for client-side telemetry.

The SDK is mature (v2.1.0), well-documented, and designed specifically for this use case. It automatically collects Core Web Vitals (LCP, CLS, INP), JavaScript errors, and session tracking without custom instrumentation. The key challenge is Next.js App Router integration - requiring a client component pattern that initializes Faro early without blocking rendering.

**Primary recommendation:** Use `@grafana/faro-web-sdk` v2.x with a dedicated `FaroInit` client component placed in the root layout. Configure Alloy's `faro.receiver` component to accept browser telemetry on an exposed endpoint.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @grafana/faro-web-sdk | ^2.1.0 | Core RUM SDK | Official Grafana SDK, includes web vitals, errors, sessions |
| @grafana/faro-web-tracing | ^2.1.0 | Browser tracing (optional) | OpenTelemetry-based distributed tracing in browser |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @grafana/faro-react | ^2.1.0 | React integration | Error boundaries, hooks - optional for basic setup |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Faro | Sentry | Faro integrates natively with Grafana stack; Sentry is standalone |
| Faro | Datadog RUM | Cost; Faro is OSS and self-hosted friendly |

**Installation:**
```bash
npm install @grafana/faro-web-sdk
```

Note: `@grafana/faro-web-tracing` is NOT needed for this phase. The project uses `@vercel/otel` for server-side tracing (Phase 4). Browser-to-backend trace correlation is a future enhancement, not a requirement.

## Architecture Patterns

### Recommended Project Structure
```
app/
├── components/
│   └── faro-init.tsx       # 'use client' component for Faro initialization
├── layout.tsx              # Root layout - imports FaroInit
└── ...
chart/
└── values.yaml             # Add NEXT_PUBLIC_FARO_URL env var
```

### Pattern 1: Client Component Initialization
**What:** Dedicated client component that initializes Faro and returns null
**When to use:** Always - this is the standard Next.js App Router pattern
**Example:**
```typescript
// Source: https://github.com/grafana/faro-nextjs-example
'use client';

import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';

export function FaroInit() {
  // Skip if already initialized (prevents HMR duplicates)
  if (typeof window === 'undefined' || faro.api) {
    return null;
  }

  // Respect Do Not Track
  if (navigator.doNotTrack === '1') {
    return null;
  }

  // Production only
  const faroUrl = process.env.NEXT_PUBLIC_FARO_URL;
  if (!faroUrl) {
    return null;
  }

  try {
    initializeFaro({
      url: faroUrl,
      app: {
        name: 'victorbona-blog',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
      },
      instrumentations: [
        ...getWebInstrumentations(),
      ],
      sessionTracking: {
        enabled: true,
        persistent: true,
      },
    });
  } catch (error) {
    console.warn('Faro initialization failed:', error);
  }

  return null;
}
```

### Pattern 2: Layout Integration
**What:** Import FaroInit in root layout, place early in component tree
**When to use:** Always - ensures Faro loads before other client code
**Example:**
```typescript
// Source: Next.js App Router best practices
import { FaroInit } from './components/faro-init';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <FaroInit />
        {/* rest of layout */}
        {children}
      </body>
    </html>
  );
}
```

### Pattern 3: Alloy faro.receiver Configuration
**What:** Configure Alloy to receive Faro telemetry on an exposed endpoint
**When to use:** Self-hosted Faro setup (not Grafana Cloud)
**Example:**
```alloy
// Source: https://grafana.com/docs/alloy/latest/reference/components/faro/faro.receiver/
faro.receiver "default" {
  server {
    listen_address = "0.0.0.0"
    listen_port = 12347
    cors_allowed_origins = ["https://blog.victorbona.dev"]
    max_allowed_payload_size = "5MiB"
  }

  sourcemaps {
    download = true
    download_from_origins = ["https://blog.victorbona.dev"]
    download_timeout = "5s"
  }

  output {
    logs = [loki.write.default.receiver]
    traces = [otelcol.exporter.otlp.default.input]
  }
}
```

### Anti-Patterns to Avoid
- **'use client' in layout.tsx:** Never add 'use client' to the root layout - it makes the entire app client-rendered. Keep layout as Server Component, import the FaroInit client component.
- **Blocking initialization:** Don't await Faro initialization - let it run async without blocking render.
- **Missing initialization guard:** Always check `faro.api` before calling `initializeFaro()` to prevent duplicates during HMR or re-renders.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Web Vitals collection | Custom PerformanceObserver | getWebInstrumentations() | Handles all edge cases, attribution data |
| Session tracking | Custom sessionStorage logic | Faro's sessionTracking | Handles timeouts, persistence, sampling |
| Error tracking | window.onerror handler | Faro's ErrorsInstrumentation | Stack trace normalization, deduplication |
| DNT respect | navigator.doNotTrack check | Manual check before init | Faro doesn't have built-in DNT support |

**Key insight:** Faro's `getWebInstrumentations()` includes WebVitalsInstrumentation (using Google's web-vitals v5), ErrorsInstrumentation, ConsoleInstrumentation, and SessionInstrumentation. Don't configure these individually unless customizing.

## Common Pitfalls

### Pitfall 1: Duplicate Initialization
**What goes wrong:** Faro initializes multiple times during development HMR or React re-renders
**Why it happens:** Component re-renders, HMR triggers, or missing guard check
**How to avoid:** Always check `faro.api` before calling `initializeFaro()`
**Warning signs:** "Faro is already initialized" console warnings, duplicate events in Grafana

### Pitfall 2: CORS Errors
**What goes wrong:** Browser blocks Faro requests to Alloy endpoint
**Why it happens:** Alloy's faro.receiver not configured with correct CORS origins
**How to avoid:** Configure `cors_allowed_origins` in Alloy config with your domain
**Warning signs:** Network tab shows CORS preflight failures, no data in Grafana

### Pitfall 3: Missing Environment Variable in Browser
**What goes wrong:** `process.env.FARO_URL` is undefined in browser
**Why it happens:** Next.js only exposes `NEXT_PUBLIC_*` prefixed vars to client
**How to avoid:** Use `NEXT_PUBLIC_FARO_URL` not `FARO_URL`
**Warning signs:** Faro silently doesn't initialize, no console warnings (if using optional check)

### Pitfall 4: Server-Side Rendering Errors
**What goes wrong:** "window is not defined" or "navigator is not defined" errors
**Why it happens:** Faro SDK uses browser APIs, runs during SSR
**How to avoid:** Guard with `typeof window === 'undefined'` check before initialization
**Warning signs:** Build failures, hydration errors

### Pitfall 5: Source Map Upload Complexity
**What goes wrong:** Stack traces show minified code, not source
**Why it happens:** Source maps not uploaded or Alloy can't fetch them
**How to avoid:** For self-hosted, configure Alloy's sourcemaps.download or use location blocks
**Warning signs:** Error stack traces show line numbers in .next/static chunks

### Pitfall 6: DNT Not Respected
**What goes wrong:** Faro tracks users who set Do Not Track
**Why it happens:** Faro SDK doesn't check DNT by default - Grafana's privacy policy explicitly states they don't respond to DNT signals
**How to avoid:** Manually check `navigator.doNotTrack === '1'` before initialization
**Warning signs:** User complaints, privacy audit findings

## Code Examples

Verified patterns from official sources:

### Complete FaroInit Component
```typescript
// Source: https://github.com/grafana/faro-nextjs-example + DNT addition
'use client';

import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';

export function FaroInit() {
  // Guard: Server-side rendering
  if (typeof window === 'undefined') {
    return null;
  }

  // Guard: Already initialized (HMR, re-renders)
  if (faro.api) {
    return null;
  }

  // Guard: Respect Do Not Track preference
  if (navigator.doNotTrack === '1' || (window as any).doNotTrack === '1') {
    return null;
  }

  // Guard: Production only (skip in local development)
  const faroUrl = process.env.NEXT_PUBLIC_FARO_URL;
  if (!faroUrl) {
    return null;
  }

  try {
    initializeFaro({
      url: faroUrl,
      app: {
        name: 'victorbona-blog',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
      },
      instrumentations: [
        ...getWebInstrumentations(),
      ],
      sessionTracking: {
        enabled: true,
        persistent: true,
      },
    });
  } catch (error) {
    // Non-critical: log warning but don't break the app
    console.warn('Faro initialization failed:', error);
  }

  return null;
}
```

### Helm Values Addition
```yaml
# Source: Project convention from Phase 4
components:
  web:
    env:
      # Existing vars...
      - name: NEXT_PUBLIC_FARO_URL
        value: "https://faro.bonalab.org/collect"
      - name: NEXT_PUBLIC_APP_VERSION
        valueFrom:
          fieldRef:
            fieldPath: metadata.labels['app.kubernetes.io/version']
```

### Alloy faro.receiver Configuration
```alloy
// Source: https://grafana.com/docs/alloy/latest/reference/components/faro/faro.receiver/
faro.receiver "browser" {
  server {
    listen_address = "0.0.0.0"
    listen_port = 12347
    cors_allowed_origins = ["https://blog.victorbona.dev"]
    max_allowed_payload_size = "5MiB"
    // No api_key = open endpoint (blog is public anyway)
  }

  sourcemaps {
    download = true
    download_from_origins = ["https://blog.victorbona.dev"]
    download_timeout = "5s"
  }

  output {
    logs = [loki.write.default.receiver]
    traces = [otelcol.exporter.otlp.default.input]
  }
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| FID metric | INP metric | Faro v2 (2025) | web-vitals v5 upgrade, FID deprecated |
| Manual instrumentations | getWebInstrumentations() | Faro v1.x | Simpler setup, best practices included |
| faro-react required | faro-web-sdk sufficient | Faro v2 | React integration optional for basic use |

**Deprecated/outdated:**
- **FID (First Input Delay):** Replaced by INP (Interaction to Next Paint) in Faro v2
- **Grafana Agent:** EOL November 2025, use Grafana Alloy instead
- **Manual web-vitals import:** Now bundled in getWebInstrumentations()

## Open Questions

Things that couldn't be fully resolved:

1. **Source Map Upload for Self-Hosted**
   - What we know: Faro webpack plugin exists but requires Grafana Cloud credentials (appId, stackId)
   - What's unclear: How to upload source maps to self-hosted Alloy without Grafana Cloud
   - Recommendation: Use Alloy's `sourcemaps.download = true` to fetch from app origin. Ensure Next.js generates source maps and they're served with proper headers.

2. **Turbopack Compatibility**
   - What we know: Next.js 15 defaults to Turbopack, Faro webpack plugin is webpack-only
   - What's unclear: Whether source map upload works with Turbopack builds
   - Recommendation: For source map upload, may need to use webpack for production builds or use CLI upload. For basic RUM without source maps, Turbopack works fine.

3. **Alloy Ingress Configuration**
   - What we know: Faro endpoint needs to be accessible from user browsers (public internet)
   - What's unclear: Exact Cloudflare Tunnel configuration for `faro.bonalab.org`
   - Recommendation: Document as infrastructure prerequisite, assume endpoint exists at `https://faro.bonalab.org/collect`

## Sources

### Primary (HIGH confidence)
- [Grafana Faro Web SDK GitHub](https://github.com/grafana/faro-web-sdk) - SDK architecture, packages
- [Grafana Alloy faro.receiver docs](https://grafana.com/docs/alloy/latest/reference/components/faro/faro.receiver/) - Alloy configuration
- [Grafana Faro Next.js Example](https://github.com/grafana/faro-nextjs-example) - Next.js integration pattern
- [Grafana Faro Quickstart](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/quickstart/javascript/) - SDK initialization

### Secondary (MEDIUM confidence)
- [Grafana Web Vitals docs](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/instrument/web-vitals/) - Web Vitals configuration
- [Grafana Session Tracking docs](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/instrument/session-tracking/) - Session options
- [Grafana Source Map docs](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/sourcemap-uploads/) - Source map upload

### Tertiary (LOW confidence)
- [DeepWiki Faro Next.js analysis](https://deepwiki.com/grafana/faro-nextjs-example/3.1-frontend-observability-component) - Component pattern analysis
- [Grafana Privacy Policy](https://grafana.com/legal/privacy-policy/) - DNT handling confirmation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Official Grafana SDK, well-documented, v2.x stable
- Architecture: HIGH - Official Next.js example from Grafana provides clear pattern
- Pitfalls: MEDIUM - Some inferred from general Next.js/browser patterns
- Source maps: LOW - Self-hosted source map workflow unclear, Grafana Cloud focused

**Research date:** 2026-01-27
**Valid until:** 60 days (SDK is stable, v2 recently released)
