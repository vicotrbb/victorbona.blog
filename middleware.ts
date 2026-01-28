import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { isbot } from 'isbot'
import { detectSource } from './app/lib/source-detection'
import { extractUtmParams } from './app/lib/utm-parser'

// Static asset extensions to exclude from tracking
const STATIC_EXTENSIONS = [
  '.js',
  '.css',
  '.ico',
  '.png',
  '.jpg',
  '.jpeg',
  '.gif',
  '.svg',
  '.woff',
  '.woff2',
  '.ttf',
  '.eot',
]

// Paths to exclude from page view tracking
const EXCLUDED_PATH_PREFIXES = [
  '/_next',
  '/api',
  '/metrics',
  '/health',
]

/**
 * Check if path should be excluded from tracking
 */
function shouldExclude(pathname: string): boolean {
  // Check excluded path prefixes
  for (const prefix of EXCLUDED_PATH_PREFIXES) {
    if (pathname.startsWith(prefix)) {
      return true
    }
  }

  // Check static file extensions
  const lowercasePath = pathname.toLowerCase()
  for (const ext of STATIC_EXTENSIONS) {
    if (lowercasePath.endsWith(ext)) {
      return true
    }
  }

  return false
}

/**
 * Normalize path: lowercase, remove trailing slash (except root)
 */
function normalizePath(pathname: string): string {
  let normalized = pathname.toLowerCase()

  // Remove trailing slash (but keep root '/')
  if (normalized.length > 1 && normalized.endsWith('/')) {
    normalized = normalized.slice(0, -1)
  }

  return normalized
}

/**
 * Derive content type from path pattern
 */
function getContentType(path: string): string {
  if (path.startsWith('/blog')) return 'blog'
  if (path.startsWith('/articles')) return 'article'
  if (path.startsWith('/projects')) return 'project'
  if (path.startsWith('/api')) return 'api'
  return 'page' // homepage, about, contact, etc.
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Skip excluded paths - no metrics headers needed
  if (shouldExclude(pathname)) {
    return NextResponse.next()
  }

  // Record start time for duration calculation
  const startTime = Date.now()

  // Get normalized path
  const normalizedPath = normalizePath(pathname)

  // Derive content type
  const contentType = getContentType(normalizedPath)

  // Detect bot from User-Agent
  const userAgent = request.headers.get('user-agent') || ''
  const isBotRequest = isbot(userAgent)

  // Extract referrer source
  const referer = request.headers.get('referer')
  const source = detectSource(referer)

  // Extract UTM parameters from URL
  const { utmSource, utmMedium } = extractUtmParams(request.nextUrl.searchParams)

  // Create response with request headers that contain metrics metadata
  // These headers can be read by server-side code (layout.tsx or API routes)
  // to record metrics using prom-client which requires Node.js runtime
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-metrics-path', normalizedPath)
  requestHeaders.set('x-metrics-method', method)
  requestHeaders.set('x-metrics-content-type', contentType)
  requestHeaders.set('x-metrics-is-bot', isBotRequest ? 'true' : 'false')
  requestHeaders.set('x-metrics-start-time', startTime.toString())
  requestHeaders.set('x-url', pathname)
  requestHeaders.set('x-metrics-source', source)
  requestHeaders.set('x-metrics-utm-source', utmSource)
  requestHeaders.set('x-metrics-utm-medium', utmMedium)

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
