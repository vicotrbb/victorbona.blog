import { headers } from 'next/headers'
import { pageViewsCounter, pageDurationHistogram } from '../lib/metrics'

/**
 * Server component that records page view metrics.
 * Reads metrics metadata from headers set by middleware.
 * Must be rendered as part of the server-side rendering to count views.
 */
export function PageViewTracker() {
  const headersList = headers()

  // Read metrics metadata from middleware
  const path = headersList.get('x-metrics-path')
  const method = headersList.get('x-metrics-method')
  const contentType = headersList.get('x-metrics-content-type')
  const isBot = headersList.get('x-metrics-is-bot')
  const startTimeStr = headersList.get('x-metrics-start-time')

  // Only record if all required headers are present (means middleware ran)
  if (path && method && contentType && isBot) {
    // Increment page view counter
    pageViewsCounter.inc({
      path,
      method,
      is_bot: isBot,
      content_type: contentType,
    })

    // Record duration if start time is available
    if (startTimeStr) {
      const startTime = parseInt(startTimeStr, 10)
      const durationSeconds = (Date.now() - startTime) / 1000
      pageDurationHistogram.observe(
        {
          path,
          method,
          content_type: contentType,
        },
        durationSeconds
      )
    }
  }

  // This component renders nothing - it's just for side effects
  return null
}
