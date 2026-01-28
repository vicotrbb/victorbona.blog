# Phase 8: Traffic Source Attribution - Research

**Researched:** 2026-01-28
**Domain:** HTTP Referer header parsing, UTM parameter extraction, Prometheus metric labeling
**Confidence:** HIGH

## Summary

This research investigates how to implement traffic source attribution by parsing the HTTP Referer header and UTM query parameters, then extending the existing page view metrics with source labels. The implementation follows Phase 7's established header-passing pattern where middleware (Edge runtime) extracts data and passes it via request headers to a server component (Node.js runtime) that records prom-client metrics.

The key architectural finding is that prom-client counters cannot have new labels added after creation. The existing `blog_page_views_total` counter must be recreated with the new `source`, `utm_source`, and `utm_medium` labels. This is a breaking change to the metric but necessary for the feature.

**Primary recommendation:** Use the native URL API to parse the Referer header and URLSearchParams for UTM extraction in middleware, pass extracted values via headers, and recreate the pageViewsCounter with extended labelNames including `source`, `utm_source`, and `utm_medium`.

## Standard Stack

The established libraries/tools for this domain:

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| URL (Web API) | Built-in | Parse Referer header to extract hostname | Native, available in Edge runtime, no dependencies |
| URLSearchParams (Web API) | Built-in | Parse query string for UTM parameters | Native, available in Edge runtime, standard WHATWG API |
| prom-client | (existing) | Prometheus metrics with extended labels | Already in use, Phase 7 established pattern |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| isbot | (existing) | Bot detection | Already in middleware from Phase 7 |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Native URL parsing | @tryghost/referrer-parser | Library provides built-in domain->source mapping but adds dependency; user decided to track individual domains, reducing library value |
| Native URL parsing | snowplow-referer-parser | More comprehensive database but heavy; overkill for this use case |
| Custom domain lists | @tryghost/referrer-parser | Library maintains domain lists but our needs are specific and well-defined |

**Why no external library:** The user's CONTEXT.md specifies that individual platforms should be tracked separately (source="google", source="twitter") rather than categories. This means we need a simple domain-to-source mapping, not the sophisticated categorization that libraries like @tryghost/referrer-parser or snowplow-referer-parser provide. The native URL API is sufficient.

## Architecture Patterns

### Extension to Existing Pattern
The middleware already sets `x-metrics-*` headers that the `PageViewTracker` server component reads. This phase extends that pattern:

```
Request → Middleware (Edge)
              ↓
    Extract: path, method, contentType, isBot (existing)
    Extract: source, utmSource, utmMedium (NEW)
              ↓
    Set headers: x-metrics-source, x-metrics-utm-source, x-metrics-utm-medium (NEW)
              ↓
         PageViewTracker (Node.js)
              ↓
    Read headers, increment counter with extended labels
```

### Recommended Code Organization
```
middleware.ts              # Extend with source/UTM extraction
app/lib/
├── metrics.ts             # Modify pageViewsCounter labelNames
├── source-detection.ts    # NEW: Source categorization logic
└── utm-parser.ts          # NEW: UTM extraction and validation
app/components/
└── page-view-tracker.tsx  # Extend to read new headers
```

### Pattern 1: URL-based Domain Extraction
**What:** Use URL API to extract hostname from Referer header
**When to use:** Always for parsing referrer URLs

```typescript
// Source: https://developer.mozilla.org/en-US/docs/Web/API/URL
function extractDomain(referer: string | null): string | null {
  if (!referer) return null
  try {
    const url = new URL(referer)
    return url.hostname.toLowerCase()
  } catch {
    return null // Invalid URL
  }
}
```

### Pattern 2: URLSearchParams for UTM
**What:** Use URLSearchParams to extract UTM parameters from URL
**When to use:** Always for UTM parameter extraction

```typescript
// Source: Next.js docs - request.nextUrl provides searchParams
function extractUtmParams(searchParams: URLSearchParams): { utmSource: string; utmMedium: string } {
  const utmSource = searchParams.get('utm_source')?.toLowerCase() || ''
  const utmMedium = searchParams.get('utm_medium')?.toLowerCase() || ''
  return { utmSource, utmMedium }
}
```

### Pattern 3: Domain-to-Source Mapping
**What:** Map known domains to source identifiers
**When to use:** For categorizing search engines and social platforms

```typescript
// Maps for known source domains
const SEARCH_ENGINE_DOMAINS: Record<string, string> = {
  'google.com': 'google',
  'www.google.com': 'google',
  // Include common regional variants
  'google.co.uk': 'google',
  'google.ca': 'google',
  'google.de': 'google',
  'google.fr': 'google',
  'bing.com': 'bing',
  'www.bing.com': 'bing',
  'duckduckgo.com': 'duckduckgo',
  'search.yahoo.com': 'yahoo',
  'yahoo.com': 'yahoo',
  'baidu.com': 'baidu',
  'www.baidu.com': 'baidu',
  'yandex.com': 'yandex',
  'yandex.ru': 'yandex',
  'ecosia.org': 'ecosia',
  'www.ecosia.org': 'ecosia',
}

const SOCIAL_DOMAINS: Record<string, string> = {
  'twitter.com': 'twitter',
  'x.com': 'twitter',  // X.com redirects, but may appear as referrer
  't.co': 'twitter',   // Twitter link shortener
  'facebook.com': 'facebook',
  'www.facebook.com': 'facebook',
  'm.facebook.com': 'facebook',
  'l.facebook.com': 'facebook',  // Link shim
  'linkedin.com': 'linkedin',
  'www.linkedin.com': 'linkedin',
  'lnkd.in': 'linkedin',  // LinkedIn shortener
  'reddit.com': 'reddit',
  'www.reddit.com': 'reddit',
  'old.reddit.com': 'reddit',
  'instagram.com': 'instagram',
  'l.instagram.com': 'instagram',
  'youtube.com': 'youtube',
  'www.youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'pinterest.com': 'pinterest',
  'tiktok.com': 'tiktok',
  'www.tiktok.com': 'tiktok',
  'news.ycombinator.com': 'hackernews',
  'hn.algolia.com': 'hackernews',
}
```

### Pattern 4: prom-client Counter with Extended Labels
**What:** Recreate counter with all necessary labels
**When to use:** When extending existing metrics with new labels

```typescript
// CRITICAL: Labels must be declared at creation time
const pageViewsLabelNames = [
  'path',
  'method',
  'is_bot',
  'content_type',
  'source',        // NEW
  'utm_source',    // NEW
  'utm_medium',    // NEW
] as const

// Counter must be recreated with new labelNames
function initializePageViewsCounter(): Counter {
  return new Counter({
    name: 'blog_page_views_total',
    help: 'Total page views by path, method, bot status, content type, and source',
    labelNames: pageViewsLabelNames,
    registers: [metricsRegistry],
  })
}
```

### Anti-Patterns to Avoid
- **Trying to add labels after counter creation:** prom-client does not support adding new labelNames to an existing metric. The counter must be recreated with all labels defined upfront.
- **Storing full referrer URLs:** High cardinality risk; extract and normalize to domain or known source identifier.
- **Parsing URLs without try/catch:** Malformed referrer values will throw; always handle exceptions.
- **Case-sensitive comparisons:** Normalize domains and UTM values to lowercase before comparing/storing.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| URL parsing | Custom regex for hostname | `new URL(referer).hostname` | Handles edge cases, encoded characters, ports |
| Query string parsing | Split on & and = | `URLSearchParams` | Handles URL encoding, duplicate params, edge cases |
| Domain normalization | Manual www stripping | Store with www, match both variants in lookup | Simpler, avoids edge cases |

**Key insight:** The native Web APIs (URL, URLSearchParams) are available in Next.js Edge runtime and handle all the edge cases that custom parsing would miss. Do not write custom URL parsers.

## Common Pitfalls

### Pitfall 1: Empty vs Missing Referer
**What goes wrong:** Treating empty string and null/undefined differently when both mean "direct"
**Why it happens:** Referer can be missing (header absent), empty string, or contain a value
**How to avoid:** Always check `!referer` (catches null, undefined, empty string)
**Warning signs:** Direct traffic appears split between multiple source values

### Pitfall 2: Self-Referral Not Detected
**What goes wrong:** Internal navigation (clicking links within the blog) shows as referral traffic
**Why it happens:** Forgetting to check if referrer domain matches own domain
**How to avoid:** Compare referrer hostname against `blog.victorbona.dev` before categorizing
**Warning signs:** Large amounts of "referral" traffic from own domain

### Pitfall 3: prom-client Label Mismatch
**What goes wrong:** Counter.inc() fails or creates wrong time series
**Why it happens:** Passing labels that weren't declared in labelNames, or missing required labels
**How to avoid:** Always pass exact set of labels declared in labelNames; use TypeScript for type safety
**Warning signs:** Runtime errors about unknown labels, or metrics disappearing from /metrics

### Pitfall 4: UTM Parameter Injection
**What goes wrong:** Malicious UTM values cause cardinality explosion or metric name issues
**Why it happens:** Not validating UTM values before using as labels
**How to avoid:** Validate length (max 50 chars), allowed characters (alphanumeric, hyphens, underscores)
**Warning signs:** Prometheus scrape errors, memory growth, slow queries

### Pitfall 5: Case Sensitivity
**What goes wrong:** Same source appears as multiple entries (Google, google, GOOGLE)
**Why it happens:** Not normalizing to lowercase before storage
**How to avoid:** `.toLowerCase()` on all domain and UTM values
**Warning signs:** Duplicate sources in Prometheus/Grafana that should be the same

### Pitfall 6: Referer Privacy Stripping
**What goes wrong:** More traffic than expected shows as "direct"
**Why it happens:** Modern browsers and privacy settings strip Referer header on cross-origin requests
**How to avoid:** Accept this is expected behavior; don't over-engineer detection
**Warning signs:** Direct traffic percentage seems higher than expected

## Code Examples

Verified patterns from official sources and established practices:

### Complete Source Detection Function
```typescript
// app/lib/source-detection.ts
const OWN_DOMAINS = ['blog.victorbona.dev', 'victorbona.dev']

const SEARCH_ENGINE_DOMAINS: Record<string, string> = {
  'google.com': 'google',
  'www.google.com': 'google',
  'google.co.uk': 'google',
  'google.ca': 'google',
  'google.de': 'google',
  'google.fr': 'google',
  'google.com.au': 'google',
  'google.co.jp': 'google',
  'google.com.br': 'google',
  'bing.com': 'bing',
  'www.bing.com': 'bing',
  'm.bing.com': 'bing',
  'duckduckgo.com': 'duckduckgo',
  'search.yahoo.com': 'yahoo',
  'yahoo.com': 'yahoo',
  'baidu.com': 'baidu',
  'www.baidu.com': 'baidu',
  'm.baidu.com': 'baidu',
  'yandex.com': 'yandex',
  'yandex.ru': 'yandex',
  'ecosia.org': 'ecosia',
  'www.ecosia.org': 'ecosia',
  'search.brave.com': 'brave',
  'startpage.com': 'startpage',
  'www.startpage.com': 'startpage',
}

const SOCIAL_DOMAINS: Record<string, string> = {
  'twitter.com': 'twitter',
  'www.twitter.com': 'twitter',
  'mobile.twitter.com': 'twitter',
  'x.com': 'twitter',
  't.co': 'twitter',
  'facebook.com': 'facebook',
  'www.facebook.com': 'facebook',
  'm.facebook.com': 'facebook',
  'l.facebook.com': 'facebook',
  'lm.facebook.com': 'facebook',
  'linkedin.com': 'linkedin',
  'www.linkedin.com': 'linkedin',
  'lnkd.in': 'linkedin',
  'reddit.com': 'reddit',
  'www.reddit.com': 'reddit',
  'old.reddit.com': 'reddit',
  'instagram.com': 'instagram',
  'www.instagram.com': 'instagram',
  'l.instagram.com': 'instagram',
  'youtube.com': 'youtube',
  'www.youtube.com': 'youtube',
  'm.youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'pinterest.com': 'pinterest',
  'www.pinterest.com': 'pinterest',
  'tiktok.com': 'tiktok',
  'www.tiktok.com': 'tiktok',
  'news.ycombinator.com': 'hackernews',
  'mastodon.social': 'mastodon',
  'threads.net': 'threads',
  'www.threads.net': 'threads',
}

export function detectSource(referer: string | null): string {
  // No referer = direct traffic
  if (!referer) {
    return 'direct'
  }

  // Parse the referer URL
  let hostname: string
  try {
    const url = new URL(referer)
    hostname = url.hostname.toLowerCase()
  } catch {
    // Invalid URL = treat as direct
    return 'direct'
  }

  // Self-referral = direct
  if (OWN_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
    return 'direct'
  }

  // Check search engines
  const searchSource = SEARCH_ENGINE_DOMAINS[hostname]
  if (searchSource) {
    return searchSource
  }

  // Check social platforms
  const socialSource = SOCIAL_DOMAINS[hostname]
  if (socialSource) {
    return socialSource
  }

  // Unknown referrer = return the domain as-is (referral)
  return hostname
}
```

### UTM Parameter Extraction with Validation
```typescript
// app/lib/utm-parser.ts
const UTM_MAX_LENGTH = 50
const UTM_ALLOWED_PATTERN = /^[a-z0-9_-]*$/

function validateUtmValue(value: string | null): string {
  if (!value) return ''

  // Normalize to lowercase
  const normalized = value.toLowerCase()

  // Check length
  if (normalized.length > UTM_MAX_LENGTH) return ''

  // Check allowed characters
  if (!UTM_ALLOWED_PATTERN.test(normalized)) return ''

  return normalized
}

export function extractUtmParams(searchParams: URLSearchParams): {
  utmSource: string
  utmMedium: string
} {
  return {
    utmSource: validateUtmValue(searchParams.get('utm_source')),
    utmMedium: validateUtmValue(searchParams.get('utm_medium')),
  }
}
```

### Middleware Extension
```typescript
// In middleware.ts - additions to existing middleware
export function middleware(request: NextRequest) {
  // ... existing code for path, method, contentType, isBot ...

  // Extract referrer source
  const referer = request.headers.get('referer')
  const source = detectSource(referer)

  // Extract UTM parameters
  const { utmSource, utmMedium } = extractUtmParams(request.nextUrl.searchParams)

  // Add to headers
  requestHeaders.set('x-metrics-source', source)
  requestHeaders.set('x-metrics-utm-source', utmSource)
  requestHeaders.set('x-metrics-utm-medium', utmMedium)

  // ... rest of existing code ...
}
```

### Updated PageViewTracker
```typescript
// In app/components/page-view-tracker.tsx - additions
export function PageViewTracker() {
  const headersList = headers()

  // ... existing header reads ...
  const source = headersList.get('x-metrics-source') || 'direct'
  const utmSource = headersList.get('x-metrics-utm-source') || ''
  const utmMedium = headersList.get('x-metrics-utm-medium') || ''

  if (path && method && contentType && isBot) {
    pageViewsCounter.inc({
      path,
      method,
      is_bot: isBot,
      content_type: contentType,
      source,        // NEW
      utm_source: utmSource,  // NEW
      utm_medium: utmMedium,  // NEW
    })
    // ... rest ...
  }

  return null
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| document.referrer client-side | Server-side Referer header | N/A (both valid) | Server-side is more reliable, works without JS |
| Custom URL regex parsing | Native URL API | Widely adopted | More reliable, handles edge cases |
| External referrer-parser libraries | Simple domain mapping | For simple use cases | Reduces dependencies when full categorization not needed |

**Deprecated/outdated:**
- Relying solely on referrer for attribution (privacy policies increasingly strip it)
- Complex referrer databases for simple blog use cases (overkill)

## Open Questions

Things that couldn't be fully resolved:

1. **Metric Continuity**
   - What we know: Changing labelNames requires recreating the counter
   - What's unclear: Whether existing metric data in Prometheus will conflict or just appear as different time series
   - Recommendation: This is acceptable; new time series will be created with new label combinations. Old data remains but won't receive new increments.

2. **Google Regional Domains Coverage**
   - What we know: Google has 190+ regional domains (google.de, google.fr, etc.)
   - What's unclear: How many to include in the mapping
   - Recommendation: Include the most common 10-15 regional variants. Edge cases will fall through to "referral" which is acceptable for a low-traffic blog.

3. **Bot Traffic Source Tracking**
   - What we know: Phase 7 already tracks `is_bot` label
   - What's unclear: Whether bots should get source attribution or be treated differently
   - Recommendation: Apply source detection to all traffic including bots. The `is_bot` label allows filtering them out in queries if needed.

## Sources

### Primary (HIGH confidence)
- [MDN Referer Header Documentation](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Referer) - Header behavior, when empty/missing
- [Next.js Edge Runtime API](https://nextjs.org/docs/pages/api-reference/edge) - URL and URLSearchParams availability
- [prom-client GitHub](https://github.com/siimon/prom-client) - labelNames must be declared at creation

### Secondary (MEDIUM confidence)
- [Snowplow referer-parser referers.yml](https://github.com/snowplow-referer-parser/referer-parser) - Domain lists for search/social
- [Attributer search engine domain list](https://help.attributer.io/articles/list-of-recognised-search-engine-domains/) - Comprehensive search engine domains
- [UTMGuard best practices](https://www.utmguard.com/blog/url-parameters-best-practices) - UTM validation guidelines

### Tertiary (LOW confidence)
- WebSearch results for social media domain lists - Cross-verified with Snowplow database

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using native Web APIs, documented and stable
- Architecture: HIGH - Extends proven Phase 7 pattern
- Domain lists: MEDIUM - Based on Snowplow database, may need expansion over time
- UTM validation: MEDIUM - Based on industry practices, specific limits are configurable

**Research date:** 2026-01-28
**Valid until:** 2026-03-28 (60 days - stable domain, slow-moving target)

---

*Phase: 08-traffic-source-attribution*
*Research completed: 2026-01-28*
