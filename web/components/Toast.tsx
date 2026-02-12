'use client';

import React, { useState, useCallback } from 'react';
import { CheckCircle, AlertCircle, X, Info, AlertTriangle } from 'lucide-react';
import { errorLogger } from '../lib/errorLogger';

export interface Toast {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  duration?: number;
  persistent?: boolean;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (toast: Omit<Toast, 'id'>) => string;
  hideToast: (id: string) => void;
  clearToasts: () => void;
  success: (message: string, title?: string) => string;
  error: (message: string, title?: string, persistent?: boolean) => string;
  warning: (message: string, title?: string) => string;
  info: (message: string, title?: string) => string;
}

const ToastContext = React.createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((toast: Omit<Toast, 'id'>): string => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const newToast: Toast = {
      id,
      duration: 5000,
      persistent: false,
      ...toast,
    };

    setToasts(prev => [...prev, newToast]);

    // Auto-hide if not persistent
    if (!newToast.persistent) {
      setTimeout(() => {
        hideToast(id);
      }, newToast.duration);
    }

    // Log toast for debugging
    errorLogger.info(`Toast shown: ${toast.type}`, {
      toastId: id,
      type: toast.type,
      title: toast.title,
      message: toast.message,
      persistent: toast.persistent,
    }, 'ToastProvider');

    return id;
  }, []);

  const hideToast = useCallback((id: string) => {
    setToasts(prev => {
      const toast = prev.find(t => t.id === id);
      if (toast?.onClose) {
        toast.onClose();
      }
      return prev.filter(t => t.id !== id);
    });
  }, []);

  const clearToasts = useCallback(() => {
    setToasts([]);
  }, []);

  // Convenience methods
  const success = useCallback((message: string, title?: string) => {
    return showToast({ type: 'success', message, title });
  }, [showToast]);

  const error = useCallback((message: string, title?: string, persistent = true) => {
    return showToast({ type: 'error', message, title, persistent });
  }, [showToast]);

  const warning = useCallback((message: string, title?: string) => {
    return showToast({ type: 'warning', message, title });
  }, [showToast]);

  const info = useCallback((message: string, title?: string) => {
    return showToast({ type: 'info', message, title });
  }, [showToast]);

  const contextValue: ToastContextType = {
    toasts,
    showToast,
    hideToast,
    clearToasts,
    success,
    error,
    warning,
    info,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

// Toast container component
function ToastContainer() {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-3 max-w-sm w-full">
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => hideToast(toast.id)} />
      ))}
    </div>
  );
}

// Individual toast component
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const [isVisible, setIsVisible] = useState(false);

  React.useEffect(() => {
    // Trigger enter animation
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => {
      onClose();
    }, 300); // Match animation duration
  };

  const getToastStyles = (): string => {
    const baseStyles = 'transform transition-all duration-300 ease-in-out';
    const visibilityStyles = isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0';
    const typeStyles = getToastTypeStyles();
    
    return `${baseStyles} ${visibilityStyles} ${typeStyles}`;
  };

  const getToastTypeStyles = (): string => {
    switch (toast.type) {
      case 'success':
        return 'bg-green-500/10 border-green-500/30 text-green-400';
      case 'error':
        return 'bg-red-500/10 border-red-500/30 text-red-400';
      case 'warning':
        return 'bg-amber-500/10 border-amber-500/30 text-amber-400';
      case 'info':
        return 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    }
  };

  const getToastIcon = () => {
    switch (toast.type) {
      case 'success':
        return <CheckCircle className="w-5 h-5" />;
      case 'error':
        return <AlertCircle className="w-5 h-5" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5" />;
      case 'info':
        return <Info className="w-5 h-5" />;
    }
  };

  return (
    <div className={`rounded-lg border backdrop-blur-sm p-4 shadow-lg ${getToastStyles()}`}>
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getToastIcon()}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {toast.title && (
            <h4 className="font-semibold text-sm mb-1 text-white">
              {toast.title}
            </h4>
          )}
          <p className="text-sm leading-relaxed">
            {toast.message}
          </p>
          
          {/* Action */}
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="mt-2 text-sm font-medium underline hover:no-underline focus:outline-none"
            >
              {toast.action.label}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={handleClose}
          className="flex-shrink-0 p-1 rounded hover:bg-black/20 transition-colors focus:outline-none"
          aria-label="Close toast"
        >
          <X className="w-4 h-4 opacity-70 hover:opacity-100" />
        </button>
      </div>

      {/* Progress indicator for non-persistent toasts */}
      {!toast.persistent && toast.duration && (
        <div className="absolute bottom-0 left-0 h-1 bg-current opacity-30 animate-pulse" 
             style={{ 
               animation: `shrink ${toast.duration}ms linear`,
               width: '100%'
             }} 
        />
      )}
    </div>
  );
}

// Hook for managing toasts in functional components
export function useToastNotifications() {
  const toast = useToast();

  const showSuccess = useCallback((
    message: string,
    title?: string,
    options?: { duration?: number; action?: { label: string; onClick: () => void } }
  ) => {
    return toast.showToast({
      type: 'success',
      message,
      title,
      ...options,
    });
  }, [toast]);

  const showError = useCallback((
    message: string,
    title?: string,
    options?: { persistent?: boolean; duration?: number; action?: { label: string; onClick: () => void } }
  ) => {
    return toast.showToast({
      type: 'error',
      message,
      title,
      persistent: options?.persistent ?? true,
      ...options,
    });
  }, [toast]);

  const showWarning = useCallback((
    message: string,
    title?: string,
    options?: { duration?: number; action?: { label: string; onClick: () => void } }
  ) => {
    return toast.showToast({
      type: 'warning',
      message,
      title,
      ...options,
    });
  }, [toast]);

  const showInfo = useCallback((
    message: string,
    title?: string,
    options?: { duration?: number; action?: { label: string; onClick: () => void } }
  ) => {
    return toast.showToast({
      type: 'info',
      message,
      title,
      ...options,
    });
  }, [toast]);

  const showLoading = useCallback((
    message: string,
    title?: string,
    options?: { duration?: number }
  ) => {
    return toast.showToast({
      type: 'info',
      message,
      title,
      duration: options?.duration || 0, // No auto-hide for loading
      persistent: true,
    });
  }, [toast]);

  const updateToast = useCallback((
    id: string,
    updates: Partial<Omit<Toast, 'id'>>
  ) => {
    // This would require modifying the ToastContext to support updates
    // For now, we can hide the old toast and show a new one
    toast.hideToast(id);
    return toast.showToast({
      type: 'info',
      message: '',
      ...updates,
    });
  }, [toast]);

  return {
    ...toast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    updateToast,
  };
}

// Global toast utility for non-component usage
let globalToast: ToastContextType | null = null;

export const setGlobalToast = (toast: ToastContextType) => {
  globalToast = toast;
};

export const toast = {
  success: (message: string, title?: string) => {
    if (!globalToast) console.warn('Toast provider not initialized');
    return globalToast?.success(message, title) || '';
  },
  error: (message: string, title?: string, persistent?: boolean) => {
    if (!globalToast) console.warn('Toast provider not initialized');
    return globalToast?.error(message, title, persistent) || '';
  },
  warning: (message: string, title?: string) => {
    if (!globalToast) console.warn('Toast provider not initialized');
    return globalToast?.warning(message, title) || '';
  },
  info: (message: string, title?: string) => {
    if (!globalToast) console.warn('Toast provider not initialized');
    return globalToast?.info(message, title) || '';
  },
  show: (toast: Omit<Toast, 'id'>) => {
    if (!globalToast) console.warn('Toast provider not initialized');
    return globalToast?.showToast(toast) || '';
  },
  hide: (id: string) => {
    globalToast?.hideToast(id);
  },
  clear: () => {
    globalToast?.clearToasts();
  },
};