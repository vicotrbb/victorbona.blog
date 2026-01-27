'use client';

import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';

/**
 * FaroInit - Grafana Faro RUM initialization component
 *
 * Initializes client-side observability for:
 * - Core Web Vitals (LCP, CLS, INP)
 * - JavaScript error tracking
 * - Session tracking
 *
 * Guards (in order):
 * 1. SSR guard - only runs in browser
 * 2. Already initialized guard - prevents duplicate init during HMR
 * 3. DNT guard - respects Do Not Track browser setting
 * 4. Production guard - only initializes when NEXT_PUBLIC_FARO_URL is set
 */
export function FaroInit() {
  // SSR guard: only run in browser
  if (typeof window === 'undefined') {
    return null;
  }

  // Already initialized guard: prevent duplicate initialization during HMR
  if (faro.api) {
    return null;
  }

  // DNT guard: respect Do Not Track browser setting
  if (navigator.doNotTrack === '1' || (window as any).doNotTrack === '1') {
    return null;
  }

  // Production guard: only initialize when Faro URL is configured
  const faroUrl = process.env.NEXT_PUBLIC_FARO_URL;
  if (!faroUrl) {
    return null;
  }

  try {
    initializeFaro({
      url: faroUrl,
      app: {
        name: 'victorbona-blog',
        version: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
        environment: process.env.NODE_ENV,
      },
      instrumentations: [...getWebInstrumentations()],
      sessionTracking: {
        enabled: true,
        persistent: true,
      },
    });
  } catch (error) {
    console.warn('Faro initialization failed:', error);
  }

  // Component renders nothing - it only performs initialization
  return null;
}
