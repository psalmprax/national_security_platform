'use client';

import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface ErrorFallbackProps {
  error?: Error;
  resetError?: () => void;
  customMessage?: string;
}

export function ErrorFallback({ 
  error, 
  resetError, 
  customMessage 
}: ErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center min-h-64 bg-slate-900/50 rounded-lg border border-red-500/20 p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-red-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2">
          {customMessage || 'Something went wrong'}
        </h3>
        
        <p className="text-slate-300 mb-4">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        
        {resetError && (
          <button
            onClick={resetError}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Try Again
          </button>
        )}
      </div>
    </div>
  );
}

// Smaller error fallback for inline components
export function MiniErrorFallback({ message }: { message?: string }) {
  return (
    <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
      <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0" />
      <span className="text-red-300 text-sm">
        {message || 'Failed to load content'}
      </span>
    </div>
  );
}

// Network error fallback
export function NetworkErrorFallback({ onRetry }: { onRetry?: () => void }) {
  return (
    <div className="flex items-center justify-center min-h-64 bg-slate-900/50 rounded-lg border border-amber-500/20 p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-amber-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2">
          Network Error
        </h3>
        
        <p className="text-slate-300 mb-4">
          Unable to connect to the server. Please check your internet connection.
        </p>
        
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            Retry Connection
          </button>
        )}
      </div>
    </div>
  );
}

// Permission denied fallback
export function PermissionDeniedFallback({ 
  message, 
  onRequestAccess 
}: { 
  message?: string; 
  onRequestAccess?: () => void;
}) {
  return (
    <div className="flex items-center justify-center min-h-64 bg-slate-900/50 rounded-lg border border-amber-500/20 p-6">
      <div className="text-center max-w-md">
        <div className="flex justify-center mb-4">
          <AlertTriangle className="w-12 h-12 text-amber-400" />
        </div>
        
        <h3 className="text-lg font-semibold text-white mb-2">
          Access Denied
        </h3>
        
        <p className="text-slate-300 mb-4">
          {message || 'You don\'t have permission to access this resource.'}
        </p>
        
        {onRequestAccess && (
          <button
            onClick={onRequestAccess}
            className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            Request Access
          </button>
        )}
      </div>
    </div>
  );
}