"use client";

import Script from "next/script";

const SENTRY_DSN = process.env.NEXT_PUBLIC_SENTRY_DSN;
const SENTRY_SDK_URL = "https://browser.sentry-cdn.com/8.55.0/bundle.min.js";

declare global {
  interface Window {
    Sentry?: {
      init: (options: Record<string, unknown>) => void;
      captureException: (e: unknown, ctx?: Record<string, unknown>) => void;
      captureMessage: (m: string, ctx?: Record<string, unknown>) => void;
    };
  }
}

/**
 * Loads the Sentry browser SDK from CDN when NEXT_PUBLIC_SENTRY_DSN is set.
 * Zero-cost no-op without a DSN, so beta builds work before the Sentry
 * project exists. Crashes also flow to our own client_errors table via
 * reportClientError — Sentry adds grouping, alerting, and release tracking.
 */
export function SentryLoader() {
  if (!SENTRY_DSN) return null;

  return (
    <Script
      src={SENTRY_SDK_URL}
      strategy="afterInteractive"
      crossOrigin="anonymous"
      onLoad={() => {
        window.Sentry?.init({
          dsn: SENTRY_DSN,
          environment: process.env.NODE_ENV,
          // Keep noise down for a small beta.
          sampleRate: 1.0,
          ignoreErrors: ["ResizeObserver loop", "Load failed", "NetworkError"],
        });
      }}
    />
  );
}
