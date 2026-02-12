import { useState, useCallback, useRef } from 'react';
import { errorLogger } from '../lib/errorLogger';

interface ErrorHandlerState {
  hasError: boolean;
  error: Error | null;
  errorId: string;
  isRecovering: boolean;
}

interface UseErrorHandlerOptions {
  component?: string;
  onError?: (error: Error, errorId: string) => void;
  autoRetry?: boolean;
  maxRetries?: number;
  retryDelay?: number;
}

export function useErrorHandler(options: UseErrorHandlerOptions = {}) {
  const {
    component,
    onError,
    autoRetry = false,
    maxRetries = 3,
    retryDelay = 1000,
  } = options;

  const [state, setState] = useState<ErrorHandlerState>({
    hasError: false,
    error: null,
    errorId: '',
    isRecovering: false,
  });

  const retryCount = useRef<number>(0);
  const retryTimeout = useRef<NodeJS.Timeout | undefined>(undefined);

  const generateErrorId = useCallback(() => {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }, []);

  const handleError = useCallback((error: Error, context?: any) => {
    const errorId = generateErrorId();
    
    setState({
      hasError: true,
      error,
      errorId,
      isRecovering: false,
    });

    // Log error
    errorLogger.error(error.message, {
      stack: error.stack,
      context,
      errorId,
      component,
    });

    // Call custom error handler
    if (onError) {
      onError(error, errorId);
    }

    // Auto retry if enabled
    if (autoRetry && retryCount.current < maxRetries) {
      setState(prev => ({ ...prev, isRecovering: true }));
      
      retryTimeout.current = setTimeout(() => {
        retryCount.current++;
        handleRetry();
      }, retryDelay * Math.pow(2, retryCount.current)); // Exponential backoff
    }
  }, [component, onError, autoRetry, maxRetries, retryDelay, generateErrorId]);

  const handleRetry = useCallback(() => {
    setState({
      hasError: false,
      error: null,
      errorId: '',
      isRecovering: false,
    });

    // Clear retry timeout if exists
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
    }

    // Reset retry count
    retryCount.current = 0;
  }, []);

  const resetError = useCallback(() => {
    handleRetry();
  }, [handleRetry]);

  const clearError = useCallback(() => {
    setState({
      hasError: false,
      error: null,
      errorId: '',
      isRecovering: false,
    });
    
    // Reset retry count
    retryCount.current = 0;
    
    // Clear retry timeout
    if (retryTimeout.current) {
      clearTimeout(retryTimeout.current);
    }
  }, []);

  const handleErrorWithFallback = useCallback(async <T,>(
    operation: () => Promise<T>,
    fallback?: () => T,
    context?: any
  ): Promise<T | null> => {
    try {
      return await operation();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      handleError(err, context);
      
      if (fallback) {
        return fallback();
      }
      
      return null;
    }
  }, [handleError]);

  const wrapAsyncOperation = useCallback(<T,>(
    operation: () => Promise<T>,
    options?: {
      onSuccess?: (result: T) => void;
      onError?: (error: Error) => void;
      fallback?: () => T;
    }
  ) => {
    return async (): Promise<T | null> => {
      try {
        const result = await operation();
        options?.onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        handleError(err);
        options?.onError?.(err);
        
        if (options?.fallback) {
          return options.fallback();
        }
        
        return null;
      }
    };
  }, [handleError]);

  // Cleanup on unmount
  useState(() => {
    return () => {
      if (retryTimeout.current) {
        clearTimeout(retryTimeout.current);
      }
    };
  });

  return {
    // State
    hasError: state.hasError,
    error: state.error,
    errorId: state.errorId,
    isRecovering: state.isRecovering,
    
    // Actions
    handleError,
    handleRetry,
    resetError,
    clearError,
    
    // Utilities
    handleErrorWithFallback,
    wrapAsyncOperation,
    
    // State for debugging
    retryCount: retryCount.current,
  };
}

// Hook for handling API errors specifically
export function useApiErrorHandler(component?: string) {
  const handleError = useErrorHandler({ component });

  const handleApiError = useCallback((
    url: string,
    method: string,
    status: number,
    message: string,
    response?: any
  ) => {
    const error = new Error(`API Error: ${message}`);
    (error as any).status = status;
    (error as any).url = url;
    (error as any).method = method;
    (error as any).response = response;

    errorLogger.logApiError(url, method, status, message, response);
    handleError.handleError(error, { url, method, status, response });
  }, [handleError]);

  const isNetworkError = useCallback((error: any): boolean => {
    return (
      error instanceof TypeError &&
      (error.message.includes('Failed to fetch') ||
       error.message.includes('NetworkError') ||
       error.message.includes('fetch'))
    );
  }, []);

  const isServerError = useCallback((status: number): boolean => {
    return status >= 500;
  }, []);

  const isClientError = useCallback((status: number): boolean => {
    return status >= 400 && status < 500;
  }, []);

  const shouldRetry = useCallback((error: any, attempt: number): boolean => {
    // Retry network errors and server errors
    if (isNetworkError(error) || isServerError(error?.status)) {
      return attempt < 3;
    }
    
    // Don't retry client errors (4xx)
    if (isClientError(error?.status)) {
      return false;
    }
    
    return attempt < 1; // Default: retry once
  }, [isNetworkError, isServerError, isClientError]);

  return {
    ...handleError,
    handleApiError,
    isNetworkError,
    isServerError,
    isClientError,
    shouldRetry,
  };
}

// Hook for handling form validation errors
export function useFormErrorHandler() {
  const { handleError, clearError } = useErrorHandler({ component: 'Form' });

  const handleValidationError = useCallback((
    fieldName: string,
    value: any,
    validation: (value: any) => string | null,
    context?: any
  ): string | null => {
    const error = validation(value);
    
    if (error) {
      const validationError = new Error(`Validation failed for ${fieldName}: ${error}`);
      (validationError as any).field = fieldName;
      (validationError as any).value = value;
      (validationError as any).type = 'validation';
      
      handleError(validationError, { fieldName, value, ...context });
      return error;
    }
    
    return null;
  }, [handleError]);

  const handleMultipleValidationErrors = useCallback((
    errors: Record<string, string>,
    context?: any
  ): void => {
    const error = new Error('Multiple validation errors');
    (error as any).errors = errors;
    (error as any).type = 'validation_multiple';
    
    handleError(error, { errors, ...context });
  }, [handleError]);

  return {
    handleError,
    clearError,
    handleValidationError,
    handleMultipleValidationErrors,
  };
}