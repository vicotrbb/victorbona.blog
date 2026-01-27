import { metricsRegistry } from '../lib/metrics'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const metrics = await metricsRegistry.metrics()

    return new Response(metrics, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Metrics collection failed:', error)
    return new Response('Service Unavailable', {
      status: 503,
      headers: {
        'Content-Type': 'text/plain',
      },
    })
  }
}
