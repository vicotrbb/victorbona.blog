import { headers } from 'next/headers'
import { httpRequestsCounter } from './lib/metrics'

/**
 * Derive content type from path pattern
 */
function getContentType(path: string): string {
  if (path.startsWith('/blog')) return 'blog'
  if (path.startsWith('/articles')) return 'article'
  if (path.startsWith('/projects')) return 'project'
  if (path.startsWith('/api')) return 'api'
  return 'page'
}

export default function NotFound() {
  // Read the actual path from middleware headers
  const headersList = headers()
  const path = headersList.get('x-url') || headersList.get('x-metrics-path') || '/not_found'
  const contentType = getContentType(path)

  // Increment the HTTP requests counter with 404 status
  httpRequestsCounter.inc({
    path,
    method: 'GET',
    status_code: '404',
    content_type: contentType,
  })

  return (
    <section>
      <h1 className="mb-8 text-2xl font-semibold tracking-tighter">
        404 - Page Not Found
      </h1>
      <p className="mb-4">The page you are looking for does not exist.</p>
    </section>
  );
}
