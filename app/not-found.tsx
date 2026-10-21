import { headers } from 'next/headers'
import type { Metadata } from 'next'
import { httpRequestsCounter } from './lib/metrics'
import { ContactCommand } from './components/ContactCommand'

export const metadata: Metadata = {
  title: '404',
  robots: { index: false },
}

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

export default async function NotFound() {
  // Read the actual path from middleware headers
  const headersList = await headers()
  const path = headersList.get('x-url') || headersList.get('x-metrics-path') || '/not_found'
  const contentType = getContentType(path)

  // Increment the HTTP requests counter with 404 status
  httpRequestsCounter.inc({
    path,
    method: 'GET',
    status_code: '404',
    content_type: contentType,
  })

  const hint = 'ml-3 text-[var(--dim)]'
  const command =
    'text-[var(--text)] underline-offset-4 decoration-1 hover:underline'

  return (
    <section className="font-mono">
      <h1 className="[overflow-wrap:anywhere] text-base font-normal leading-relaxed text-[var(--text)] sm:text-lg">
        <span className="text-[var(--warn)]">panic:</span> route not found: {path}
      </h1>
      <ol className="mt-8 space-y-3 border-l border-[var(--line)] pl-5 text-sm">
        <li>
          <a href="/" className={command}>
            <span aria-hidden="true">$ </span>cd /
          </a>
          <span className={hint}># home</span>
        </li>
        <li>
          <a href="/blog" className={command}>
            <span aria-hidden="true">$ </span>cd /blog
          </a>
          <span className={hint}># writing</span>
        </li>
        <li className="text-[var(--dim)]">
          <kbd className="text-[var(--text)]">:</kbd> opens the terminal
        </li>
      </ol>
      <p className="mt-10 text-sm">
        <ContactCommand variant="inline" />
      </p>
    </section>
  )
}
