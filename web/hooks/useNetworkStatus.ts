import { useState, useCallback, useEffect } from 'react';
import { logUserAction, logError } from '../lib/errorLogger';
import { apiFetch } from '../lib/api';

export interface NetworkStatus {
  isOnline: boolean;
  networkType: string;
  effectiveType: string;
  downlink: number;
  rtt: number;
  saveData: boolean;
}

export interface OfflineOperation {
  id: string;
  type: 'api' | 'upload' | 'form' | 'message';
  url?: string;
  method?: string;
  data?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<NetworkStatus>({
    isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
    networkType: 'unknown',
    effectiveType: 'unknown',
    downlink: 0,
    rtt: 0,
    saveData: false,
  });

  const [offlineQueue, setOfflineQueue] = useState<OfflineOperation[]>([]);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastConnectedTime, setLastConnectedTime] = useState<number>(Date.now());

  // Get network information safely
  const getNetworkInfo = useCallback((): NetworkStatus => {
    if (typeof navigator === 'undefined') {
      return {
        isOnline: true,
        networkType: 'unknown',
        effectiveType: 'unknown',
        downlink: 0,
        rtt: 0,
        saveData: false,
      };
    }

    const connection = (navigator as any).connection ||
      (navigator as any).mozConnection ||
      (navigator as any).webkitConnection;

    return {
      isOnline: navigator.onLine,
      networkType: connection?.type || 'unknown',
      effectiveType: connection?.effectiveType || 'unknown',
      downlink: connection?.downlink || 0,
      rtt: connection?.rtt || 0,
      saveData: connection?.saveData || false,
    };
  }, []);

  // Update network status
  const updateNetworkStatus = useCallback(() => {
    const newStatus = getNetworkInfo();
    const wasOffline = !networkStatus.isOnline;
    const isNowOnline = newStatus.isOnline;

    setNetworkStatus(newStatus);

    if (wasOffline && isNowOnline) {
      logUserAction('network_restored', 'status_change', {
        timeSinceLastConnection: Date.now() - lastConnectedTime,
      });

      setConnectionAttempts(0);
      setLastConnectedTime(Date.now());
      processOfflineQueue();

    } else if (!wasOffline && !isNowOnline) {
      logUserAction('network_lost', 'status_change', {
        queueLength: offlineQueue.length,
      });
    }
  }, [networkStatus.isOnline, getNetworkInfo, offlineQueue.length, lastConnectedTime]);

  // Process offline queue using secure apiFetch
  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0 || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return;
    }

    const remainingQueue: OfflineOperation[] = [];

    for (const op of offlineQueue) {
      if (op.type === 'api' && op.url && op.method) {
        try {
          // Use apiFetch wrapper for automatic auth/csrf handling
          const response = await apiFetch(op.url, {
            method: op.method,
            body: op.data ? JSON.stringify(op.data) : undefined,
          });

          if (!response.ok) throw new Error(`HTTP ${response.status}`);

          logUserAction('offline_operation_synced', 'queue_processing', { operationId: op.id });

        } catch (error) {
          logError(`Failed to sync offline operation ${op.id}`, error, 'NetworkStatus');

          if (op.retryCount < op.maxRetries) {
            remainingQueue.push({ ...op, retryCount: op.retryCount + 1 });
          } else {
            logUserAction('offline_operation_failed', 'queue_processing', {
              operationId: op.id,
              maxRetriesReached: true
            });
          }
        }
      }
    }

    setOfflineQueue(remainingQueue);
  }, [offlineQueue]);

  // Add operation to offline queue
  const queueOfflineOperation = useCallback((
    operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount' | 'maxRetries'>
  ) => {
    const offlineOp: OfflineOperation = {
      ...operation,
      id: `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
      maxRetries: 3,
    };

    setOfflineQueue(prev => [...prev, offlineOp]);

    logUserAction('operation_queued_offline', 'offline_queue', {
      operationId: offlineOp.id,
      queueLength: offlineQueue.length + 1,
    });

    return offlineOp.id;
  }, [offlineQueue.length]);

  // Periodic connection test
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setConnectionAttempts(prev => prev + 1);
      // Use apiFetch for health check
      const response = await apiFetch('/api/v1/health');
      if (response.ok) {
        setConnectionAttempts(0);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, []);

  // Setup listeners safely
  useEffect(() => {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    // Initial check
    updateNetworkStatus();

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      if (connection) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, [updateNetworkStatus]);

  // Periodic offline check
  useEffect(() => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline && connectionAttempts < 5) {
      const interval = setInterval(testConnection, 30000);
      return () => clearInterval(interval);
    }
  }, [connectionAttempts, testConnection]);

  // Get network quality
  const getNetworkQuality = useCallback((): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (!networkStatus.isOnline) return 'poor';

    const { effectiveType, downlink, rtt } = networkStatus;

    if (effectiveType === '4g' && downlink > 5 && rtt < 100) return 'excellent';
    if (effectiveType === '4g' || (downlink > 2 && rtt < 200)) return 'good';
    if (effectiveType === '3g' || (downlink > 0.5 && rtt < 500)) return 'fair';
    return 'poor';
  }, [networkStatus]);

  // Check if should use offline mode
  const shouldUseOfflineMode = useCallback((): boolean => {
    if (typeof navigator === 'undefined') return false;
    return !navigator.onLine || getNetworkQuality() === 'poor';
  }, [getNetworkQuality]);

  return {
    networkStatus,
    isOnline: networkStatus.isOnline,
    networkQuality: getNetworkQuality(),
    useOfflineMode: shouldUseOfflineMode(),
    offlineQueue,
    queueOfflineOperation,
    testConnection,
    connectionAttempts,
  };
}