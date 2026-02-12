import { useState, useCallback, useRef, useEffect } from 'react';
import { errorLogger } from '../lib/errorLogger';

interface LoadingState {
  isLoading: boolean;
  progress: number;
  message?: string;
  startTime?: number;
  operation?: string;
}

interface UseLoadingOptions {
  initialMessage?: string;
  showProgress?: boolean;
  timeout?: number;
  onTimeout?: () => void;
  onSuccess?: (result?: any) => void;
  onError?: (error: Error) => void;
}

export function useLoading(options: UseLoadingOptions = {}) {
  const {
    initialMessage,
    showProgress = false,
    timeout = 30000, // 30 seconds default
    onTimeout,
    onSuccess,
    onError,
  } = options;

  const [loadingState, setLoadingState] = useState<LoadingState>({
    isLoading: false,
    progress: 0,
    message: initialMessage,
  });

  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const progressIntervalRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const operationRef = useRef<string | undefined>(undefined);

  // Clear all timers
  const clearTimers = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = undefined;
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = undefined;
    }
  }, []);

  // Set loading state
  const setLoading = useCallback((
    isLoading: boolean,
    message?: string,
    operation?: string,
    progress?: number
  ) => {
    setLoadingState(prev => ({
      ...prev,
      isLoading,
      message: message || prev.message,
      operation: operation || prev.operation,
      progress: progress !== undefined ? progress : prev.progress,
      startTime: isLoading ? Date.now() : prev.startTime,
    }));

    // Clear timers when loading stops
    if (!isLoading) {
      clearTimers();
      operationRef.current = undefined;
    } else if (operation) {
      operationRef.current = operation;
    }
  }, [clearTimers]);

  // Start loading with timeout
  const startLoading = useCallback((
    message?: string,
    operation?: string,
    customTimeout?: number
  ) => {
    const timeoutDuration = customTimeout || timeout;

    setLoading(true, message, operation);

    // Set timeout if specified
    if (timeoutDuration > 0) {
      timeoutRef.current = setTimeout(() => {
        errorLogger.warning(
          `Loading timeout: ${operation || 'unknown operation'}`,
          { timeout: timeoutDuration },
          'useLoading'
        );
        
        setLoading(false);
        onTimeout?.();
      }, timeoutDuration);
    }
  }, [setLoading, timeout, onTimeout]);

  // Stop loading
  const stopLoading = useCallback((result?: any) => {
    clearTimers();
    setLoading(false);
    onSuccess?.(result);
  }, [clearTimers, setLoading, onSuccess]);

  // Handle loading error
  const setLoadingError = useCallback((error: Error) => {
    clearTimers();
    setLoading(false);
    onError?.(error);
    
    errorLogger.error(
      `Loading error: ${error.message}`,
      { operation: operationRef.current },
      'useLoading'
    );
  }, [clearTimers, setLoading, onError]);

  // Update progress
  const updateProgress = useCallback((progress: number, message?: string) => {
    setLoadingState(prev => ({
      ...prev,
      progress: Math.max(0, Math.min(100, progress)),
      message: message || prev.message,
    }));
  }, []);

  // Simulate progress for long operations
  const simulateProgress = useCallback((
    duration: number,
    steps: number = 10,
    message?: string
  ) => {
    let currentStep = 0;
    const stepProgress = 100 / steps;

    progressIntervalRef.current = setInterval(() => {
      currentStep++;
      const progress = Math.min(100, currentStep * stepProgress);
      
      updateProgress(progress, message);

      if (currentStep >= steps) {
        clearInterval(progressIntervalRef.current);
        progressIntervalRef.current = undefined;
      }
    }, duration / steps);
  }, [updateProgress]);

  // Wrap async operation with loading state
  const withLoading = useCallback(async <T,>(
    operation: () => Promise<T>,
    options?: {
      message?: string;
      operationName?: string;
      timeout?: number;
      simulateProgress?: boolean;
      progressDuration?: number;
    }
  ): Promise<T | null> => {
    const {
      message,
      operationName,
      timeout: customTimeout,
      simulateProgress: shouldSimulate = false,
      progressDuration = 5000,
    } = options || {};

    try {
      startLoading(message, operationName, customTimeout);

      if (shouldSimulate) {
        simulateProgress(progressDuration, 20, message);
      }

      const result = await operation();
      stopLoading(result);
      return result;
    } catch (error) {
      setLoadingError(error instanceof Error ? error : new Error(String(error)));
      return null;
    }
  }, [startLoading, simulateProgress, stopLoading, setLoadingError]);

  // Cleanup on unmount
  useEffect(() => {
    return clearTimers;
  }, [clearTimers]);

  return {
    // State
    isLoading: loadingState.isLoading,
    progress: loadingState.progress,
    message: loadingState.message,
    operation: loadingState.operation,
    startTime: loadingState.startTime,
    duration: loadingState.startTime ? Date.now() - loadingState.startTime : 0,
    
    // Actions
    setLoading,
    startLoading,
    stopLoading,
    setLoadingError,
    updateProgress,
    simulateProgress,
    withLoading,
    
    // Utilities
    clearTimers,
  };
}

// Hook for managing multiple loading states
export function useMultipleLoading() {
  const [loadingStates, setLoadingStates] = useState<Record<string, LoadingState>>({});

  const setLoading = useCallback((
    key: string,
    isLoading: boolean,
    message?: string,
    progress?: number
  ) => {
    setLoadingStates(prev => ({
      ...prev,
      [key]: {
        isLoading,
        progress: progress !== undefined ? progress : prev[key]?.progress || 0,
        message: message || prev[key]?.message,
        startTime: isLoading ? Date.now() : prev[key]?.startTime,
      },
    }));
  }, []);

  const isLoading = useCallback((key?: string) => {
    if (key) {
      return loadingStates[key]?.isLoading || false;
    }
    return Object.values(loadingStates).some(state => state.isLoading);
  }, [loadingStates]);

  const getProgress = useCallback((key: string) => {
    return loadingStates[key]?.progress || 0;
  }, [loadingStates]);

  const getOverallProgress = useCallback(() => {
    const states = Object.values(loadingStates);
    if (states.length === 0) return 0;
    
    const totalProgress = states.reduce((sum, state) => sum + state.progress, 0);
    return totalProgress / states.length;
  }, [loadingStates]);

  const clearAll = useCallback(() => {
    setLoadingStates({});
  }, []);

  return {
    loadingStates,
    setLoading,
    isLoading,
    getProgress,
    getOverallProgress,
    clearAll,
  };
}

// Hook for loading states with retry logic
export function useLoadingWithRetry(options: UseLoadingOptions & { maxRetries?: number } = {}) {
  const { maxRetries = 3, ...loadingOptions } = options;
  const { withLoading, ...loadingState } = useLoading(loadingOptions);
  const retryCount = useRef(0);

  const withRetry = useCallback(async <T,>(
    operation: () => Promise<T>,
    retryOptions?: {
      message?: string;
      operationName?: string;
      shouldRetry?: (error: Error) => boolean;
    }
  ): Promise<T | null> => {
    const { message, operationName, shouldRetry } = retryOptions || {};

    while (retryCount.current < maxRetries) {
      try {
        const result = await withLoading(operation, {
          message,
          operationName,
        });

        if (result !== null) {
          retryCount.current = 0; // Reset on success
          return result;
        }
      } catch (error) {
        retryCount.current++;
        
        const err = error instanceof Error ? error : new Error(String(error));
        
        // Check if should retry
        if (shouldRetry && !shouldRetry(err)) {
          retryCount.current = 0;
          throw err;
        }

        if (retryCount.current >= maxRetries) {
          retryCount.current = 0;
          throw err;
        }

        // Log retry attempt
        errorLogger.warning(
          `Retrying operation (${retryCount.current}/${maxRetries})`,
          { operationName, error: err.message },
          'useLoadingWithRetry'
        );

        // Wait before retry (exponential backoff)
        await new Promise(resolve => 
          setTimeout(resolve, Math.pow(2, retryCount.current) * 1000)
        );
      }
    }

    return null;
  }, [withLoading, maxRetries]);

  return {
    ...loadingState,
    withRetry,
    retryCount: retryCount.current,
  };
}