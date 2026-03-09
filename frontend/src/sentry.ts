import * as Sentry from '@sentry/react';

function isValidSentryDsn(dsn: string | undefined): boolean {
  if (!dsn || typeof dsn !== 'string') return false;
  const s = dsn.trim();
  // Skip placeholder or obviously invalid values
  if (!s || s.includes('your-sentry') || s === 'your-sentry-dsn-here') return false;
  return s.startsWith('https://') && s.includes('@');
}

export function initSentry() {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  if (!isValidSentryDsn(dsn)) {
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: false,
        blockAllMedia: false,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate: import.meta.env.PROD ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: import.meta.env.MODE,
  });
}