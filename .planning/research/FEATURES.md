# Feature Landscape: Page Analytics for Blog Prometheus Metrics

**Domain:** Page analytics metrics for personal blog using Prometheus/prom-client
**Existing Stack:** Grafana Faro (browser RUM), prom-client (Node.js runtime metrics), ServiceMonitor
**Researched:** 2026-01-28
**Overall Confidence:** HIGH

---

## Context: What Exists vs What's Needed

### Already Implemented
- **Grafana Faro RUM:** Core Web Vitals (LCP, CLS, INP), JavaScript errors, session tracking (client-side)
- **prom-client default metrics:** Node.js runtime (heap, GC, event loop, CPU)
- **ServiceMonitor:** Prometheus scraping at `/metrics` path

### Gap: Page Analytics
Faro tracks *client-side* performance and errors. The blog needs *server-side* page analytics:
- Which pages are visited (path)
- Where traffic comes from (referrer)
- What devices/browsers are used (user agent)

This is a Prometheus metrics problem, not a Faro problem.

---

## Table Stakes

Features users expect from basic blog analytics. Missing these means no visibility into traffic patterns.

| Feature | Why Expected | Complexity | Implementation Notes |
|---------|--------------|------------|---------------------|
| **Page views by path** | Core analytics - which posts are popular | Low | Counter with `path` label |
| **Total request count** | Basic traffic volume | Low | Counter, already common pattern |
| **Request status codes** | See 404s, errors | Low | Counter with `status_code` label |

### Page Views by Path

The fundamental analytics metric. Must track which URLs are accessed.

**prom-client implementation:**
```typescript
const pageViews = new Counter({
  name: 'blog_page_views_total',
  help: 'Total page views by path',
  labelNames: ['path'] as const,
  registers: [metricsRegistry],
})

// In middleware:
pageViews.inc({ path: normalizedPath })
```

**Dependencies:**
- Existing `metricsRegistry` singleton
- Next.js middleware to intercept requests

**Cardinality consideration:**
- Personal blog has finite pages (~50-100 max)
- Static paths only (no dynamic user IDs)
- Safe cardinality for Prometheus

### Request Status Codes

Track successful vs error responses.

**prom-client implementation:**
```typescript
const httpRequests = new Counter({
  name: 'blog_http_requests_total',
  help: 'Total HTTP requests by path and status',
  labelNames: ['path', 'status_code'] as const,
  registers: [metricsRegistry],
})
```

---

## Differentiators

Features beyond basic analytics. Not strictly required, but valuable for understanding traffic sources.

| Feature | Value Proposition | Complexity | Implementation Notes |
|---------|-------------------|------------|---------------------|
| **Referrer source attribution** | Know where traffic comes from | Medium | Parse referrer into categories |
| **UTM campaign tracking** | Track specific campaign links | Low | Parse `utm_source`, `utm_medium` from query |
| **Browser category** | Desktop vs mobile vs tablet | Medium | Parse User-Agent into categories |
| **Device type** | High-level device breakdown | Medium | UA parsing library required |
| **Request latency histogram** | Performance by path | Medium | Histogram with path label |

### Referrer Source Attribution

Transform raw referrer URLs into actionable categories.

**Why valuable:** "Traffic from Google" is actionable; "traffic from https://www.google.com/search?q=..." is noise.

**Categories (LOW cardinality):**
| Category | Examples | Label Value |
|----------|----------|-------------|
| Direct | No referrer, typing URL | `direct` |
| Search | Google, Bing, DuckDuckGo | `search` |
| Social | Twitter/X, LinkedIn, Hacker News, Reddit | `social` |
| Internal | Same domain | `internal` |
| Other | All other referrers | `other` |

**prom-client implementation:**
```typescript
const pageViewsBySource = new Counter({
  name: 'blog_page_views_by_source_total',
  help: 'Page views by traffic source category',
  labelNames: ['path', 'source'] as const,
  registers: [metricsRegistry],
})

// source is one of: direct, search, social, internal, other
```

**Complexity:** Medium - requires referrer parsing logic, but categories are static.

### UTM Campaign Tracking

Track specific campaigns when UTM parameters are present.

**Standard UTM parameters:**
- `utm_source`: The platform (google, twitter, newsletter)
- `utm_medium`: The marketing medium (cpc, social, email)
- `utm_campaign`: Specific campaign name

**prom-client implementation:**
```typescript
const campaignViews = new Counter({
  name: 'blog_campaign_views_total',
  help: 'Page views from UTM-tagged campaigns',
  labelNames: ['path', 'utm_source', 'utm_medium'] as const,
  registers: [metricsRegistry],
})
```

**Cardinality warning:** Only track if UTM params exist. Most traffic won't have UTM. Keep `utm_campaign` out of labels (too high cardinality) - track source/medium only.

### Browser/Device Categories

Parse User-Agent into low-cardinality categories.

**Browser categories:**
| Category | User-Agent Contains | Label Value |
|----------|---------------------|-------------|
| Chrome | Chrome (not Edge) | `chrome` |
| Firefox | Firefox | `firefox` |
| Safari | Safari (not Chrome) | `safari` |
| Edge | Edg/ | `edge` |
| Bot | bot, crawler, spider | `bot` |
| Other | Everything else | `other` |

**Device categories:**
| Category | Detection | Label Value |
|----------|-----------|-------------|
| Mobile | Mobile, iPhone, Android (mobile) | `mobile` |
| Tablet | iPad, Android (tablet) | `tablet` |
| Desktop | Everything else (not bot) | `desktop` |
| Bot | Bot detection | `bot` |

**prom-client implementation:**
```typescript
const pageViewsByDevice = new Counter({
  name: 'blog_page_views_by_device_total',
  help: 'Page views by device category',
  labelNames: ['path', 'device', 'browser'] as const,
  registers: [metricsRegistry],
})
```

**Libraries:**
- [`ua-parser-js`](https://www.npmjs.com/package/ua-parser-js) - Comprehensive UA parsing
- Or simple regex for 6 categories (lighter weight)

**Recommendation:** Use simple regex for blog. Only need categories, not exact versions.

---

## Anti-Features

Features to explicitly NOT build for a personal blog. These are over-engineering or privacy concerns.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Individual visitor tracking** | Privacy concern, no GDPR consent flow | Aggregate counters only |
| **Full referrer URL in labels** | High cardinality explosion, privacy | Categorize into 5 groups |
| **Exact browser version** | High cardinality (Chrome 120 vs 121 vs...) | Browser category only |
| **IP geolocation** | Privacy, requires GeoIP database, overkill | Skip entirely |
| **Session duration tracking** | Faro already does this client-side | Use existing Faro sessions |
| **User journey/funnel tracking** | Overkill for blog, complex state | Simple page view counts |
| **Full utm_campaign label** | Unbounded cardinality (any string) | Track source/medium only |
| **Request body size metrics** | Blog has no uploads, no value | Skip |
| **Response body size metrics** | Static content, no variance | Skip |
| **Cookie/login state tracking** | Blog has no auth | Skip |
| **A/B test variant tracking** | Blog has no A/B tests | Skip |
| **Per-post engagement time** | Faro Web Vitals covers this | Use existing Faro |

### Why Stateless is Correct

User wants all counters to reset on pod restart. This is **expected Prometheus behavior**:

1. **Prometheus stores time series** - Counters reset, Prometheus records the rate of change
2. **`rate()` and `increase()` handle resets** - Standard PromQL functions expect resets
3. **No state management needed** - No persistent storage in the app
4. **Pod scaling works naturally** - Each pod has its own counters

**Do NOT try to persist counters.** This would fight Prometheus's design.

---

## Feature Dependencies

```
+------------------+     +------------------+
|  Next.js         |     |  Existing        |
|  Middleware      |---->|  metricsRegistry |
|  (new)           |     |  (app/lib/       |
+------------------+     |  metrics.ts)     |
        |                +--------+---------+
        |                         |
        v                         v
+------------------+     +------------------+
| Request Headers  |     | /metrics route   |
| - path           |     | (existing)       |
| - referer        |     +------------------+
| - user-agent     |
| - query string   |
+------------------+
```

**Dependency Notes:**
- Uses existing `metricsRegistry` singleton (HMR-safe)
- Uses existing `/metrics` route (already serving default metrics)
- Requires NEW middleware (intercept all requests)
- No Faro changes needed (separate concern)

---

## MVP Recommendation

For initial page analytics, prioritize in this order:

### Phase 1: Core Page Views (Must Have)
1. **Page view counter with path label** - `blog_page_views_total{path="/blog/post-name"}`
2. **Status code counter** - `blog_http_requests_total{path="/", status_code="200"}`
3. **Next.js middleware** - Intercept requests, increment counters

*Rationale:* Core analytics with minimal implementation. Safe cardinality.

### Phase 2: Traffic Sources (Should Have)
1. **Referrer source categorization** - `blog_page_views_by_source_total{source="search"}`
2. **UTM source/medium tracking** - `blog_campaign_views_total{utm_source="twitter"}`

*Rationale:* Understand where traffic comes from. Still low cardinality with categories.

### Phase 3: Device Analytics (Nice to Have)
1. **Device type counter** - `blog_page_views_by_device_total{device="mobile"}`
2. **Browser category counter** - Same counter with browser label

*Rationale:* UA parsing adds complexity. Lower priority than traffic sources.

**Defer entirely:**
- Geolocation
- Session tracking (Faro handles)
- Engagement metrics (Faro handles)
- Full referrer URLs

---

## Cardinality Budget

Prometheus performance degrades with high cardinality. Budget carefully.

| Metric | Labels | Estimated Series |
|--------|--------|------------------|
| `blog_page_views_total` | path (50) | 50 |
| `blog_http_requests_total` | path (50) x status (5) | 250 |
| `blog_page_views_by_source_total` | path (50) x source (5) | 250 |
| `blog_campaign_views_total` | path (50) x source (10) x medium (5) | 2,500 max |
| `blog_page_views_by_device_total` | path (50) x device (4) x browser (6) | 1,200 |

**Total estimated series:** ~4,250

**Prometheus guideline:** <10,000 series per target is comfortable. This budget is safe.

**Cardinality traps avoided:**
- No exact browser versions (~1000s)
- No full referrer URLs (~unbounded)
- No full utm_campaign (~unbounded)
- No user identifiers (~unbounded)

---

## Expected Metric Output

Example `/metrics` output after implementation:

```prometheus
# HELP blog_page_views_total Total page views by path
# TYPE blog_page_views_total counter
blog_page_views_total{app="victorbona-blog",path="/"} 1234
blog_page_views_total{app="victorbona-blog",path="/blog"} 567
blog_page_views_total{app="victorbona-blog",path="/blog/my-post"} 89

# HELP blog_page_views_by_source_total Page views by traffic source
# TYPE blog_page_views_by_source_total counter
blog_page_views_by_source_total{app="victorbona-blog",path="/",source="direct"} 400
blog_page_views_by_source_total{app="victorbona-blog",path="/",source="search"} 600
blog_page_views_by_source_total{app="victorbona-blog",path="/",source="social"} 234

# HELP blog_page_views_by_device_total Page views by device type
# TYPE blog_page_views_by_device_total counter
blog_page_views_by_device_total{app="victorbona-blog",path="/",device="desktop",browser="chrome"} 500
blog_page_views_by_device_total{app="victorbona-blog",path="/",device="mobile",browser="safari"} 300
```

---

## Sources

### HIGH Confidence (Official Documentation)
- [prom-client GitHub](https://github.com/siimon/prom-client) - Counter API, label patterns
- [Prometheus Best Practices: Naming](https://prometheus.io/docs/practices/naming/) - Metric naming conventions
- [Robust Perception: Cardinality is Key](https://www.robustperception.io/cardinality-is-key/) - Cardinality limits and best practices

### MEDIUM Confidence (Verified Community)
- [Better Stack: prom-client Guide](https://betterstack.com/community/guides/scaling-nodejs/nodejs-prometheus/) - Node.js + Prometheus patterns
- [Simple Analytics: What We Collect](https://docs.simpleanalytics.com/what-we-collect) - Privacy-first analytics patterns
- [CXL: UTM Parameters Guide](https://cxl.com/blog/utm-parameters/) - UTM parameter standards

### LOW Confidence (General Web Search)
- UA parsing patterns (verify library choice during implementation)
- Referrer categorization lists (may need adjustment based on actual traffic)
