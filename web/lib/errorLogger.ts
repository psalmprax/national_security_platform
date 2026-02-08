// Types moved here to avoid circular dependency
export interface ErrorInfo {
  componentStack: string;
}

export interface LogEntry {
  timestamp: string;
  level: 'error' | 'warning' | 'info' | 'debug';
  message: string;
  data?: any;
  context?: {
    userId?: string;
    sessionId?: string;
    url?: string;
    userAgent?: string;
    component?: string;
  };
}

class ErrorLogger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private logQueue: LogEntry[] = [];
  private isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  private maxRetries = 3;
  private retryDelay = 5000;

  constructor() {
    // Monitor network status
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true;
        this.flushLogQueue();
      });

      window.addEventListener('offline', () => {
        this.isOnline = false;
      });

      // Flush queue on page unload
      window.addEventListener('beforeunload', () => {
        this.flushLogQueue();
      });
    }
  }

  private async sendToServer(entry: LogEntry): Promise<void> {
    if (!this.isOnline) {
      this.logQueue.push(entry);
      return;
    }

    try {
      const response = await fetch('/api/v1/logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      console.error('Failed to send log to server:', error);

      // Queue for retry if it's a network error
      if (this.isNetworkError(error)) {
        this.logQueue.push(entry);
      }
    }
  }

  private isNetworkError(error: any): boolean {
    return (
      error instanceof TypeError &&
      (error.message.includes('Failed to fetch') ||
        error.message.includes('NetworkError') ||
        error.message.includes('fetch'))
    );
  }

  private async flushLogQueue(): Promise<void> {
    if (this.logQueue.length === 0 || !this.isOnline) {
      return;
    }

    const entries = [...this.logQueue];
    this.logQueue = [];

    try {
      // Send batch of logs
      await fetch('/api/v1/logs/batch', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ entries }),
      });
    } catch (error) {
      console.error('Failed to flush log queue:', error);
      // Re-queue entries that failed to send
      this.logQueue.unshift(...entries);
    }
  }

  private createLogEntry(
    level: LogEntry['level'],
    message: string,
    data?: any,
    component?: string
  ): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      data,
      context: {
        userAgent: typeof window !== 'undefined' ? navigator.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location.href : 'server',
        component,
      }
    };
  }

  private getCurrentUserId(): string {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        return user.id || 'anonymous';
      }
      return 'anonymous';
    } catch {
      return 'anonymous';
    }
  }

  private getSessionId(): string {
    let sessionId = sessionStorage.getItem('sessionId');
    if (!sessionId) {
      sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('sessionId', sessionId);
    }
    return sessionId;
  }

  // Public logging methods
  error(message: string, data?: any, component?: string): void {
    const entry = this.createLogEntry('error', message, data, component);

    // Always log to console in development
    if (this.isDevelopment) {
      console.error(`[ErrorLogger] ${message}`, data);
    }

    this.sendToServer(entry);
  }

  warning(message: string, data?: any, component?: string): void {
    const entry = this.createLogEntry('warning', message, data, component);

    if (this.isDevelopment) {
      console.warn(`[ErrorLogger] ${message}`, data);
    }

    this.sendToServer(entry);
  }

  info(message: string, data?: any, component?: string): void {
    const entry = this.createLogEntry('info', message, data, component);

    if (this.isDevelopment) {
      console.info(`[ErrorLogger] ${message}`, data);
    }

    this.sendToServer(entry);
  }

  debug(message: string, data?: any, component?: string): void {
    if (this.isDevelopment) {
      const entry = this.createLogEntry('debug', message, data, component);
      console.debug(`[ErrorLogger] ${message}`, data);
      this.sendToServer(entry);
    }
  }

  // Specialized methods for different types of errors
  logReactError(error: Error, errorInfo: ErrorInfo): void {
    const errorData = {
      type: 'react_error_boundary',
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    };

    this.error('React Error Boundary caught an error', errorData, 'ErrorBoundary');
  }

  logApiError(
    url: string,
    method: string,
    status: number,
    message: string,
    response?: any
  ): void {
    const errorData = {
      type: 'api_error',
      url,
      method,
      status,
      response,
    };

    this.error(`API Error: ${message}`, errorData, 'ApiClient');
  }

  logPerformanceMetric(
    name: string,
    value: number,
    unit: 'ms' | 'bytes' | 'count' = 'ms',
    context?: any
  ): void {
    const performanceData = {
      type: 'performance_metric',
      name,
      value,
      unit,
      context,
    };

    this.info(`Performance: ${name} = ${value}${unit}`, performanceData, 'Performance');
  }

  logUserAction(
    action: string,
    target: string,
    value?: any,
    context?: any
  ): void {
    const actionData = {
      type: 'user_action',
      action,
      target,
      value,
      context,
    };

    this.info(`User action: ${action}`, actionData, 'UserInteraction');
  }

  logSecurityEvent(
    event: string,
    severity: 'low' | 'medium' | 'high' | 'critical',
    details: any
  ): void {
    const securityData = {
      type: 'security_event',
      event,
      severity,
      details,
    };

    const level = severity === 'critical' || severity === 'high' ? 'error' : 'warning';
    this[level](`Security: ${event}`, securityData, 'Security');
  }

  // Get log statistics
  getLogStats(): { queueSize: number; isOnline: boolean } {
    return {
      queueSize: this.logQueue.length,
      isOnline: this.isOnline,
    };
  }

  // Clear log queue
  clearQueue(): void {
    this.logQueue = [];
  }

  // Export logs for debugging
  exportLogs(): LogEntry[] {
    return [...this.logQueue];
  }
}

// Singleton instance
export const errorLogger = new ErrorLogger();

// Export the class for testing
export { ErrorLogger };

// Helper functions for common logging scenarios
export const logError = errorLogger.error.bind(errorLogger);
export const logWarning = errorLogger.warning.bind(errorLogger);
export const logInfo = errorLogger.info.bind(errorLogger);
export const logDebug = errorLogger.debug.bind(errorLogger);
export const logApiError = errorLogger.logApiError.bind(errorLogger);
export const logPerformanceMetric = errorLogger.logPerformanceMetric.bind(errorLogger);
export const logUserAction = errorLogger.logUserAction.bind(errorLogger);
export const logSecurityEvent = errorLogger.logSecurityEvent.bind(errorLogger);