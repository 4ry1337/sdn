import * as Sentry from '@sentry/nextjs';

export type LogLevel = 'error' | 'warning' | 'info' | 'debug';

interface LogContext {
  component?: string;
  action?: string;
  endpoint?: string;
  duration?: number;
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  error(message: string, context?: LogContext, error?: Error) {
    if (this.isDevelopment) {
      console.error(`[ERROR] ${message}`, context || '', error || '');
    }
    
    Sentry.captureException(error || new Error(message), {
      level: 'error',
      contexts: {
        application: context || {},
      },
      tags: {
        component: context?.component,
      },
    });
  }

  warn(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.warn(`[WARN] ${message}`, context || '');
    }
    
    Sentry.captureMessage(message, {
      level: 'warning',
      contexts: {
        application: context || {},
      },
      tags: {
        component: context?.component,
      },
    });
  }

  info(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.info(`[INFO] ${message}`, context || '');
    }
    
    // Info messages are only sent to Sentry as breadcrumbs
    Sentry.addBreadcrumb({
      message,
      level: 'info',
      data: context,
    });
  }

  debug(message: string, context?: LogContext) {
    if (this.isDevelopment) {
      console.debug(`[DEBUG] ${message}`, context || '');
    }
    
    Sentry.addBreadcrumb({
      message,
      level: 'debug',
      data: context,
    });
  }

  // Helper for API request logging
  logApiRequest(endpoint: string, duration: number, success: boolean) {
    const context = {
      component: 'floodlight-client',
      endpoint,
      duration,
      success,
    };

    if (success) {
      this.info(`API request successful`, context);
    } else {
      this.warn(`API request failed`, context);
    }
  }

  // Helper for topology changes
  logTopologyChange(changeType: string, details: Record<string, unknown>) {
    this.info(`Topology changed: ${changeType}`, {
      component: 'topology-viewer',
      action: 'topology-change',
      ...details,
    });
  }

  // Helper for user actions
  logUserAction(action: string, details?: Record<string, unknown>) {
    this.info(`User action: ${action}`, {
      component: 'user-action',
      action,
      ...details,
    });
  }
}

export const logger = new Logger();
