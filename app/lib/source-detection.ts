const OWN_DOMAINS = ['blog.victorbona.dev', 'victorbona.dev']

const SEARCH_ENGINE_DOMAINS: Record<string, string> = {
  'google.com': 'google',
  'www.google.com': 'google',
  'google.co.uk': 'google',
  'google.ca': 'google',
  'google.de': 'google',
  'google.fr': 'google',
  'google.com.au': 'google',
  'google.co.jp': 'google',
  'google.com.br': 'google',
  'bing.com': 'bing',
  'www.bing.com': 'bing',
  'm.bing.com': 'bing',
  'duckduckgo.com': 'duckduckgo',
  'search.yahoo.com': 'yahoo',
  'yahoo.com': 'yahoo',
  'baidu.com': 'baidu',
  'www.baidu.com': 'baidu',
  'm.baidu.com': 'baidu',
  'yandex.com': 'yandex',
  'yandex.ru': 'yandex',
  'ecosia.org': 'ecosia',
  'www.ecosia.org': 'ecosia',
  'search.brave.com': 'brave',
  'startpage.com': 'startpage',
  'www.startpage.com': 'startpage',
}

const SOCIAL_DOMAINS: Record<string, string> = {
  'twitter.com': 'twitter',
  'www.twitter.com': 'twitter',
  'mobile.twitter.com': 'twitter',
  'x.com': 'twitter',
  't.co': 'twitter',
  'facebook.com': 'facebook',
  'www.facebook.com': 'facebook',
  'm.facebook.com': 'facebook',
  'l.facebook.com': 'facebook',
  'lm.facebook.com': 'facebook',
  'linkedin.com': 'linkedin',
  'www.linkedin.com': 'linkedin',
  'lnkd.in': 'linkedin',
  'reddit.com': 'reddit',
  'www.reddit.com': 'reddit',
  'old.reddit.com': 'reddit',
  'instagram.com': 'instagram',
  'www.instagram.com': 'instagram',
  'l.instagram.com': 'instagram',
  'youtube.com': 'youtube',
  'www.youtube.com': 'youtube',
  'm.youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'pinterest.com': 'pinterest',
  'www.pinterest.com': 'pinterest',
  'tiktok.com': 'tiktok',
  'www.tiktok.com': 'tiktok',
  'news.ycombinator.com': 'hackernews',
  'mastodon.social': 'mastodon',
  'threads.net': 'threads',
  'www.threads.net': 'threads',
}

export function detectSource(referer: string | null): string {
  // No referer = direct traffic
  if (!referer) {
    return 'direct'
  }

  // Parse the referer URL
  let hostname: string
  try {
    const url = new URL(referer)
    hostname = url.hostname.toLowerCase()
  } catch {
    // Invalid URL = treat as direct
    return 'direct'
  }

  // Self-referral = direct
  if (OWN_DOMAINS.some(domain => hostname === domain || hostname.endsWith('.' + domain))) {
    return 'direct'
  }

  // Check search engines
  const searchSource = SEARCH_ENGINE_DOMAINS[hostname]
  if (searchSource) {
    return searchSource
  }

  // Check social platforms
  const socialSource = SOCIAL_DOMAINS[hostname]
  if (socialSource) {
    return socialSource
  }

  // Unknown referrer = return the hostname as-is (referral traffic)
  return hostname
}
