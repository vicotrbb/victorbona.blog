const UTM_MAX_LENGTH = 50
const UTM_ALLOWED_PATTERN = /^[a-z0-9_-]*$/

function validateUtmValue(value: string | null): string {
  if (!value) return ''

  // Normalize to lowercase
  const normalized = value.toLowerCase()

  // Check length
  if (normalized.length > UTM_MAX_LENGTH) return ''

  // Check allowed characters (alphanumeric, underscores, hyphens only)
  if (!UTM_ALLOWED_PATTERN.test(normalized)) return ''

  return normalized
}

export function extractUtmParams(searchParams: URLSearchParams): {
  utmSource: string
  utmMedium: string
} {
  return {
    utmSource: validateUtmValue(searchParams.get('utm_source')),
    utmMedium: validateUtmValue(searchParams.get('utm_medium')),
  }
}
