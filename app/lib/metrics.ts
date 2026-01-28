import { Registry, collectDefaultMetrics, Counter, Histogram } from 'prom-client'

declare global {
  var metricsRegistry: Registry | undefined
  var pageViewsCounter: Counter | undefined
  var httpRequestsCounter: Counter | undefined
  var pageDurationHistogram: Histogram | undefined
}

function initializeMetrics(): Registry {
  const registry = new Registry()

  // Set default labels for all metrics
  registry.setDefaultLabels({
    app: 'victorbona-blog',
  })

  // Collect default Node.js metrics:
  // - process_cpu_user_seconds_total
  // - process_cpu_system_seconds_total
  // - process_start_time_seconds
  // - process_resident_memory_bytes
  // - nodejs_eventloop_lag_seconds
  // - nodejs_eventloop_lag_min_seconds
  // - nodejs_eventloop_lag_max_seconds
  // - nodejs_eventloop_lag_mean_seconds
  // - nodejs_eventloop_lag_stddev_seconds
  // - nodejs_eventloop_lag_p50_seconds
  // - nodejs_eventloop_lag_p90_seconds
  // - nodejs_eventloop_lag_p99_seconds
  // - nodejs_active_handles_total
  // - nodejs_active_requests_total
  // - nodejs_heap_size_total_bytes
  // - nodejs_heap_size_used_bytes
  // - nodejs_external_memory_bytes
  // - nodejs_gc_duration_seconds (histogram)
  // - nodejs_version_info
  collectDefaultMetrics({
    register: registry,
  })

  return registry
}

// Singleton pattern for HMR resilience
// In development, globalThis persists across HMR cycles
// In production, module caching handles singleton naturally
export const metricsRegistry =
  global.metricsRegistry ?? initializeMetrics()

if (process.env.NODE_ENV !== 'production') {
  global.metricsRegistry = metricsRegistry
}

// Page views counter
const pageViewsLabelNames = [
  'path',
  'method',
  'is_bot',
  'content_type',
  'source',      // Referrer source (google, twitter, direct, etc.)
  'utm_source',  // UTM campaign source
  'utm_medium',  // UTM campaign medium
  'browser',     // Browser family (chrome, firefox, safari, edge, opera, samsung, other, unknown)
  'device',      // Device category (desktop, mobile, tablet, tv, unknown)
] as const

function initializePageViewsCounter(): Counter {
  return new Counter({
    name: 'blog_page_views_total',
    help: 'Total page views by path, method, bot status, content type, source, UTM parameters, browser, and device',
    labelNames: pageViewsLabelNames,
    registers: [metricsRegistry],
  })
}

export const pageViewsCounter =
  global.pageViewsCounter ?? initializePageViewsCounter()

if (process.env.NODE_ENV !== 'production') {
  global.pageViewsCounter = pageViewsCounter
}

// HTTP requests counter (for tracking status codes including 404s)
const httpRequestsLabelNames = ['path', 'method', 'status_code', 'content_type'] as const

function initializeHttpRequestsCounter(): Counter {
  return new Counter({
    name: 'blog_http_requests_total',
    help: 'Total HTTP requests by path, method, status code, and content type',
    labelNames: httpRequestsLabelNames,
    registers: [metricsRegistry],
  })
}

export const httpRequestsCounter =
  global.httpRequestsCounter ?? initializeHttpRequestsCounter()

if (process.env.NODE_ENV !== 'production') {
  global.httpRequestsCounter = httpRequestsCounter
}

// Page duration histogram
const pageDurationLabelNames = ['path', 'method', 'content_type'] as const

function initializePageDurationHistogram(): Histogram {
  return new Histogram({
    name: 'blog_page_duration_seconds',
    help: 'Page request duration in seconds',
    labelNames: pageDurationLabelNames,
    buckets: [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
    registers: [metricsRegistry],
  })
}

export const pageDurationHistogram =
  global.pageDurationHistogram ?? initializePageDurationHistogram()

if (process.env.NODE_ENV !== 'production') {
  global.pageDurationHistogram = pageDurationHistogram
}
