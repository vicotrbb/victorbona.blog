import Bowser from 'bowser'

// Normalize bowser's detailed browser names to simplified categories
// Major browsers get their own label; minor browsers grouped as "other"
const BROWSER_NORMALIZATION: Record<string, string> = {
  // Major browsers - keep distinct
  'chrome': 'chrome',
  'firefox': 'firefox',
  'safari': 'safari',
  'mobile safari': 'safari',
  'microsoft edge': 'edge',

  // Significant alternatives - keep distinct
  'opera': 'opera',
  'opera coast': 'opera',
  'samsung internet': 'samsung',
  'vivaldi': 'vivaldi',
  'brave': 'brave',

  // Chromium-based - group with parent
  'chromium': 'chrome',

  // Firefox-based - group with parent
  'librewolf': 'firefox',
  'pale moon': 'firefox',

  // Legacy
  'internet explorer': 'ie',
}

/**
 * Parse User-Agent string to extract browser family and device category.
 * Returns normalized values suitable for use as Prometheus metric labels.
 *
 * Browser values: chrome, firefox, safari, edge, opera, samsung, vivaldi, brave, ie, other, unknown
 * Device values: desktop, mobile, tablet, tv, unknown
 */
export function detectBrowserAndDevice(userAgent: string | null): {
  browser: string
  device: string
} {
  // Handle missing/empty User-Agent gracefully
  if (!userAgent || userAgent.trim() === '') {
    return { browser: 'unknown', device: 'unknown' }
  }

  try {
    const parser = Bowser.getParser(userAgent)

    // Extract and normalize browser name
    const rawBrowserName = parser.getBrowserName()
    let browser: string
    if (!rawBrowserName) {
      browser = 'unknown'
    } else {
      const normalizedName = rawBrowserName.toLowerCase()
      browser = BROWSER_NORMALIZATION[normalizedName] || 'other'
    }

    // Extract platform type
    // bowser returns: 'desktop', 'mobile', 'tablet', 'tv', or undefined
    const platformType = parser.getPlatformType()
    const device = platformType || 'unknown'

    return { browser, device }
  } catch {
    // Parsing failed (malformed UA string)
    return { browser: 'unknown', device: 'unknown' }
  }
}
