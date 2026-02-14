'use client';

import { faro, getWebInstrumentations, initializeFaro } from '@grafana/faro-web-sdk';

interface FaroInitProps {
  faroUrl?: string;
  appVersion?: string;
}

/**
 * FaroInit - Grafana Faro RUM initialization component
 *
 * Initializes client-side observability for:
 * - Core Web Vitals (LCP, CLS, INP)
 * - JavaScript error tracking
 * - Session tracking
 *
 * Props are passed from the Server Component (layout.tsx) which reads
 * runtime env vars (FARO_URL, APP_VERSION). This avoids the Next.js
 * NEXT_PUBLIC_* build-time inlining limitation.
 *
 * Guards (in order):
 * 1. SSR guard - only runs in browser
 * 2. Already initialized guard - prevents duplicate init during HMR
 * 3. DNT guard - respects Do Not Track browser setting
 * 4. Production guard - only initializes when faroUrl prop is provided
 */
export function FaroInit({ faroUrl, appVersion }: FaroInitProps) {
  if (typeof window === 'undefined') {
    return null;
  }

  if (faro.api) {
    return null;
  }

  if (navigator.doNotTrack === '1' || (window as any).doNotTrack === '1') {
    return null;
  }

  if (!faroUrl) {
    return null;
  }

  try {
    initializeFaro({
      url: faroUrl,
      app: {
        name: 'victorbona-blog',
        version: appVersion || '1.0.0',
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

  return null;
}
