import { useState, useCallback, useEffect } from 'react';
import { errorLogger, logUserAction } from '../lib/errorLogger';

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

  // Get network information
  const getNetworkInfo = useCallback((): NetworkStatus => {
    // Check if we're on the client side
    if (typeof window === 'undefined' || typeof navigator === 'undefined') {
      return {
        isOnline: true, // Default to online for SSR
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

    // Log network status changes
    if (wasOffline && isNowOnline) {
      logUserAction('network_restored', 'status_change', {
        networkType: newStatus.networkType,
        effectiveType: newStatus.effectiveType,
        timeSinceLastConnection: Date.now() - lastConnectedTime,
      });

      setConnectionAttempts(0);
      setLastConnectedTime(Date.now());

      // Process offline queue when back online
      processOfflineQueue();

    } else if (!wasOffline && !isNowOnline) {
      logUserAction('network_lost', 'status_change', {
        networkType: networkStatus.networkType,
        queueLength: offlineQueue.length,
      });
    }
  }, [networkStatus.isOnline, getNetworkInfo, offlineQueue.length, lastConnectedTime]);

  // Process offline queue
  const processOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0 || (typeof navigator !== 'undefined' && !navigator.onLine)) {
      return;
    }

    setOfflineQueue(prev => prev.filter(op => {
      // Process API operations
      if (op.type === 'api' && op.url && op.method) {
        fetch(op.url, {
          method: op.method,
          headers: {
            'Content-Type': 'application/json',
          },
          body: op.data ? JSON.stringify(op.data) : undefined,
        })
          .then(response => {
            if (!response.ok) {
              throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            logUserAction('offline_operation_synced', 'queue_processing', {
              operationId: op.id,
              type: op.type,
              url: op.url,
            });
          })
          .catch(error => {
            errorLogger.error('Failed to sync offline operation', error, 'NetworkStatus');

            // Re-queue for retry if max retries not reached
            if (op.retryCount < op.maxRetries) {
              setOfflineQueue(prev => [...prev, {
                ...op,
                retryCount: op.retryCount + 1,
              }]);
            } else {
              logUserAction('offline_operation_failed', 'queue_processing', {
                operationId: op.id,
                type: op.type,
                maxRetriesReached: true,
              });
            }
          });
      }

      return false; // Remove from queue
    }));
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
      type: offlineOp.type,
      queueLength: offlineQueue.length + 1,
    });

    return offlineOp.id;
  }, [offlineQueue.length]);

  // Retry failed operation
  const retryOperation = useCallback((operationId: string) => {
    setOfflineQueue(prev => prev.map(op => {
      if (op.id === operationId) {
        return {
          ...op,
          retryCount: op.retryCount + 1,
        };
      }
      return op;
    }));

    processOfflineQueue();
  }, [processOfflineQueue]);

  // Remove operation from queue
  const removeOperation = useCallback((operationId: string) => {
    setOfflineQueue(prev => prev.filter(op => op.id !== operationId));

    logUserAction('operation_removed_from_queue', 'offline_queue', {
      operationId,
      queueLength: offlineQueue.length - 1,
    });
  }, [offlineQueue.length]);

  // Clear offline queue
  const clearQueue = useCallback(() => {
    const queueLength = offlineQueue.length;
    setOfflineQueue([]);

    logUserAction('offline_queue_cleared', 'queue_management', {
      operationsRemoved: queueLength,
    });
  }, [offlineQueue.length]);

  // Test connection
  const testConnection = useCallback(async (): Promise<boolean> => {
    try {
      setConnectionAttempts(prev => prev + 1);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);

      const response = await fetch('/api/v1/health', {
        method: 'GET',
        signal: controller.signal,
        cache: 'no-cache',
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        setConnectionAttempts(0);
        return true;
      }

      return false;
    } catch (error) {
      errorLogger.error('Connection test failed', error, 'NetworkStatus');
      return false;
    }
  }, []);

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

  // Setup network listeners
  useEffect(() => {
    const handleOnline = () => {
      updateNetworkStatus();
    };

    const handleOffline = () => {
      updateNetworkStatus();
    };

    const handleConnectionChange = () => {
      updateNetworkStatus();
    };

    // Add event listeners
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Connection change listener
    const connection = (navigator as any).connection;
    if (connection) {
      connection.addEventListener('change', handleConnectionChange);
    }

    // Initial status update
    updateNetworkStatus();

    // Cleanup
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);

      if (connection) {
        connection.removeEventListener('change', handleConnectionChange);
      }
    };
  }, [updateNetworkStatus]);

  // Periodic connection test when offline
  useEffect(() => {
    const isOffline = typeof navigator !== 'undefined' && !navigator.onLine;
    if (isOffline && connectionAttempts < 5) {
      const interval = setInterval(() => {
        testConnection();
      }, 30000); // Test every 30 seconds

      return () => clearInterval(interval);
    }
  }, [connectionAttempts, testConnection]); // Removed navigator.onLine from dep array, handled inside effect or by event listeners update

  return {
    // Network status
    networkStatus,
    isOnline: networkStatus.isOnline,
    networkQuality: getNetworkQuality(),
    useOfflineMode: shouldUseOfflineMode(),

    // Offline queue
    offlineQueue,
    queueOfflineOperation,
    retryOperation,
    removeOperation,
    clearQueue,

    // Connection testing
    testConnection,
    connectionAttempts,

    // Utilities
    lastConnectedTime,
  };
}