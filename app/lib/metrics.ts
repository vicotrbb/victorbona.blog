import { Registry, collectDefaultMetrics } from 'prom-client'

declare global {
  var metricsRegistry: Registry | undefined
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
