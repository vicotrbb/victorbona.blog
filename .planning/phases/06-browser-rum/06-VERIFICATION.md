---
phase: 06-browser-rum
verified: 2026-01-27T19:30:00Z
status: passed
score: 6/6 must-haves verified
---

# Phase 6: Browser RUM (Faro) Verification Report

**Phase Goal:** Enable client-side observability with Grafana Faro
**Verified:** 2026-01-27T19:30:00Z
**Status:** passed
**Re-verification:** No - initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Faro initializes on production deployments | VERIFIED | `initializeFaro()` called with `url: faroUrl` at line 42-54 of faro-init.tsx; NEXT_PUBLIC_FARO_URL configured in chart/values.yaml line 102-103 |
| 2 | Faro respects Do Not Track browser setting | VERIFIED | DNT guard at line 31: `if (navigator.doNotTrack === '1' \|\| (window as any).doNotTrack === '1') return null` |
| 3 | Faro does not initialize in local development (no NEXT_PUBLIC_FARO_URL) | VERIFIED | Production guard at lines 36-38: checks for `process.env.NEXT_PUBLIC_FARO_URL` and returns null if absent |
| 4 | Core Web Vitals (LCP, CLS, INP) are collected | VERIFIED | `getWebInstrumentations()` imported and used at line 49: `instrumentations: [...getWebInstrumentations()]` - this includes WebVitals instrumentation |
| 5 | JavaScript errors are tracked | VERIFIED | `getWebInstrumentations()` includes error tracking by default (per Faro SDK documentation) |
| 6 | Session tracking correlates events from same visit | VERIFIED | `sessionTracking: { enabled: true, persistent: true }` at lines 50-53 |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/faro-init.tsx` | FaroInit component with exports | VERIFIED | 61 lines, substantive implementation with 4 guards (SSR, HMR, DNT, production), initializeFaro config, try/catch, named export |
| `app/layout.tsx` | Root layout with FaroInit integration | VERIFIED | Import at line 11, render at line 121 as first child of body, layout remains Server Component (no 'use client') |
| `chart/values.yaml` | Faro endpoint configuration | VERIFIED | NEXT_PUBLIC_FARO_URL at line 102-103: "https://faro.bonalab.org/collect", NEXT_PUBLIC_APP_VERSION at line 104-105 |
| `package.json` | Faro SDK dependency | VERIFIED | `"@grafana/faro-web-sdk": "^2.2.0"` at line 11 |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/layout.tsx` | `app/components/faro-init.tsx` | import and render FaroInit | WIRED | Import: `import { FaroInit } from "./components/faro-init";` (line 11), Usage: `<FaroInit />` (line 121) |
| `app/components/faro-init.tsx` | `process.env.NEXT_PUBLIC_FARO_URL` | environment variable for endpoint | WIRED | Line 36: `const faroUrl = process.env.NEXT_PUBLIC_FARO_URL;` used in production guard and initializeFaro config |

### Artifact Level Checks

#### faro-init.tsx

- **Level 1 (Exists):** EXISTS (61 lines)
- **Level 2 (Substantive):**
  - Line count: 61 (exceeds 30-line minimum)
  - No stub patterns (TODO/FIXME/placeholder)
  - Has real implementation: imports, guards, initializeFaro config, error handling
  - Export: `export function FaroInit()`
  - Status: SUBSTANTIVE
- **Level 3 (Wired):**
  - Imported in: app/layout.tsx
  - Used as: JSX component `<FaroInit />`
  - Status: WIRED

#### layout.tsx

- **Level 1 (Exists):** EXISTS (131 lines)
- **Level 2 (Substantive):** Full layout implementation, not a stub
- **Level 3 (Wired):** Root layout of the application, always active

#### chart/values.yaml

- **Level 1 (Exists):** EXISTS (236 lines)
- **Level 2 (Substantive):** Full Helm values with Faro config at lines 101-105
- **Level 3 (Wired):** Used by Helm during deployment

#### package.json

- **Level 1 (Exists):** EXISTS (41 lines)
- **Level 2 (Substantive):** Has Faro SDK dependency
- **Level 3 (Wired):** npm install/build uses this

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| None | - | - | - | No anti-patterns detected |

Scanned files for:
- TODO/FIXME/XXX/HACK comments: None found
- Placeholder text: None found
- Empty implementations: None found (all `return null` statements are intentional guards)
- Console.log only implementations: Only `console.warn` for error handling, which is appropriate

### Human Verification Required

#### 1. Production Deployment Test

**Test:** Deploy to Kubernetes and verify Faro initializes
**Expected:** Browser DevTools Network tab shows requests to faro.bonalab.org/collect
**Why human:** Requires actual deployment to Kubernetes with NEXT_PUBLIC_FARO_URL set

#### 2. DNT Compliance Test

**Test:** Enable Do Not Track in browser, load site in production
**Expected:** No Faro network requests when DNT is enabled
**Why human:** Requires browser configuration and network inspection

#### 3. Web Vitals Collection Test

**Test:** Use Chrome DevTools Lighthouse or view Grafana Faro dashboard
**Expected:** LCP, CLS, INP metrics appear in Faro collector
**Why human:** Requires Grafana Faro dashboard access and real page interactions

#### 4. Error Tracking Test

**Test:** Inject a JavaScript error in production, check Faro dashboard
**Expected:** Error appears in Faro error tracking
**Why human:** Requires production environment and Grafana dashboard access

### Gaps Summary

No gaps found. All must-haves verified:

1. **FaroInit component** exists with substantive implementation (61 lines)
2. **Four-layer guard pattern** implemented correctly (SSR, HMR, DNT, production)
3. **Integration** properly wired - imported and rendered in layout
4. **Configuration** complete in Helm values with endpoint URL
5. **Dependency** installed (@grafana/faro-web-sdk ^2.2.0)

The implementation follows the plan exactly with no deviations or stub patterns.

---

*Verified: 2026-01-27T19:30:00Z*
*Verifier: Claude (gsd-verifier)*
