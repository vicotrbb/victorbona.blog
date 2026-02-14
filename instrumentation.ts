export async function register() {
  // Only run OTEL setup in Node.js runtime — Edge runtime has no
  // support for @opentelemetry/sdk-trace-node and its dependencies
  // reference `navigator` which crashes the edge bundle.
  if (process.env.NEXT_RUNTIME !== 'nodejs') {
    return
  }

  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  if (!endpoint) {
    console.log('OTEL_EXPORTER_OTLP_ENDPOINT not set, skipping tracing')
    return
  }

  // Dynamic imports — only loaded in Node.js runtime, never bundled into edge
  const { registerOTel } = await import('@vercel/otel')
  const { TraceIdRatioBasedSampler, ParentBasedSampler } = await import(
    '@opentelemetry/sdk-trace-node'
  )
  const { OTLPTraceExporter } = await import(
    '@opentelemetry/exporter-trace-otlp-http'
  )

  registerOTel({
    serviceName: process.env.OTEL_SERVICE_NAME || 'victorbona-blog',
    attributes: {
      'service.version': process.env.OTEL_SERVICE_VERSION || 'unknown',
    },
    traceExporter: new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
    }),
    traceSampler: new ParentBasedSampler({
      root: new TraceIdRatioBasedSampler(
        parseFloat(process.env.OTEL_TRACES_SAMPLER_ARG || '0.1')
      ),
    }),
  })
}
