# Phase 10: Grafana Dashboard - Research

**Researched:** 2026-01-28
**Domain:** GitOps-provisioned Grafana dashboard with Prometheus and Faro/Loki data sources
**Confidence:** HIGH

## Summary

This research covers implementing a Grafana dashboard provisioned via Kubernetes ConfigMap that visualizes page view metrics (Prometheus), traffic sources, device analytics, and browser RUM data (Faro/Loki). The dashboard will be automatically discovered by Grafana's kiwigrid/k8s-sidecar when deployed to the cluster.

The dashboard uses a single-page layout with collapsible row sections organized by user questions: "How much traffic?", "Where from?", "What devices?", "How fast?". Panels include stat panels for KPIs, time series for trends, pie charts for breakdowns, and tables for rankings. Prometheus metrics come from the `blog_page_views_total` counter (with labels: path, method, is_bot, content_type, source, utm_source, utm_medium, browser, device) implemented in Phases 7-9. Faro/Loki data provides Web Vitals (LCP, INP, CLS) and session information.

**Primary recommendation:** Create a Helm chart template that generates a ConfigMap with the dashboard JSON, labeled with `grafana_dashboard: "1"` for sidecar discovery. Use the Grafana v12/v42+ schema with collapsible row panels containing time series, stat, pie chart, and table visualizations querying both Prometheus and Loki data sources.

## Standard Stack

The established patterns for this domain:

### Core
| Component | Version/Type | Purpose | Why Standard |
|-----------|--------------|---------|--------------|
| Grafana Dashboard JSON | Schema v42+ | Dashboard definition | Current Grafana standard, supports all panel types |
| ConfigMap | v1 | Dashboard storage | GitOps-friendly, sidecar-discoverable |
| kiwigrid/k8s-sidecar | (Grafana default) | Dashboard auto-discovery | Standard in kube-prometheus-stack, watches for labeled ConfigMaps |

### Panel Types Used
| Panel Type | Purpose | Grafana Type |
|------------|---------|--------------|
| Stat | KPI summary (total views, unique sessions) | `stat` |
| Time Series | Page views over time | `timeseries` |
| Table | Top pages ranking | `table` |
| Pie Chart | Traffic sources, browser/device breakdown | `piechart` |
| Row | Collapsible section containers | `row` |

### Data Sources Required
| Data Source | Type | Queries |
|-------------|------|---------|
| Prometheus | prometheus | Page views, traffic sources, device metrics (`blog_page_views_total`) |
| Loki | loki | Faro session logs, Web Vitals measurements |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ConfigMap + sidecar | GrafanaDashboard CRD (grafana-operator) | Operator adds complexity; sidecar is simpler for single dashboard |
| JSON in ConfigMap | External URL | External URL requires hosting; ConfigMap is GitOps-native |
| Manual dashboard | Terraform/Pulumi | Additional IaC tool; Helm template is self-contained |

## Architecture Patterns

### Recommended Project Structure
```
chart/
├── templates/
│   └── grafana-dashboard.yaml    # NEW: ConfigMap with dashboard JSON
└── values.yaml                   # Existing: may add dashboard config toggle
```

### Pattern 1: Dashboard ConfigMap Template
**What:** Helm template that generates a ConfigMap containing the dashboard JSON
**When to use:** Always - this is the GitOps-native approach for dashboard provisioning
**Example:**
```yaml
# chart/templates/grafana-dashboard.yaml
{{- if .Values.observability.dashboard.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "app-template.fullname" . }}-grafana-dashboard
  namespace: {{ .Values.observability.dashboard.namespace | default "observability-system" }}
  labels:
    {{- include "app-template.commonLabels" . | nindent 4 }}
    grafana_dashboard: "1"
  {{- with .Values.observability.dashboard.annotations }}
  annotations:
    {{- toYaml . | nindent 4 }}
  {{- end }}
data:
  victorbona-blog-dashboard.json: |-
{{ .Files.Get "dashboards/blog-analytics.json" | indent 4 }}
{{- end }}
```

### Pattern 2: Dashboard JSON Root Structure
**What:** Complete Grafana dashboard JSON with all required fields
**When to use:** As the base structure for the dashboard
**Example:**
```json
{
  "uid": "victorbona-blog-analytics",
  "title": "victorbona.blog Analytics",
  "description": "Page views, traffic sources, devices, and Web Vitals",
  "tags": ["victorbona-blog", "analytics"],
  "timezone": "browser",
  "editable": false,
  "graphTooltip": 1,
  "schemaVersion": 42,
  "refresh": "30s",
  "time": {
    "from": "now-24h",
    "to": "now"
  },
  "timepicker": {
    "refresh_intervals": ["5s", "10s", "30s", "1m", "5m", "15m"],
    "time_options": ["5m", "15m", "1h", "6h", "12h", "24h", "2d", "7d"]
  },
  "templating": {
    "list": []
  },
  "annotations": {
    "list": []
  },
  "panels": []
}
```

### Pattern 3: Collapsible Row Panel
**What:** Row panel that groups related panels with expand/collapse capability
**When to use:** For organizing dashboard into logical sections
**Example:**
```json
{
  "type": "row",
  "title": "Traffic Overview - How much traffic?",
  "collapsed": false,
  "gridPos": { "h": 1, "w": 24, "x": 0, "y": 0 },
  "id": 1,
  "panels": []
}
```

### Pattern 4: Stat Panel for KPIs
**What:** Large single-value display with optional sparkline
**When to use:** Summary row showing total views, unique sessions, top page
**Example:**
```json
{
  "type": "stat",
  "title": "Total Page Views",
  "gridPos": { "h": 4, "w": 6, "x": 0, "y": 1 },
  "id": 2,
  "datasource": {
    "type": "prometheus",
    "uid": "${datasource}"
  },
  "targets": [
    {
      "refId": "A",
      "expr": "sum(increase(blog_page_views_total{is_bot=\"false\"}[$__range]))",
      "legendFormat": "Page Views"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "short",
      "decimals": 0,
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "color": "green", "value": null }
        ]
      }
    }
  },
  "options": {
    "colorMode": "value",
    "graphMode": "area",
    "textMode": "auto",
    "orientation": "auto"
  }
}
```

### Pattern 5: Time Series Panel for Trends
**What:** Line graph showing metrics over time
**When to use:** Page views over time visualization
**Example:**
```json
{
  "type": "timeseries",
  "title": "Page Views Over Time",
  "gridPos": { "h": 8, "w": 24, "x": 0, "y": 5 },
  "id": 3,
  "datasource": {
    "type": "prometheus",
    "uid": "${datasource}"
  },
  "targets": [
    {
      "refId": "A",
      "expr": "sum(rate(blog_page_views_total{is_bot=\"false\"}[$__rate_interval])) * 60",
      "legendFormat": "Views/min"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "short",
      "custom": {
        "drawStyle": "line",
        "lineWidth": 2,
        "fillOpacity": 25,
        "gradientMode": "opacity",
        "spanNulls": false,
        "pointSize": 5,
        "showPoints": "auto"
      }
    }
  },
  "options": {
    "tooltip": { "mode": "single", "sort": "none" },
    "legend": { "displayMode": "list", "placement": "bottom" }
  }
}
```

### Pattern 6: Table Panel for Rankings
**What:** Sortable table showing top pages by view count
**When to use:** Top pages ranking (DASH-04)
**Example:**
```json
{
  "type": "table",
  "title": "Top Pages",
  "gridPos": { "h": 8, "w": 12, "x": 0, "y": 13 },
  "id": 4,
  "datasource": {
    "type": "prometheus",
    "uid": "${datasource}"
  },
  "targets": [
    {
      "refId": "A",
      "expr": "topk(10, sum by (path) (increase(blog_page_views_total{is_bot=\"false\"}[$__range])))",
      "format": "table",
      "instant": true
    }
  ],
  "transformations": [
    {
      "id": "organize",
      "options": {
        "excludeByName": { "Time": true },
        "renameByName": { "path": "Page", "Value": "Views" }
      }
    }
  ],
  "fieldConfig": {
    "defaults": {
      "custom": {
        "align": "auto",
        "filterable": true
      }
    },
    "overrides": [
      {
        "matcher": { "id": "byName", "options": "Views" },
        "properties": [
          { "id": "unit", "value": "short" },
          { "id": "decimals", "value": 0 }
        ]
      }
    ]
  },
  "options": {
    "showHeader": true,
    "sortBy": [{ "displayName": "Views", "desc": true }]
  }
}
```

### Pattern 7: Pie Chart Panel for Breakdowns
**What:** Pie/donut chart showing distribution
**When to use:** Traffic sources, browser, device breakdowns
**Example:**
```json
{
  "type": "piechart",
  "title": "Traffic Sources",
  "gridPos": { "h": 8, "w": 8, "x": 0, "y": 21 },
  "id": 5,
  "datasource": {
    "type": "prometheus",
    "uid": "${datasource}"
  },
  "targets": [
    {
      "refId": "A",
      "expr": "sum by (source) (increase(blog_page_views_total{is_bot=\"false\"}[$__range]))",
      "legendFormat": "{{source}}"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "color": { "mode": "palette-classic" },
      "unit": "short",
      "decimals": 0
    }
  },
  "options": {
    "pieType": "pie",
    "tooltip": { "mode": "single", "sort": "none" },
    "legend": {
      "displayMode": "table",
      "placement": "right",
      "values": ["value", "percent"]
    },
    "displayLabels": ["name", "percent"],
    "reduceOptions": {
      "values": false,
      "calcs": ["lastNotNull"]
    }
  }
}
```

### Pattern 8: Loki Query for Web Vitals
**What:** LogQL query to extract Faro Web Vitals measurements
**When to use:** Web Vitals panels (LCP, INP, CLS)
**Example:**
```json
{
  "type": "stat",
  "title": "LCP (p75)",
  "gridPos": { "h": 4, "w": 4, "x": 0, "y": 29 },
  "id": 6,
  "datasource": {
    "type": "loki",
    "uid": "${loki}"
  },
  "targets": [
    {
      "refId": "A",
      "expr": "{app=\"victorbona-blog\"} |= `kind=measurement` |= `type=web-vitals` |= `lcp=` | logfmt | unwrap lcp | quantile_over_time(0.75, [1h])",
      "legendFormat": "LCP"
    }
  ],
  "fieldConfig": {
    "defaults": {
      "unit": "ms",
      "thresholds": {
        "mode": "absolute",
        "steps": [
          { "color": "green", "value": null },
          { "color": "yellow", "value": 2500 },
          { "color": "red", "value": 4000 }
        ]
      }
    }
  },
  "options": {
    "colorMode": "value",
    "graphMode": "none"
  }
}
```

### Anti-Patterns to Avoid
- **Hardcoding datasource UIDs:** Use template variables (`${datasource}`, `${loki}`) for portability
- **Nested panels in non-collapsed rows:** Grafana's JSON model puts panels at top level unless row is collapsed
- **Missing `schemaVersion`:** Older Grafana versions may not parse dashboard correctly
- **High-cardinality queries without aggregation:** Always use `sum by ()` or `topk()` for label-heavy metrics
- **Using `rate()` for stat panels:** Use `increase()` for totals in stat panels, `rate()` for time series

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Dashboard JSON generation | Manual JSON editing | Grafana UI export + cleanup | Grafana generates correct structure, then parameterize |
| Data source references | Hardcoded UIDs | Template variables | Portability across environments |
| Time range in queries | Hardcoded intervals | `$__range`, `$__rate_interval` | Grafana auto-adjusts based on dashboard time picker |
| Top-N calculations | Complex transforms | `topk()` PromQL function | Built-in, efficient |
| Percentage calculations | Manual division | Pie chart with `percent` legend | Grafana calculates automatically |

**Key insight:** Build the dashboard visually in Grafana first, export the JSON, then clean it up (remove IDs, add variables, externalize datasource references). This ensures correct panel structure.

## Common Pitfalls

### Pitfall 1: ConfigMap Not Discovered
**What goes wrong:** Dashboard doesn't appear in Grafana after deployment
**Why it happens:** Missing or incorrect label (`grafana_dashboard: "1"`), wrong namespace, or sidecar disabled
**How to avoid:**
- Verify label is exactly `grafana_dashboard: "1"` (string "1", not integer)
- Deploy ConfigMap to same namespace as Grafana OR configure sidecar with `searchNamespace: ALL`
- Verify sidecar is enabled in Grafana Helm values
**Warning signs:** ConfigMap exists but dashboard absent from Grafana

### Pitfall 2: Datasource Not Found
**What goes wrong:** Panels show "Datasource not found" error
**Why it happens:** Hardcoded datasource UID that doesn't exist in target environment
**How to avoid:** Use datasource template variable with `type: datasource` query
**Warning signs:** Works in one environment but fails in another

### Pitfall 3: Row Panel JSON Quirks
**What goes wrong:** Panels inside a collapsed row disappear after save/reload
**Why it happens:** Grafana's JSON model moves panels into row's `panels[]` array when collapsed, but keeps them at top level when expanded
**How to avoid:** For provisioned dashboards, set `collapsed: false` and place panels at top-level `panels[]` array with correct `y` positions
**Warning signs:** Panels visible in UI but missing from JSON after collapse

### Pitfall 4: Rate vs Increase Confusion
**What goes wrong:** Time series shows per-second rates when user expects totals; stat panels show tiny numbers
**Why it happens:** Using `rate()` everywhere; `rate()` gives per-second, `increase()` gives total over range
**How to avoid:**
- Time series: `rate(metric[$__rate_interval]) * 60` for per-minute views
- Stat panels: `increase(metric[$__range])` for totals over selected period
- Pie charts: `increase()` for totals
**Warning signs:** Stat panel showing 0.0123 instead of 123

### Pitfall 5: Faro/Loki Query Complexity
**What goes wrong:** Web Vitals queries return no data or errors
**Why it happens:** Faro logs are structured (logfmt), require `| logfmt` parser before filtering
**How to avoid:** Always include `| logfmt` after stream selector, use `|=` for substring matching
**Warning signs:** Empty panels, "parse error" in Explore

### Pitfall 6: Time Range Mismatch
**What goes wrong:** Some panels show data, others are empty
**Why it happens:** Instant queries with short ranges, or metrics not yet collected in selected range
**How to avoid:** Use `$__range` variable consistently, ensure metrics have data for default 24h range
**Warning signs:** Works with "Last 7 days" but not "Last 1 hour"

## Code Examples

Verified patterns from official sources and community best practices:

### Complete Dashboard JSON Structure
```json
{
  "uid": "victorbona-blog-analytics",
  "title": "victorbona.blog Analytics",
  "description": "Page views, traffic sources, device analytics, and Web Vitals",
  "tags": ["victorbona-blog", "analytics", "rum"],
  "timezone": "browser",
  "editable": false,
  "graphTooltip": 1,
  "schemaVersion": 42,
  "refresh": "30s",
  "time": {
    "from": "now-24h",
    "to": "now"
  },
  "timepicker": {
    "refresh_intervals": ["5s", "10s", "30s", "1m", "5m"],
    "time_options": ["5m", "15m", "1h", "6h", "12h", "24h", "2d", "7d", "30d"]
  },
  "templating": {
    "list": [
      {
        "name": "datasource",
        "type": "datasource",
        "query": "prometheus",
        "current": {},
        "hide": 0,
        "label": "Prometheus"
      },
      {
        "name": "loki",
        "type": "datasource",
        "query": "loki",
        "current": {},
        "hide": 0,
        "label": "Loki"
      }
    ]
  },
  "annotations": {
    "list": []
  },
  "panels": []
}
```

### ConfigMap Template for Helm
```yaml
# chart/templates/grafana-dashboard.yaml
{{- if .Values.observability.dashboard.enabled }}
apiVersion: v1
kind: ConfigMap
metadata:
  name: {{ include "app-template.fullname" . }}-grafana-dashboard
  namespace: {{ .Values.observability.dashboard.namespace | default .Release.Namespace }}
  labels:
    {{- include "app-template.commonLabels" . | nindent 4 }}
    grafana_dashboard: "1"
  {{- if .Values.observability.dashboard.folder }}
  annotations:
    grafana_folder: {{ .Values.observability.dashboard.folder | quote }}
  {{- end }}
data:
  victorbona-blog-dashboard.json: |-
{{ .Files.Get "files/dashboards/blog-analytics.json" | indent 4 }}
{{- end }}
```

### Values.yaml Addition
```yaml
# chart/values.yaml (additions to observability section)
observability:
  dashboard:
    enabled: true
    namespace: "observability-system"  # Namespace where Grafana runs
    folder: "Applications"             # Optional: target Grafana folder
```

### PromQL Queries Reference

**Page views over time (rate):**
```promql
sum(rate(blog_page_views_total{is_bot="false"}[$__rate_interval])) * 60
```

**Total page views (stat panel):**
```promql
sum(increase(blog_page_views_total{is_bot="false"}[$__range]))
```

**Top pages ranking:**
```promql
topk(10, sum by (path) (increase(blog_page_views_total{is_bot="false"}[$__range])))
```

**Traffic sources breakdown:**
```promql
sum by (source) (increase(blog_page_views_total{is_bot="false"}[$__range]))
```

**Browser distribution:**
```promql
sum by (browser) (increase(blog_page_views_total{is_bot="false"}[$__range]))
```

**Device distribution:**
```promql
sum by (device) (increase(blog_page_views_total{is_bot="false"}[$__range]))
```

### LogQL Queries for Faro/Web Vitals

**LCP (Largest Contentful Paint) p75:**
```logql
{app="victorbona-blog"} |= `kind=measurement` |= `type=web-vitals` | logfmt | unwrap lcp [1h] | quantile_over_time(0.75)
```

**INP (Interaction to Next Paint) p75:**
```logql
{app="victorbona-blog"} |= `kind=measurement` |= `type=web-vitals` | logfmt | unwrap inp [1h] | quantile_over_time(0.75)
```

**CLS (Cumulative Layout Shift) p75:**
```logql
{app="victorbona-blog"} |= `kind=measurement` |= `type=web-vitals` | logfmt | unwrap cls [1h] | quantile_over_time(0.75)
```

**Unique sessions count:**
```logql
count(count_over_time({app="victorbona-blog"} |= `kind=` | logfmt | by (session_id) [$__range]))
```
*Note: This is an approximation - Loki has limitations counting truly unique values.*

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Manual dashboard import | ConfigMap + sidecar | Grafana 6+ (2019) | GitOps-native provisioning |
| FID (First Input Delay) | INP (Interaction to Next Paint) | Faro v2 (2025) | Better responsiveness metric |
| Grafana Dashboard v1 schema | Schema v42+ | Grafana 10+ | Improved panel options structure |
| grafana_dashboard annotation | grafana_dashboard label | sidecar convention | Label-based discovery |

**Deprecated/outdated:**
- **FID metric:** Replaced by INP; FID support being removed from Faro dashboards
- **Dashboard JSON v1:** Use schemaVersion 42+ for current Grafana versions
- **Hardcoded datasource names:** Always use template variables

## Dashboard Layout Plan

Based on CONTEXT.md decisions:

### Row 1: Summary Stats (y=0-4)
| Panel | Type | Width | Query |
|-------|------|-------|-------|
| Total Views | stat | w=6 | `sum(increase(blog_page_views_total{is_bot="false"}[$__range]))` |
| Unique Sessions | stat | w=6 | Loki session count |
| Top Page | stat | w=6 | `topk(1, sum by (path) (increase(...)))` |
| Avg Page Load | stat | w=6 | Faro TTFB/LCP |

### Row 2: Traffic Trends - "How much traffic?" (y=5-13)
| Panel | Type | Width | Query |
|-------|------|-------|-------|
| Page Views Over Time | timeseries | w=24 | `sum(rate(...[$__rate_interval])) * 60` |

### Row 3: Top Pages (y=14-21)
| Panel | Type | Width | Query |
|-------|------|-------|-------|
| Top Pages Ranking | table | w=24 | `topk(10, sum by (path) (increase(...)))` |

### Row 4: Traffic Sources - "Where from?" (y=22-29)
| Panel | Type | Width | Query |
|-------|------|-------|-------|
| Traffic Sources | piechart | w=8 | `sum by (source) (increase(...))` |
| UTM Sources | piechart | w=8 | `sum by (utm_source) (increase(...))` |
| UTM Mediums | piechart | w=8 | `sum by (utm_medium) (increase(...))` |

### Row 5: Devices - "What devices?" (y=30-37)
| Panel | Type | Width | Query |
|-------|------|-------|-------|
| Browsers | piechart | w=12 | `sum by (browser) (increase(...))` |
| Devices | piechart | w=12 | `sum by (device) (increase(...))` |

### Row 6: Performance - "How fast?" (y=38-49)
| Panel | Type | Width | Query |
|-------|------|-------|-------|
| Web Vitals Health | stat | w=8 | Combined health indicator |
| LCP | stat | w=4 | Loki LCP p75 |
| INP | stat | w=4 | Loki INP p75 |
| CLS | stat | w=4 | Loki CLS p75 |
| JS Errors | stat | w=4 | Loki error count |

## Open Questions

Things that couldn't be fully resolved:

1. **Loki Labels for Faro Data**
   - What we know: Faro sends data to Loki via Alloy; labels must be configured in Alloy
   - What's unclear: Exact label configuration in existing Alloy setup
   - Recommendation: Verify Alloy config includes `app` label from Faro; may need to add labels in `loki.write` component

2. **Unique Session Counting Accuracy**
   - What we know: Loki/LogQL has limitations for counting distinct values
   - What's unclear: Whether `count(count_over_time(... by (session_id)))` is accurate enough
   - Recommendation: Use approximation for now; document as estimate, not exact count

3. **Web Vitals Field Names in Loki**
   - What we know: Faro sends web-vitals as logfmt structured logs
   - What's unclear: Exact field names in current Faro version (lcp, inp, cls vs longer names)
   - Recommendation: Test queries in Grafana Explore against actual Loki data before finalizing

4. **Datasource Template Variables**
   - What we know: Using `${datasource}` requires Grafana to have matching datasources
   - What's unclear: Exact datasource names/UIDs in target environment
   - Recommendation: Use `type: datasource` query for dynamic discovery

## Sources

### Primary (HIGH confidence)
- [Grafana Dashboard JSON Model](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/view-dashboard-json-model/) - Official JSON structure documentation
- [Grafana Provisioning](https://grafana.com/docs/grafana/latest/administration/provisioning/) - Dashboard provisioning configuration
- [Grafana Best Practices](https://grafana.com/docs/grafana/latest/visualizations/dashboards/build-dashboards/best-practices/) - Dashboard design guidelines
- [PromQL Cheat Sheet](https://promlabs.com/promql-cheat-sheet/) - Query patterns
- [Grafana Pie Chart](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/visualizations/pie-chart/) - Pie chart panel configuration
- [Grafana Stat Panel](https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/visualizations/stat/) - Stat panel configuration

### Secondary (MEDIUM confidence)
- [ConfigMap Dashboard Provisioning](https://fabianlee.org/2022/07/06/prometheus-adding-a-grafana-dashboard-using-a-configmap/) - Detailed ConfigMap+sidecar walkthrough
- [Grafana Dashboards as ConfigMaps](https://faun.pub/grafana-dashboards-as-configmaps-fbd7d493a2bc) - GitOps provisioning patterns
- [Kubernetes Dashboards Repository](https://github.com/dotdc/grafana-dashboards-kubernetes) - Real-world dashboard JSON examples
- [Grafana Faro Web Vitals](https://grafana.com/docs/grafana-cloud/monitor-applications/frontend-observability/instrument/web-vitals/) - Faro metrics documentation
- [Prometheus Rate Function](https://www.metricfire.com/blog/understanding-the-prometheus-rate-function/) - Rate vs increase explanation

### Tertiary (LOW confidence)
- [Community Forum - Row Panel JSON](https://community.grafana.com/t/json-model-of-row-panel/8778) - Row panel JSON structure quirks
- [LogQL Unique Values Discussion](https://github.com/grafana/loki/issues/3495) - Limitations of distinct count in Loki

## Metadata

**Confidence breakdown:**
- Dashboard JSON structure: HIGH - Official Grafana documentation, verified with real examples
- ConfigMap provisioning: HIGH - Well-documented pattern, widely used
- PromQL queries: HIGH - Standard patterns, tested against known metric structure
- Faro/Loki queries: MEDIUM - Depends on actual Alloy configuration and label mapping
- Row panel behavior: MEDIUM - Known quirks, some trial-and-error expected

**Research date:** 2026-01-28
**Valid until:** 2026-03-28 (60 days - dashboard JSON schema stable, Faro v2 recent)

---

*Phase: 10-grafana-dashboard*
*Research completed: 2026-01-28*
