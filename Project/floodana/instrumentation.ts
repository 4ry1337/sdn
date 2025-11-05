import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Performance Monitoring
  tracesSampleRate: 1.0,
  
  // Session Replay
  replaysOnErrorSampleRate: 1.0,
  replaysSessionSampleRate: 0.1,
  
  // Environment
  environment: process.env.NODE_ENV || 'development',
  
  // Only enable in production or when DSN is configured
  enabled: !!process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // Integrations
  integrations: [
    Sentry.replayIntegration({
      maskAllText: true,
      blockAllMedia: true,
    }),
  ],
  
  // Filter out network errors from localhost
  beforeSend(event, hint) {
    const error = hint.originalException;
    
    // Don't send errors in development unless explicitly enabled
    if (process.env.NODE_ENV === 'development' && !process.env.SENTRY_DEBUG) {
      return null;
    }
    
    // Filter out localhost connection errors
    if (error instanceof Error && error.message.includes('localhost')) {
      return null;
    }
    
    return event;
  },
});
