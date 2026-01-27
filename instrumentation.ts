import { registerOTel } from '@vercel/otel'
import {
  TraceIdRatioBasedSampler,
  ParentBasedSampler,
} from '@opentelemetry/sdk-trace-node'
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http'

export function register() {
  // Only initialize OTEL when there's an endpoint configured
  const endpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT
  if (!endpoint) {
    console.log('OTEL_EXPORTER_OTLP_ENDPOINT not set, skipping tracing')
    return
  }

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
