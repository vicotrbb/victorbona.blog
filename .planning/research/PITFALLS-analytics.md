# Domain Pitfalls: Page Analytics Metrics and Grafana Dashboard Provisioning

**Domain:** Adding page analytics to Prometheus and GitOps dashboard provisioning
**Researched:** 2026-01-28
**Project Context:** Existing prom-client setup with globalThis singleton, ArgoCD GitOps, combining Prometheus metrics with Grafana Faro sessions

---

## Critical Pitfalls

Mistakes that cause memory leaks, cardinality explosions, or broken dashboards.

---

### Pitfall 1: High-Cardinality Path Labels (Cardinality Explosion)

**What goes wrong:** Memory usage grows continuously, Prometheus server becomes slow or crashes, queries time out. Each unique URL path creates a new time series that persists indefinitely.

**Why it happens:** Using raw request paths as Prometheus labels creates unbounded cardinality. Blog posts like `/blog/my-unique-post-slug` each create a new time series. Combined with other labels (method, status), cardinality multiplies.

**Consequences:**
- prom-client memory grows from baseline to 25-30MB per histogram with high cardinality
- Node.js heap grows continuously until OOMKilled
- Prometheus TSDB head series count explodes (>10,000 series is problematic)
- Dashboard queries become slow or fail
- Metrics endpoint latency increases

**Warning signs:**
- `prometheus_tsdb_head_series` metric increasing steadily
- Pod memory usage climbing without ceiling
- `/metrics` endpoint response time increasing
- Grafana queries timing out

**Prevention:**

1. **Normalize dynamic path segments:**
```typescript
// WRONG: Raw paths create unbounded cardinality
labels: { path: '/blog/my-post-slug-2024' }

// CORRECT: Normalize to route templates
function normalizePath(path: string): string {
  // Blog posts -> template
  if (path.startsWith('/blog/') && path !== '/blog') {
    return '/blog/:slug'
  }
  // Keep static routes as-is
  return path
}

labels: { path: normalizePath(req.path) }  // '/blog/:slug'
```

2. **Limit to known routes only:**
```typescript
const TRACKED_ROUTES = new Set(['/', '/blog', '/blog/:slug', '/projects', '/articles'])

function getTrackedPath(path: string): string | null {
  const normalized = normalizePath(path)
  return TRACKED_ROUTES.has(normalized) ? normalized : null
}
```

3. **Monitor cardinality:**
```promql
# Check top cardinality contributors
topk(10, count by (__name__, path)({__name__=~"blog_page_views.*"}))

# Alert on cardinality growth
prometheus_tsdb_head_series > 10000
```

**Detection:**
- Check prom-client memory: Use `process.memoryUsage().heapUsed` before/after metric operations
- Query Prometheus: `count({__name__="blog_page_views_total"})` - should be bounded
- Import Grafana's [Cardinality Explorer dashboard](https://grafana.com/grafana/dashboards/11304)

**Phase to address:** Metrics design phase (before any metric code)

**Sources:**
- [Last9: How to Manage High Cardinality Metrics in Prometheus](https://last9.io/blog/how-to-manage-high-cardinality-metrics-in-prometheus/)
- [Prometheus: Metric and Label Naming](https://prometheus.io/docs/practices/naming/)
- [prom-client Issue #611: High memory usage](https://github.com/siimon/prom-client/issues/611)
- [Dan Laush: Normalizing Next.js dynamic routes for Prometheus](https://danlaush.biz/posts/dynamic-routes-prometheus)

---

### Pitfall 2: Raw User-Agent Labels (Millions of Unique Values)

**What goes wrong:** Each browser version, OS combination, and crawler creates unique time series. User-Agent strings have essentially unlimited cardinality.

**Why it happens:** User-Agent strings contain specific version numbers that change frequently:
- `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.6099.130`
- `Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.6099.131`

These differ by one patch version but create two separate time series.

**Consequences:**
- Same as Pitfall 1 (memory explosion, slow queries)
- Potentially worse: UA strings change with every browser update
- 1000+ unique UA strings is common even for low-traffic sites

**Warning signs:**
- `count by (user_agent)({__name__="blog_page_views_total"})` shows hundreds+ of values
- Memory growth correlates with unique visitor diversity

**Prevention:**

Parse UA into categorical buckets:

```typescript
// WRONG: Raw UA string
labels: { user_agent: req.headers['user-agent'] }

// CORRECT: Parse into bounded categories
import { UAParser } from 'ua-parser-js'

function parseUA(uaString: string | undefined): { device: string; browser: string } {
  if (!uaString) return { device: 'unknown', browser: 'unknown' }

  const parser = new UAParser(uaString)
  const device = parser.getDevice()
  const browser = parser.getBrowser()

  // Bounded categories
  const deviceType = device.type || 'desktop'  // mobile, tablet, desktop
  const browserFamily = browser.name?.toLowerCase() || 'unknown'

  // Normalize browser families (keep cardinality <20)
  const knownBrowsers = ['chrome', 'firefox', 'safari', 'edge', 'opera']
  const normalizedBrowser = knownBrowsers.includes(browserFamily)
    ? browserFamily
    : 'other'

  return { device: deviceType, browser: normalizedBrowser }
}

const { device, browser } = parseUA(req.headers['user-agent'])
labels: { device, browser }  // ~15 combinations max
```

**Detection:**
- Query: `count(count by (browser, device)({__name__="blog_page_views_total"}))` - should be <50

**Phase to address:** Metrics design phase

**Sources:**
- [Middleware.io: Prometheus Labels Best Practices](https://middleware.io/blog/prometheus-labels/)
- [CNCF: Prometheus Labels - Understanding and Best Practices](https://www.cncf.io/blog/2025/07/22/prometheus-labels-understanding-and-best-practices/)

---

### Pitfall 3: Full Referrer URL Labels (Unbounded External Data)

**What goes wrong:** External referrer URLs create unbounded cardinality. Every unique Google search query, social media post URL, and campaign parameter creates a new series.

**Why it happens:** Referrer header contains full URLs with query strings:
- `https://www.google.com/search?q=nextjs+kubernetes+guide&source=hp`
- `https://twitter.com/user/status/1234567890`
- `https://example.com/?utm_source=newsletter&utm_campaign=jan2026`

**Consequences:**
- Cardinality grows with every unique external link to your site
- Attack surface: Malicious actors can craft referrers to explode cardinality
- Query strings alone can be infinite

**Warning signs:**
- Unexplained cardinality spikes (could be attack or viral share)
- Referrer label values contain query strings

**Prevention:**

Extract and normalize domains only:

```typescript
// WRONG: Full referrer URL
labels: { referrer: req.headers.referer }

// CORRECT: Extract normalized source
function normalizeReferrer(referrer: string | undefined): string {
  if (!referrer) return 'direct'

  try {
    const url = new URL(referrer)
    const hostname = url.hostname.toLowerCase()

    // Normalize known sources
    if (hostname.includes('google')) return 'google'
    if (hostname.includes('bing')) return 'bing'
    if (hostname.includes('duckduckgo')) return 'duckduckgo'
    if (hostname.includes('twitter') || hostname.includes('x.com')) return 'twitter'
    if (hostname.includes('linkedin')) return 'linkedin'
    if (hostname.includes('facebook')) return 'facebook'
    if (hostname.includes('reddit')) return 'reddit'
    if (hostname.includes('github')) return 'github'
    if (hostname.includes('news.ycombinator')) return 'hackernews'

    // Self-referral (internal navigation)
    if (hostname.includes('victorbona')) return 'internal'

    // Unknown external
    return 'other'
  } catch {
    return 'invalid'
  }
}

labels: { source: normalizeReferrer(req.headers.referer) }  // ~15 values max
```

**Detection:**
- Query: `count(count by (source)({__name__="blog_page_views_total"}))` - should be <20

**Phase to address:** Metrics design phase

**Sources:**
- [Better Stack: Prometheus Best Practices](https://betterstack.com/community/guides/monitoring/prometheus-best-practices/)
- [SigNoz: Limitations of Prometheus Labels](https://signoz.io/guides/what-are-the-limitations-of-prometheus-labels/)

---

### Pitfall 4: ConfigMap Size Limits for Grafana Dashboards

**What goes wrong:** Dashboard deployment fails with "metadata.annotations: Too long" or ConfigMap creation fails entirely.

**Why it happens:** Two Kubernetes limits affect ConfigMaps:
1. **Annotations limit:** 256KB (`kubectl apply` stores metadata for rollback)
2. **Total ConfigMap limit:** 1MB (etcd storage limitation)

Complex dashboards with many panels, queries, and visualizations can exceed these limits.

**Consequences:**
- `kubectl apply` fails with annotation size error
- ArgoCD sync fails
- Dashboard changes blocked
- GitOps pipeline broken

**Warning signs:**
- Dashboard JSON file >200KB
- Multiple complex panels with long PromQL queries
- Embedded images or large descriptions

**Prevention:**

1. **Split large dashboards:**
```yaml
# Instead of one ConfigMap with everything:
# dashboard-configmap.yaml (too large)

# Split by concern:
# overview-dashboard-configmap.yaml
# performance-dashboard-configmap.yaml
# traffic-dashboard-configmap.yaml
```

2. **Use `kubectl replace` instead of `apply`:**
```yaml
# In ArgoCD Application, use server-side apply or replace
spec:
  syncPolicy:
    syncOptions:
      - ServerSideApply=true
```

3. **Keep dashboards minimal:**
- Use variables instead of hardcoded queries
- Avoid embedding documentation in dashboard JSON
- Link to external documentation instead

4. **Monitor dashboard size:**
```bash
# Check JSON size before committing
wc -c dashboard.json  # Should be <200KB for safety margin
```

**Detection:**
- ArgoCD sync fails with size-related errors
- `kubectl apply -f dashboard-configmap.yaml` fails
- Dashboard JSON exceeds 200KB

**Phase to address:** Dashboard creation phase

**Sources:**
- [GitHub Issue #218: Grafana Dashboards exceed ConfigMap limits](https://github.com/m-lab/prometheus-support/issues/218)
- [GitHub Issue #535: ConfigMap metadata.annotations too long](https://github.com/prometheus-operator/prometheus-operator/issues/535)

---

## Moderate Pitfalls

Mistakes that cause degraded functionality, sync issues, or operational confusion.

---

### Pitfall 5: Grafana Sidecar Race Condition on Startup

**What goes wrong:** Dashboards appear in "General" folder instead of intended custom folder, or dashboards are missing after pod restart.

**Why it happens:** Grafana initializes its dashboard provider before the sidecar has finished parsing all dashboard ConfigMaps. The sidecar loads dashboards into a temporary directory, but Grafana may read it before loading is complete.

**Consequences:**
- Dashboards in wrong folders
- Missing dashboards after restart
- Inconsistent dashboard state

**Warning signs:**
- Dashboards move to "General" folder spontaneously
- Dashboards present after manual refresh but missing initially
- Sidecar logs show 500 errors during reload

**Prevention:**

1. **Configure sidecar timing:**
```yaml
# In Grafana Helm values
sidecar:
  dashboards:
    enabled: true
    label: grafana_dashboard
    labelValue: "1"
    # Increase watch timeout (default 60s may not be enough)
    watchServerTimeout: 300
    # Use folder annotations
    folderAnnotation: grafana_folder
    provider:
      foldersFromFilesStructure: true
```

2. **Add folder annotation to ConfigMap:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: blog-analytics-dashboard
  labels:
    grafana_dashboard: "1"
  annotations:
    grafana_folder: "Blog"  # Explicit folder
data:
  blog-analytics.json: |
    { ... }
```

3. **Use startup probes for Grafana:**
Ensure Grafana is fully ready before sidecar triggers reload.

**Detection:**
- Check dashboard folder after pod restart
- Monitor sidecar logs for timing errors
- Verify `grafana_folder` annotation is set

**Phase to address:** Dashboard deployment phase

**Sources:**
- [GitHub Issue #527: Grafana initializes before sidecar completes](https://github.com/grafana/helm-charts/issues/527)
- [GitHub Issue #18: Sidecar stops working after 10 minutes](https://github.com/grafana/helm-charts/issues/18)

---

### Pitfall 6: Mixed Datasource Queries Don't Interact

**What goes wrong:** Dashboard panels combining Prometheus and Loki (or Faro) data don't allow filtering or joining across sources. Variables from one source don't work in the other.

**Why it happens:** Grafana's "Mixed" datasource is for displaying data side-by-side only. There's no cross-datasource query capability.

**Consequences:**
- Can't correlate Prometheus metrics with Loki logs in same panel
- Variables set from Prometheus won't filter Loki queries
- Dashboard interactivity limited

**Warning signs:**
- Variable interpolation fails in mixed panels
- Clicking a Prometheus time series doesn't filter Loki results
- Query Inspector shows unexpected query behavior

**Prevention:**

1. **Use separate panels, same row:**
```
Row: "Traffic Analysis"
  - Panel 1: Prometheus page views (time series)
  - Panel 2: Loki access logs (logs panel)
  - Link both to same time range variable
```

2. **Use drill-down links instead of mixed queries:**
```json
{
  "links": [
    {
      "title": "View logs for this path",
      "url": "/explore?left=${__data.fields.path}&datasource=loki",
      "targetBlank": true
    }
  ]
}
```

3. **Use Grafana's Explore for correlation:**
Split view in Explore allows side-by-side investigation.

4. **For Faro session correlation:** Use trace IDs as the common key, not mixed queries.

**Detection:**
- Test variable propagation across datasources
- Verify drill-down links work as expected

**Phase to address:** Dashboard design phase

**Sources:**
- [Grafana Community: Problem switching from Loki to mixed datasource](https://community.grafana.com/t/problem-when-passing-from-loki-datasource-to-mixed/56441)
- [Grafana Labs: Loki in Grafana dashboards](https://grafana.com/blog/2020/04/15/loki-quick-tip-how-to-use-a-loki-datasource-in-your-grafana-dashboard/)

---

### Pitfall 7: Provisioned Dashboards Cannot Be Edited in UI

**What goes wrong:** Users try to customize dashboard in Grafana UI, save works but changes disappear after pod restart.

**Why it happens:** Dashboards provisioned via ConfigMaps are read-only. Grafana can persist UI changes to its database, but on restart, the ConfigMap version overwrites database changes.

**Consequences:**
- User confusion ("I saved this, where did it go?")
- Lost customizations
- Divergence between expected and actual dashboard

**Warning signs:**
- "Dashboard cannot be deleted because it was provisioned" error
- Changes don't persist across restarts
- Multiple versions of "same" dashboard

**Prevention:**

1. **Document the GitOps workflow:**
Add panel to dashboard explaining it's provisioned:
```json
{
  "title": "Dashboard Info",
  "type": "text",
  "options": {
    "content": "This dashboard is managed via GitOps. Edit in Git, not here."
  }
}
```

2. **Allow UI updates for iteration (development only):**
```yaml
# In Grafana provisioning config
apiVersion: 1
providers:
  - name: 'default'
    allowUiUpdates: true  # For development
```

3. **Export workflow:** Use Grafana's JSON export to capture UI changes, then commit to Git.

**Detection:**
- Check if dashboard shows provisioned badge
- Verify changes persist after pod restart

**Phase to address:** Dashboard deployment phase (document in README)

**Sources:**
- [Grafana: Provision Dashboards](https://grafana.com/docs/grafana/latest/administration/provisioning/)

---

### Pitfall 8: Histogram Bucket Misconfiguration

**What goes wrong:** Page load time percentiles are inaccurate. p99 shows wrong values. Dashboard shows misleading latency data.

**Why it happens:** Default histogram buckets (5ms to 10s) don't match page load times. Blog page loads are typically 50ms-2s. Default buckets have poor resolution in this range.

**Consequences:**
- Can't accurately calculate p95, p99 latencies
- SLO dashboards show incorrect data
- False confidence in performance

**Warning signs:**
- Percentile values seem "round" or clustered at bucket boundaries
- p50 and p90 show same value
- Histogram shows most observations in single bucket

**Prevention:**

Configure buckets for expected page load distribution:

```typescript
import { Histogram } from 'prom-client'

const pageLoadHistogram = new Histogram({
  name: 'blog_page_load_seconds',
  help: 'Page load time in seconds',
  labelNames: ['path'],
  // Buckets optimized for web page loads (50ms to 5s range)
  buckets: [0.05, 0.1, 0.2, 0.3, 0.5, 0.75, 1, 1.5, 2, 3, 5],
  registers: [metricsRegistry],
})
```

For page views tracked client-side:
```typescript
// If tracking time-to-interactive or similar
buckets: [0.1, 0.25, 0.5, 1, 2, 3, 5, 10]  // Wider range for TTI
```

**Detection:**
- Query: `histogram_quantile(0.99, rate(blog_page_load_seconds_bucket[5m]))` - should show reasonable values
- Check bucket distribution: `blog_page_load_seconds_bucket` should have observations across multiple buckets

**Phase to address:** Metrics design phase

**Sources:**
- [Last9: Histogram Buckets in Prometheus Made Simple](https://last9.io/blog/histogram-buckets-in-prometheus/)
- [Prometheus: Histograms and Summaries](https://prometheus.io/docs/practices/histograms/)

---

## Minor Pitfalls

Mistakes that cause confusion or require minor fixes.

---

### Pitfall 9: Dashboard JSON Formatting Breaks YAML

**What goes wrong:** Helm template fails to render, or dashboard JSON is corrupted after Helm processing.

**Why it happens:** Dashboard JSON contains characters that conflict with YAML parsing or Helm templating (`{{`, `}}`, `:`, special quotes).

**Consequences:**
- Helm install fails
- Dashboard appears but with corrupted queries
- ArgoCD shows sync errors

**Warning signs:**
- `helm template` output shows mangled JSON
- Dashboard panels show "Query Error"
- YAML parsing errors during deployment

**Prevention:**

1. **Use ConfigMap with literal block scalar:**
```yaml
apiVersion: v1
kind: ConfigMap
metadata:
  name: blog-dashboard
data:
  # Use |- for literal block (preserves newlines, strips trailing)
  dashboard.json: |-
    {
      "title": "Blog Analytics",
      ...
    }
```

2. **Escape Helm templating characters:**
```yaml
# If JSON contains {{ }}, escape them:
data:
  dashboard.json: |-
    {
      "expr": "{{`{{`}} .Values.metric {{`}}`}}"
    }
```

3. **Use separate JSON files with Helm Files function:**
```yaml
# In ConfigMap template
data:
  dashboard.json: {{ .Files.Get "dashboards/blog.json" | nindent 4 }}
```

**Detection:**
- `helm template . | yq` to verify YAML validity
- Check rendered JSON in Kubernetes: `kubectl get cm blog-dashboard -o jsonpath='{.data.dashboard\.json}'`

**Phase to address:** Dashboard deployment phase

---

### Pitfall 10: Missing ServiceMonitor Label Selector

**What goes wrong:** Prometheus doesn't scrape the new metrics endpoint. Dashboard shows "No data".

**Why it happens:** ServiceMonitor or PodMonitor `selector` labels don't match the Service or Pod labels. Prometheus Operator ignores non-matching monitors.

**Consequences:**
- Metrics endpoint works (`curl /metrics`) but Prometheus doesn't scrape it
- Dashboard shows no data
- Difficult to debug (no error, just silent failure)

**Warning signs:**
- `/metrics` returns data when curled directly
- Prometheus targets page doesn't show the service
- Dashboard panels show "No data"

**Prevention:**

1. **Verify label matching:**
```yaml
# Service (must match)
apiVersion: v1
kind: Service
metadata:
  name: blog
  labels:
    app.kubernetes.io/name: blog  # <-- This label
spec:
  ...

# ServiceMonitor selector (must match service labels)
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: blog
spec:
  selector:
    matchLabels:
      app.kubernetes.io/name: blog  # <-- Must match
  ...
```

2. **Check Prometheus Operator namespaceSelector:**
```yaml
# If using namespaceSelector, verify it includes your namespace
spec:
  namespaceSelector:
    matchNames:
      - blog  # Must include your namespace
```

3. **Verify Prometheus discovers the ServiceMonitor:**
```bash
kubectl get servicemonitors -A
kubectl get prometheus -o yaml  # Check serviceMonitorSelector
```

**Detection:**
- Prometheus UI -> Status -> Targets (should show blog service)
- `kubectl logs prometheus-...` for scrape errors

**Phase to address:** Helm chart configuration phase

---

### Pitfall 11: Dashboard Variables Query All Data

**What goes wrong:** Dashboard load time is slow. Variables take seconds to populate. Grafana UI feels sluggish.

**Why it happens:** Dashboard variables using `label_values()` without filtering query ALL matching metrics, even from unrelated services.

**Consequences:**
- Slow dashboard load
- High Prometheus query load
- Poor user experience

**Warning signs:**
- Variables take >2 seconds to load
- Prometheus shows high query latency during dashboard load
- CPU spike when opening dashboard

**Prevention:**

1. **Scope variable queries:**
```promql
# WRONG: Queries all metrics
label_values(path)

# CORRECT: Scope to specific metric
label_values(blog_page_views_total, path)
```

2. **Use static lists for bounded values:**
```json
{
  "name": "source",
  "type": "custom",
  "query": "direct,google,twitter,github,other"
}
```

3. **Cache variable results:**
```json
{
  "refresh": 2  // "On Time Range Change" not "On Dashboard Load"
}
```

**Detection:**
- Open browser devtools, check variable query times
- Monitor Prometheus query latency during dashboard load

**Phase to address:** Dashboard creation phase

**Sources:**
- [Mindful Chase: Troubleshooting Slow Grafana Dashboards](https://www.mindfulchase.com/explore/troubleshooting-tips/devops-tools/troubleshooting-slow-dashboards-and-query-failures-in-grafana.html)

---

## Phase-Specific Warnings

| Phase | Likely Pitfall | Mitigation |
|-------|----------------|------------|
| Metrics design | High-cardinality labels (path, UA, referrer) | Normalize paths, parse UA to categories, extract referrer domains |
| prom-client implementation | Memory growth from unbounded labels | Set hard limits on label values, monitor `heapUsed` |
| Histogram configuration | Wrong bucket boundaries | Configure buckets for web page load times (50ms-5s) |
| Dashboard JSON creation | YAML/Helm formatting issues | Use literal block scalar, escape `{{}}` |
| ConfigMap deployment | Size limits exceeded | Keep dashboards <200KB, split if needed |
| Sidecar loading | Race condition, wrong folder | Configure timeouts, use folder annotations |
| ServiceMonitor setup | Label selector mismatch | Verify labels match exactly |
| Dashboard variables | Slow queries | Scope to specific metrics, use static lists |

---

## Pre-Flight Checklist for Analytics Milestone

Before deploying analytics metrics:

- [ ] Path labels are normalized (e.g., `/blog/:slug`)
- [ ] UA labels are categorical (device, browser family)
- [ ] Referrer labels are domain-based (not full URLs)
- [ ] Histogram buckets match expected latency distribution
- [ ] Total unique label combinations estimated (<1000)
- [ ] ConfigMap sizes checked (<200KB per dashboard)
- [ ] ServiceMonitor selector matches Service labels
- [ ] Dashboard variables scoped to specific metrics
- [ ] Folder annotation set on dashboard ConfigMaps
- [ ] Cardinality monitoring query ready

---

## Sources

### Prometheus Cardinality
- [Last9: How to Manage High Cardinality Metrics in Prometheus](https://last9.io/blog/how-to-manage-high-cardinality-metrics-in-prometheus/)
- [Grafana Labs: High Cardinality Metrics in Prometheus and Kubernetes](https://grafana.com/blog/how-to-manage-high-cardinality-metrics-in-prometheus-and-kubernetes/)
- [CNCF: Prometheus Labels - Understanding and Best Practices](https://www.cncf.io/blog/2025/07/22/prometheus-labels-understanding-and-best-practices/)
- [Better Stack: Prometheus Best Practices](https://betterstack.com/community/guides/monitoring/prometheus-best-practices/)

### prom-client
- [GitHub Issue #611: prom-client high memory usage](https://github.com/siimon/prom-client/issues/611)
- [bacebu4: Common Prometheus Pitfalls in Node.js Applications](https://bacebu4.com/posts/common-prometheus-pitfalls-in-nodejs-applications-and-how-to-avoid-them/)

### Path Normalization
- [Dan Laush: Normalizing Next.js dynamic routes for Prometheus](https://danlaush.biz/posts/dynamic-routes-prometheus)

### Grafana Dashboard Provisioning
- [Grafana: Provision Dashboards](https://grafana.com/docs/grafana/latest/administration/provisioning/)
- [GitHub Issue #527: Sidecar race condition](https://github.com/grafana/helm-charts/issues/527)
- [GitHub Issue #218: ConfigMap size limits](https://github.com/m-lab/prometheus-support/issues/218)
- [Medium: Provisioning Dashboards in Grafana via Kubernetes](https://medium.com/how-tos/how-to-provisioning-dashboards-in-grafana-via-kubernetes-5d261508658d)

### Mixed Datasources
- [Grafana Community: Mixed datasource problems](https://community.grafana.com/t/problem-when-passing-from-loki-datasource-to-mixed/56441)

### Histograms
- [Last9: Histogram Buckets in Prometheus](https://last9.io/blog/histogram-buckets-in-prometheus/)
- [Prometheus: Histograms and Summaries](https://prometheus.io/docs/practices/histograms/)
