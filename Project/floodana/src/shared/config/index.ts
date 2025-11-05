export const config = {
  floodlight: {
    baseUrl: process.env.NEXT_PUBLIC_FLOODLIGHT_URL || 'http://localhost:8080',
    timeout: 5000,
    retryAttempts: 3,
    retryDelay: 1000,
  },
  polling: {
    topologyInterval: 5000,
    metricsInterval: 3000,
  },
  thresholds: {
    utilization: {
      warning: 75,
      critical: 90,
    },
  },
} as const;
