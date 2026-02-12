import { useCallback, useState } from 'react';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { errorLogger } from '../lib/errorLogger';

export interface QueuedRequest {
  id: string;
  url: string;
  method: string;
  headers?: Record<string, string>;
  body?: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
  priority: 'low' | 'medium' | 'high' | 'critical';
  onSuccess?: (response: Response) => void;
  onError?: (error: Error) => void;
  timeout?: number;
}

export class OfflineQueue {
  private queue: QueuedRequest[] = [];
  private isProcessing = false;
  private storageKey = 'offlineQueue';

  constructor() {
    this.loadFromStorage();
    this.setupEventListeners();
  }

  // Load queue from localStorage
  private loadFromStorage(): void {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.queue = JSON.parse(stored);
        // Clean old requests (older than 24 hours)
        this.cleanOldRequests();
      }
    } catch (error) {
      errorLogger.error('Failed to load offline queue from storage', error, 'OfflineQueue');
    }
  }

  // Save queue to localStorage
  private saveToStorage(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.queue));
    } catch (error) {
      errorLogger.error('Failed to save offline queue to storage', error, 'OfflineQueue');
    }
  }

  // Clean old requests
  private cleanOldRequests(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours

    this.queue = this.queue.filter(request => {
      return now - request.timestamp < maxAge;
    });

    this.saveToStorage();
  }

  // Setup event listeners
  private setupEventListeners(): void {
    if (typeof window === 'undefined') return;

    window.addEventListener('online', () => {
      this.processQueue();
    });

    // Process queue periodically when online
    setInterval(() => {
      if (navigator.onLine && this.queue.length > 0) {
        this.processQueue();
      }
    }, 30000); // Every 30 seconds
  }

  // Add request to queue
  public add(request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>): string {
    const queuedRequest: QueuedRequest = {
      ...request,
      id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0,
    };

    // Insert based on priority
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    const insertIndex = this.queue.findIndex(
      r => priorityOrder[r.priority] > priorityOrder[queuedRequest.priority]
    );

    if (insertIndex === -1) {
      this.queue.push(queuedRequest);
    } else {
      this.queue.splice(insertIndex, 0, queuedRequest);
    }

    this.saveToStorage();
    
    errorLogger.info('Request queued for offline processing', {
      requestId: queuedRequest.id,
      url: queuedRequest.url,
      method: queuedRequest.method,
      priority: queuedRequest.priority,
      queueLength: this.queue.length,
    }, 'OfflineQueue');

    return queuedRequest.id;
  }

  // Process the queue
  public async processQueue(): Promise<void> {
    if (this.isProcessing || (typeof navigator !== 'undefined' && !navigator.onLine) || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;

    try {
      // Process up to 5 requests at a time
      const batch = this.queue.slice(0, 5);
      const promises = batch.map(request => this.processRequest(request));

      await Promise.allSettled(promises);

      // Remove processed requests
      this.queue = this.queue.filter(request => 
        request.retryCount >= request.maxRetries || request.maxRetries === 0
      );

      this.saveToStorage();
    } catch (error) {
      errorLogger.error('Error processing offline queue', error, 'OfflineQueue');
    } finally {
      this.isProcessing = false;
    }
  }

  // Process individual request
  private async processRequest(request: QueuedRequest): Promise<void> {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), request.timeout || 10000);

      const response = await fetch(request.url, {
        method: request.method,
        headers: request.headers,
        body: request.body ? JSON.stringify(request.body) : undefined,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (response.ok) {
        // Request succeeded, mark for removal
        request.maxRetries = 0;
        
        if (request.onSuccess) {
          request.onSuccess(response);
        }

        errorLogger.info('Offline request processed successfully', {
          requestId: request.id,
          url: request.url,
          status: response.status,
          retryCount: request.retryCount,
        }, 'OfflineQueue');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    } catch (error) {
      request.retryCount++;

      if (request.retryCount >= request.maxRetries) {
        // Max retries reached, mark for removal
        request.maxRetries = 0;

        if (request.onError) {
          request.onError(error instanceof Error ? error : new Error(String(error)));
        }

        errorLogger.error('Offline request failed after max retries', {
          requestId: request.id,
          url: request.url,
          method: request.method,
          retryCount: request.retryCount,
          maxRetries: request.maxRetries,
        }, 'OfflineQueue');
      } else {
        errorLogger.warning('Offline request failed, will retry', {
          requestId: request.id,
          url: request.url,
          method: request.method,
          retryCount: request.retryCount,
          maxRetries: request.maxRetries,
        }, 'OfflineQueue');
      }
    }
  }

  // Get queue information
  public getQueueInfo(): {
    length: number;
    byPriority: Record<string, number>;
    oldestRequest?: number;
  } {
    const byPriority = this.queue.reduce((acc, request) => {
      acc[request.priority] = (acc[request.priority] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const oldestRequest = this.queue.length > 0 
      ? Math.min(...this.queue.map(r => r.timestamp))
      : undefined;

    return {
      length: this.queue.length,
      byPriority,
      oldestRequest,
    };
  }

  // Remove specific request
  public remove(requestId: string): boolean {
    const initialLength = this.queue.length;
    this.queue = this.queue.filter(request => request.id !== requestId);
    
    if (this.queue.length < initialLength) {
      this.saveToStorage();
      return true;
    }

    return false;
  }

  // Clear queue
  public clear(): void {
    this.queue = [];
    this.saveToStorage();
    
    errorLogger.info('Offline queue cleared', {}, 'OfflineQueue');
  }

  // Retry specific request
  public retry(requestId: string): boolean {
    const request = this.queue.find(r => r.id === requestId);
    if (!request) {
      return false;
    }

    request.retryCount = 0;
    this.saveToStorage();

    // Process immediately if online
    if (typeof navigator === 'undefined' || navigator.onLine) {
      this.processRequest(request);
    }

    return true;
  }
}

// Singleton instance
export const offlineQueue = new OfflineQueue();

// Hook for using offline queue
export function useOfflineQueue() {
  const { isOnline, queueOfflineOperation } = useNetworkStatus();
  const [queueInfo, setQueueInfo] = useState(offlineQueue.getQueueInfo());

  // Add request to queue
  const addRequest = useCallback((
    request: Omit<QueuedRequest, 'id' | 'timestamp' | 'retryCount'>
  ) => {
    const requestId = offlineQueue.add(request);
    
    // Update queue info
    setQueueInfo(offlineQueue.getQueueInfo());
    
    // Also add to network status queue for UI
    queueOfflineOperation({
      type: 'api',
      url: request.url,
      method: request.method,
      data: request.body,
    });

    return requestId;
  }, [queueOfflineOperation]);

  // Process queue manually
  const processQueue = useCallback(() => {
    if (isOnline) {
      offlineQueue.processQueue();
      
      // Update queue info after processing
      setTimeout(() => {
        setQueueInfo(offlineQueue.getQueueInfo());
      }, 1000);
    }
  }, [isOnline]);

  // Remove request
  const removeRequest = useCallback((requestId: string) => {
    const removed = offlineQueue.remove(requestId);
    
    if (removed) {
      setQueueInfo(offlineQueue.getQueueInfo());
    }
    
    return removed;
  }, []);

  // Clear queue
  const clearQueue = useCallback(() => {
    offlineQueue.clear();
    setQueueInfo(offlineQueue.getQueueInfo());
  }, []);

  // Retry request
  const retryRequest = useCallback((requestId: string) => {
    const retried = offlineQueue.retry(requestId);
    
    if (retried) {
      // Update queue info after retry
      setTimeout(() => {
        setQueueInfo(offlineQueue.getQueueInfo());
      }, 1000);
    }
    
    return retried;
  }, []);

  // Update queue info periodically
  useState(() => {
    const interval = setInterval(() => {
      setQueueInfo(offlineQueue.getQueueInfo());
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  });

  return {
    queueInfo,
    addRequest,
    processQueue,
    removeRequest,
    clearQueue,
    retryRequest,
  };
}