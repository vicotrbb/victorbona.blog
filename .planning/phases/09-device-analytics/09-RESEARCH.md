# Phase 9: Device Analytics - Research

**Researched:** 2026-01-28
**Domain:** User-Agent parsing for browser and device detection using bowser library
**Confidence:** HIGH

## Summary

This research covers implementing device analytics by parsing User-Agent strings to extract browser family and device/platform category. The implementation extends the existing Phase 7/8 middleware pattern, adding browser and device labels to the `blog_page_views_total` counter.

The bowser library (v2.13.1) is the recommended solution. It's a lightweight (~4.8kB gzipped), well-maintained browser detection library that provides `getBrowserName()` and `getPlatformType()` methods. The library handles the complexity of User-Agent parsing including Chromium-based browser detection (Chrome, Edge, Opera share similar UA strings), mobile vs desktop platform detection, and graceful fallbacks for unknown browsers.

Key architectural finding: bowser requires a valid string argument for `getParser()`. Empty or undefined User-Agent strings must be handled with a fallback before calling bowser. The library returns `undefined` for browser name when parsing fails, requiring defensive coding.

**Primary recommendation:** Add bowser library, create `app/lib/device-detection.ts` with browser/device parsing logic, extend middleware to pass `x-metrics-browser` and `x-metrics-device` headers, and extend `pageViewsCounter` with `browser` and `device` labels.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| bowser | ^2.13.1 | User-Agent parsing for browser/device detection | 4.8kB gzipped, 13M+ weekly downloads, TypeScript support, handles Chromium variants |
| isbot | (existing) | Bot detection | Already in middleware from Phase 7, continues to provide `is_bot` label |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| (none required) | - | Browser name normalization | Simple mapping in code - major browsers only |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| bowser | ua-parser-js | More comprehensive (heavier) but bowser is sufficient for browser/device detection |
| bowser | detect-browser | Lighter but less maintained, fewer device categories |
| Custom regex | bowser | UA parsing is complex (Chromium variants, etc.) - don't hand-roll |

**Installation:**
```bash
npm install bowser
```

## Architecture Patterns

### Extension to Existing Pattern

The middleware already sets `x-metrics-*` headers that the `PageViewTracker` server component reads. This phase extends that pattern:

```
Request -> Middleware (Edge)
              |
    Extract: path, method, contentType, isBot, source, utmSource, utmMedium (existing)
    Extract: browser, device (NEW)
              |
    Set headers: x-metrics-browser, x-metrics-device (NEW)
              |
         PageViewTracker (Node.js)
              |
    Read headers, increment counter with extended labels
```

### Recommended Code Organization
```
app/lib/
├── metrics.ts             # Modify pageViewsCounter labelNames (+browser, +device)
├── source-detection.ts    # Existing - no changes
├── utm-parser.ts          # Existing - no changes
└── device-detection.ts    # NEW: Browser/device parsing logic
middleware.ts              # Extend with browser/device extraction
app/components/
└── page-view-tracker.tsx  # Extend to read new headers
```

### Pattern 1: bowser Usage for Browser Detection
**What:** Use bowser to parse User-Agent and extract browser name
**When to use:** For all browser family detection

```typescript
// Source: https://github.com/bowser-js/bowser
import Bowser from 'bowser'

function detectBrowser(userAgent: string | null): string {
  if (!userAgent) return 'unknown'

  try {
    const parser = Bowser.getParser(userAgent)
    const browserName = parser.getBrowserName()
    return browserName ? browserName.toLowerCase() : 'unknown'
  } catch {
    return 'unknown'
  }
}
```

### Pattern 2: bowser Usage for Device/Platform Detection
**What:** Use bowser to parse User-Agent and extract platform type
**When to use:** For mobile/desktop/tablet categorization

```typescript
// Source: https://github.com/bowser-js/bowser
import Bowser from 'bowser'

function detectDevice(userAgent: string | null): string {
  if (!userAgent) return 'unknown'

  try {
    const parser = Bowser.getParser(userAgent)
    const platformType = parser.getPlatformType()
    return platformType || 'unknown'
  } catch {
    return 'unknown'
  }
}
```

### Pattern 3: Browser Name Normalization
**What:** Map bowser's detailed browser names to simplified categories
**When to use:** To keep metric cardinality manageable

```typescript
// Bowser returns detailed browser names; normalize to major categories
const BROWSER_NORMALIZATION: Record<string, string> = {
  'chrome': 'chrome',
  'chromium': 'chrome',        // Group with Chrome
  'firefox': 'firefox',
  'librewolf': 'firefox',      // Firefox fork
  'safari': 'safari',
  'mobile safari': 'safari',
  'microsoft edge': 'edge',
  'opera': 'opera',
  'opera coast': 'opera',
  'samsung internet': 'samsung',
  'vivaldi': 'vivaldi',
  'brave': 'brave',
  'internet explorer': 'ie',
  // Everything else falls through to 'other'
}

function normalizeBrowserName(browserName: string): string {
  const normalized = browserName.toLowerCase()
  return BROWSER_NORMALIZATION[normalized] || 'other'
}
```

### Pattern 4: Combined Device Detection Function
**What:** Single function that returns both browser and device
**When to use:** For efficient single parse operation

```typescript
// app/lib/device-detection.ts
import Bowser from 'bowser'

const BROWSER_NORMALIZATION: Record<string, string> = {
  'chrome': 'chrome',
  'chromium': 'chrome',
  'firefox': 'firefox',
  'librewolf': 'firefox',
  'safari': 'safari',
  'mobile safari': 'safari',
  'microsoft edge': 'edge',
  'opera': 'opera',
  'opera coast': 'opera',
  'samsung internet': 'samsung',
  'vivaldi': 'vivaldi',
  'brave': 'brave',
  'internet explorer': 'ie',
}

export function detectBrowserAndDevice(userAgent: string | null): {
  browser: string
  device: string
} {
  // Handle missing/empty User-Agent
  if (!userAgent || userAgent.trim() === '') {
    return { browser: 'unknown', device: 'unknown' }
  }

  try {
    const parser = Bowser.getParser(userAgent)

    // Get browser name and normalize
    const rawBrowserName = parser.getBrowserName()
    const browser = rawBrowserName
      ? (BROWSER_NORMALIZATION[rawBrowserName.toLowerCase()] || 'other')
      : 'unknown'

    // Get platform type (mobile, desktop, tablet, tv, bot)
    const platformType = parser.getPlatformType()
    const device = platformType || 'unknown'

    return { browser, device }
  } catch {
    // Parsing failed - return unknown
    return { browser: 'unknown', device: 'unknown' }
  }
}
```

### Pattern 5: prom-client Counter with Extended Labels
**What:** Add browser and device labels to existing counter
**When to use:** Extending existing metrics

```typescript
// CRITICAL: Labels must be declared at creation time
const pageViewsLabelNames = [
  'path',
  'method',
  'is_bot',
  'content_type',
  'source',
  'utm_source',
  'utm_medium',
  'browser',    // NEW
  'device',     // NEW
] as const
```

### Anti-Patterns to Avoid
- **Calling bowser without try/catch:** Parser can fail on malformed User-Agents
- **Passing undefined to getParser:** Throws error - must validate first
- **Not normalizing browser names:** Results in high cardinality (100+ browser variants)
- **Version tracking in labels:** Browser versions create cardinality explosion - omit
- **Parsing twice:** Parse once, extract both browser and device from same parser instance

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| User-Agent parsing | Custom regex | bowser library | Chromium variants share UA strings; complex detection logic |
| Browser name extraction | String matching | `parser.getBrowserName()` | Handles 50+ browser variants correctly |
| Mobile vs Desktop | Check for "Mobile" keyword | `parser.getPlatformType()` | Tablets, TVs, and edge cases handled |
| Bot detection | UA keyword matching | isbot library (existing) | Already in place from Phase 7, maintained patterns |

**Key insight:** User-Agent strings are notoriously inconsistent. Chrome-based browsers (Edge, Opera, Brave, Vivaldi) all include "Chrome" in their UA. Bowser handles this complexity by checking for specific tokens in correct order.

## Common Pitfalls

### Pitfall 1: Empty/Undefined User-Agent
**What goes wrong:** `Bowser.getParser(undefined)` throws TypeError
**Why it happens:** Some requests (internal, bots) may have no User-Agent header
**How to avoid:** Always validate User-Agent before passing to bowser
**Warning signs:** Runtime errors in middleware, undefined property errors

```typescript
// BAD
const parser = Bowser.getParser(request.headers.get('user-agent'))

// GOOD
const userAgent = request.headers.get('user-agent')
if (!userAgent) return { browser: 'unknown', device: 'unknown' }
const parser = Bowser.getParser(userAgent)
```

### Pitfall 2: Browser Name Returns Undefined
**What goes wrong:** `getBrowserName()` returns undefined for unrecognized User-Agents
**Why it happens:** Some User-Agents don't match any known browser pattern
**How to avoid:** Always check return value, provide fallback
**Warning signs:** `undefined` appearing in Prometheus labels

```typescript
// BAD
const browser = parser.getBrowserName().toLowerCase()

// GOOD
const rawName = parser.getBrowserName()
const browser = rawName ? rawName.toLowerCase() : 'unknown'
```

### Pitfall 3: Version Cardinality Explosion
**What goes wrong:** Storing browser version creates thousands of label combinations
**Why it happens:** Version numbers are highly granular (Chrome 131.0.6778.139)
**How to avoid:** Don't include version in labels - just browser family
**Warning signs:** Prometheus memory growth, slow queries

### Pitfall 4: Case Sensitivity Inconsistency
**What goes wrong:** Same browser appears as "Chrome", "chrome", "CHROME"
**Why it happens:** Not normalizing to lowercase before using as label
**How to avoid:** Always `.toLowerCase()` browser names
**Warning signs:** Duplicate entries in Grafana that should be the same

### Pitfall 5: Bot Traffic Double-Labeling
**What goes wrong:** Bot traffic gets browser="Googlebot" instead of browser="other"
**Why it happens:** bowser recognizes many bots as "browsers"
**How to avoid:** Bots are already labeled with `is_bot=true` from isbot library; let bowser report what it sees
**Warning signs:** None - this is actually fine; filter by `is_bot=true` in queries

### Pitfall 6: Chromium-Based Browser Mis-Identification
**What goes wrong:** Edge shows as Chrome, Opera shows as Chrome
**Why it happens:** All Chromium-based browsers include "Chrome" in UA string
**How to avoid:** Use bowser - it checks for specific browser tokens in correct order
**Warning signs:** All Chromium browsers showing as "Chrome"

## Code Examples

Verified patterns from official sources and established Phase 7/8 patterns:

### Complete Device Detection Module
```typescript
// app/lib/device-detection.ts
import Bowser from 'bowser'

// Normalize bowser's detailed browser names to simplified categories
// Major browsers get their own label; minor browsers grouped as "other"
const BROWSER_NORMALIZATION: Record<string, string> = {
  // Major browsers - keep distinct
  'chrome': 'chrome',
  'firefox': 'firefox',
  'safari': 'safari',
  'mobile safari': 'safari',
  'microsoft edge': 'edge',

  // Significant alternatives - keep distinct
  'opera': 'opera',
  'samsung internet': 'samsung',
  'vivaldi': 'vivaldi',
  'brave': 'brave',

  // Chromium-based - group with parent
  'chromium': 'chrome',

  // Firefox-based - group with parent
  'librewolf': 'firefox',
  'pale moon': 'firefox',

  // Legacy
  'internet explorer': 'ie',
}

/**
 * Parse User-Agent string to extract browser family and device category.
 * Returns normalized values suitable for use as Prometheus metric labels.
 *
 * Browser values: chrome, firefox, safari, edge, opera, samsung, vivaldi, brave, ie, other, unknown
 * Device values: desktop, mobile, tablet, tv, bot, unknown
 */
export function detectBrowserAndDevice(userAgent: string | null): {
  browser: string
  device: string
} {
  // Handle missing/empty User-Agent gracefully
  if (!userAgent || userAgent.trim() === '') {
    return { browser: 'unknown', device: 'unknown' }
  }

  try {
    const parser = Bowser.getParser(userAgent)

    // Extract and normalize browser name
    const rawBrowserName = parser.getBrowserName()
    let browser: string
    if (!rawBrowserName) {
      browser = 'unknown'
    } else {
      const normalizedName = rawBrowserName.toLowerCase()
      browser = BROWSER_NORMALIZATION[normalizedName] || 'other'
    }

    // Extract platform type
    // bowser returns: 'desktop', 'mobile', 'tablet', 'tv', 'bot', or undefined
    const platformType = parser.getPlatformType()
    const device = platformType || 'unknown'

    return { browser, device }
  } catch {
    // Parsing failed (malformed UA string)
    return { browser: 'unknown', device: 'unknown' }
  }
}
```

### Middleware Extension
```typescript
// In middleware.ts - additions to existing middleware
import { detectBrowserAndDevice } from './app/lib/device-detection'

export function middleware(request: NextRequest) {
  // ... existing code for path, method, contentType, isBot, source, UTM ...

  // Extract browser and device from User-Agent
  const userAgent = request.headers.get('user-agent')
  const { browser, device } = detectBrowserAndDevice(userAgent)

  // Add to headers (alongside existing x-metrics-* headers)
  requestHeaders.set('x-metrics-browser', browser)
  requestHeaders.set('x-metrics-device', device)

  // ... rest of existing code ...
}
```

### Updated PageViewTracker
```typescript
// In app/components/page-view-tracker.tsx - additions
export function PageViewTracker() {
  const headersList = headers()

  // ... existing header reads ...
  const browser = headersList.get('x-metrics-browser') || 'unknown'
  const device = headersList.get('x-metrics-device') || 'unknown'

  if (path && method && contentType && isBot) {
    pageViewsCounter.inc({
      path,
      method,
      is_bot: isBot,
      content_type: contentType,
      source,
      utm_source: utmSource,
      utm_medium: utmMedium,
      browser,    // NEW
      device,     // NEW
    })
    // ... rest ...
  }

  return null
}
```

### Updated Metrics Definition
```typescript
// In app/lib/metrics.ts - extend pageViewsLabelNames
const pageViewsLabelNames = [
  'path',
  'method',
  'is_bot',
  'content_type',
  'source',
  'utm_source',
  'utm_medium',
  'browser',    // NEW - Browser family (chrome, firefox, safari, edge, opera, other, unknown)
  'device',     // NEW - Device category (desktop, mobile, tablet, tv, unknown)
] as const
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Custom UA regex | Dedicated parsing libraries | 2020+ | More accurate, maintained patterns |
| Full browser version tracking | Family-only tracking | Best practice | Prevents cardinality explosion |
| ua-parser-js (heavier) | bowser (lighter) | Preference | 4.8kB vs 15kB gzipped |
| Client Hints API | User-Agent string | Emerging (not yet universal) | Client Hints more reliable but not supported everywhere |

**Deprecated/outdated:**
- Browser detection via feature detection (doesn't help with analytics)
- Storing full UA string as label (privacy and cardinality issues)
- bowser v1.x API (v2.0 has different API - use v2.x)

## Browser and Device Categorization

### Browser Categories (DEVICE-01)
Based on bowser's recognition and normalization:

| Label Value | Includes | Notes |
|-------------|----------|-------|
| `chrome` | Chrome, Chromium | Most common browser |
| `firefox` | Firefox, LibreWolf, Pale Moon | Firefox and forks |
| `safari` | Safari, Mobile Safari | macOS and iOS |
| `edge` | Microsoft Edge | Chromium-based since 2020 |
| `opera` | Opera, Opera Coast, Opera Mini | |
| `samsung` | Samsung Internet | Major Android browser |
| `vivaldi` | Vivaldi | Privacy-focused Chromium |
| `brave` | Brave | Privacy-focused Chromium |
| `ie` | Internet Explorer | Legacy |
| `other` | Recognized but minor browsers | UC Browser, QQ, etc. |
| `unknown` | Unrecognized or missing UA | Fallback |

### Device Categories (DEVICE-02)
Based on bowser's `getPlatformType()`:

| Label Value | Description | Example User-Agents |
|-------------|-------------|---------------------|
| `desktop` | Desktop/laptop computers | Windows, macOS, Linux PCs |
| `mobile` | Smartphones | iPhone, Android phones |
| `tablet` | Tablet devices | iPad, Android tablets |
| `tv` | Smart TVs, streaming devices | Roku, Fire TV |
| `bot` | Recognized bot platforms | Note: isbot label is primary bot indicator |
| `unknown` | Unrecognized platform | Fallback |

## Open Questions

Things that couldn't be fully resolved:

1. **Edge Runtime Compatibility**
   - What we know: bowser is a UMD module, should work in Edge runtime
   - What's unclear: Whether there are any Edge runtime limitations
   - Recommendation: Test during implementation; if issues, parse in PageViewTracker instead

2. **Bot Browser Detection Overlap**
   - What we know: isbot detects bots; bowser also recognizes some bots
   - What's unclear: Whether bowser's bot detection conflicts with isbot
   - Recommendation: Continue using isbot for `is_bot` label; let bowser report browser/device as it sees them; filter bots in Grafana queries using `is_bot="false"`

3. **Chromium-Based Browser Accuracy**
   - What we know: bowser handles most Chromium variants correctly
   - What's unclear: Newer Chromium browsers may not be recognized
   - Recommendation: Accept that some new browsers will show as "other" - this is fine for a blog

## Sources

### Primary (HIGH confidence)
- [bowser GitHub](https://github.com/bowser-js/bowser) - API documentation, constants, TypeScript support
- [bowser npm](https://www.npmjs.com/package/bowser) - Latest version v2.13.1, weekly downloads
- [bowser Documentation](https://bowser-js.github.io/bowser/docs/index.html) - Parser API reference
- [Phase 7 Research](../07-page-view-metrics/07-RESEARCH.md) - Established middleware pattern
- [Phase 8 Research](../08-traffic-source-attribution/08-RESEARCH.md) - Header-passing pattern

### Secondary (MEDIUM confidence)
- [bowser GitHub Issues](https://github.com/bowser-js/bowser/issues/485) - getBrowserName() undefined handling
- [MDN User-Agent Header](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/User-Agent) - UA string format
- [npm-compare bowser alternatives](https://npm-compare.com/bowser,detect-browser,ua-parser-js,useragent) - Library comparison

### Tertiary (LOW confidence)
- WebSearch results for browser categorization best practices

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - bowser is well-documented, stable v2.13.1
- Architecture: HIGH - Extends proven Phase 7/8 pattern
- Browser categorization: HIGH - Based on bowser constants file
- Device categorization: HIGH - Based on bowser getPlatformType() return values
- Edge cases: MEDIUM - Empty UA and unknown browser handling based on GitHub issues

**Research date:** 2026-01-28
**Valid until:** 2026-03-28 (60 days - stable library, slow-moving domain)

---

*Phase: 09-device-analytics*
*Research completed: 2026-01-28*
