import { apiFetch } from './api';

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

// In-memory queue for logs when offline
let logQueue: LogEntry[] = [];
const IS_DEV = process.env.NODE_ENV === 'development';

/**
 * Creates a standardized log entry
 */
const createLogEntry = (
  level: LogEntry['level'],
  message: string,
  data?: any,
  component?: string
): LogEntry => {
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
};

/**
 * Sends a log entry to the server or queues it if offline
 */
const sendToServer = async (entry: LogEntry) => {
  // Check online status safely
  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;

  if (!isOnline) {
    logQueue.push(entry);
    return;
  }

  try {
    // Use apiFetch for automatic CSRF and Auth handling
    await apiFetch('/api/v1/logs', {
      method: 'POST',
      body: JSON.stringify(entry),
    });
  } catch (error) {
    if (IS_DEV) console.error('[ErrorLogger] Failed to send log:', error);
    // Re-queue on failure
    logQueue.push(entry);
  }
};

/**
 * Flushes the queue of offline logs
 */
export const flushLogQueue = async () => {
  if (logQueue.length === 0) return;

  const isOnline = typeof navigator !== 'undefined' ? navigator.onLine : true;
  if (!isOnline) return;

  const entries = [...logQueue];
  logQueue = [];

  try {
    await apiFetch('/api/v1/logs/batch', {
      method: 'POST',
      body: JSON.stringify({ entries }),
    });
  } catch (error) {
    if (IS_DEV) console.error('[ErrorLogger] Failed to flush queue:', error);
    // Prepend failed entries back to queue
    logQueue = [...entries, ...logQueue];
  }
};

// --- Public API ---

export const logError = (message: string, data?: any, component?: string) => {
  if (IS_DEV) console.error(`[Error] ${message}`, data);
  sendToServer(createLogEntry('error', message, data, component));
};

export const logWarning = (message: string, data?: any, component?: string) => {
  if (IS_DEV) console.warn(`[Warn] ${message}`, data);
  sendToServer(createLogEntry('warning', message, data, component));
};

export const logInfo = (message: string, data?: any, component?: string) => {
  if (IS_DEV) console.info(`[Info] ${message}`, data);
  sendToServer(createLogEntry('info', message, data, component));
};

export const logDebug = (message: string, data?: any, component?: string) => {
  if (IS_DEV) console.debug(`[Debug] ${message}`, data);
  sendToServer(createLogEntry('debug', message, data, component));
};

export const logUserAction = (action: string, target: string, value?: any, context?: any) => {
  logInfo(`User Action: ${action}`, { target, value, ...context }, 'UserInteraction');
};

export const logSecurityEvent = (event: string, severity: 'low' | 'medium' | 'high' | 'critical', details: any) => {
  const level = (severity === 'critical' || severity === 'high') ? 'error' : 'warning';
  const logger = level === 'error' ? logError : logWarning;
  logger(`Security Event: ${event}`, { severity, ...details }, 'Security');
};

// Export object for backward compatibility if needed, but prefer named exports
export const errorLogger = {
  error: logError,
  warning: logWarning,
  info: logInfo,
  debug: logDebug,
  logApiError: (url: string, method: string, status: number, message: string, response?: any) => {
    logError(`API Error: ${message}`, { url, method, status, response, type: 'api_error' }, 'ApiClient');
  },
};