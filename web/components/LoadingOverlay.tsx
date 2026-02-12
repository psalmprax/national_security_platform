'use client';

import React from 'react';
import { Loader2, CheckCircle, AlertCircle, X } from 'lucide-react';

interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  progress?: number;
  showProgress?: boolean;
  backdrop?: boolean;
  closable?: boolean;
  onClose?: () => void;
  className?: string;
  children?: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message = 'Loading...',
  progress,
  showProgress = false,
  backdrop = true,
  closable = false,
  onClose,
  className = '',
  children,
}: LoadingOverlayProps) {
  if (!isLoading) {
    return <>{children}</>;
  }

  const getProgressColor = (progress: number): string => {
    if (progress < 33) return 'bg-blue-500';
    if (progress < 66) return 'bg-amber-500';
    if (progress < 90) return 'bg-orange-500';
    return 'bg-green-500';
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${backdrop ? 'bg-black/80 backdrop-blur-sm' : ''} ${className}`}>
      <div className="bg-slate-800 rounded-2xl border border-slate-700 shadow-2xl p-8 max-w-md w-full mx-4 relative">
        {closable && onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1 rounded-lg hover:bg-slate-700 transition-colors"
            aria-label="Close loading overlay"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        )}

        <div className="flex flex-col items-center space-y-6">
          {/* Loading Spinner */}
          <div className="relative">
            <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
            {progress !== undefined && progress > 0 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-white">
                  {Math.round(progress)}%
                </span>
              </div>
            )}
          </div>

          {/* Message */}
          <div className="text-center">
            <p className="text-lg font-medium text-white mb-2">
              {message}
            </p>
            {progress !== undefined && (
              <p className="text-sm text-slate-400">
                {Math.round(progress)}% complete
              </p>
            )}
          </div>

          {/* Progress Bar */}
          {(showProgress || progress !== undefined) && (
            <div className="w-full">
              <div className="w-full bg-slate-700 rounded-full h-2 overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${getProgressColor(progress || 0)}`}
                  style={{ width: `${progress || 0}%` }}
                />
              </div>
            </div>
          )}

          {/* Additional Info */}
          <div className="text-center">
            <p className="text-xs text-slate-500">
              This may take a few moments...
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Compact loading indicator
export function LoadingIndicator({
  isLoading,
  message,
  size = 'md',
  className = '',
}: {
  isLoading: boolean;
  message?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  if (!isLoading) return null;

  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
  };

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Loader2 className={`${sizeClasses[size]} text-blue-400 animate-spin`} />
      {message && (
        <span className="text-sm text-slate-300">{message}</span>
      )}
    </div>
  );
}

// Progress bar component
export function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'blue',
  size = 'md',
  animated = true,
  className = '',
}: {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'blue' | 'green' | 'amber' | 'red';
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
  className?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500',
  };

  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3',
  };

  return (
    <div className={`w-full ${className}`}>
      {label && (
        <div className="flex justify-between items-center mb-1">
          <span className="text-sm font-medium text-slate-300">{label}</span>
          {showPercentage && (
            <span className="text-sm text-slate-400">
              {Math.round(percentage)}%
            </span>
          )}
        </div>
      )}
      
      <div className={`w-full bg-slate-700 rounded-full overflow-hidden ${sizeClasses[size]}`}>
        <div
          className={`h-full ${colorClasses[color]} ${animated ? 'transition-all duration-300' : ''}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

// Skeleton loading component
export function SkeletonLoader({
  lines = 3,
  showAvatar = false,
  className = '',
}: {
  lines?: number;
  showAvatar?: boolean;
  className?: string;
}) {
  return (
    <div className={`animate-pulse ${className}`}>
      {showAvatar && (
        <div className="w-12 h-12 bg-slate-700 rounded-full mb-4" />
      )}
      
      {Array.from({ length: lines }, (_, index) => (
        <div
          key={index}
          className={`bg-slate-700 rounded ${
            index === 0 ? 'h-4 w-3/4' : 
            index === lines - 1 ? 'h-4 w-1/2' : 
            'h-4 w-full'
          } mb-2`}
        />
      ))}
    </div>
  );
}

// Card skeleton loader
export function CardSkeleton({
  count = 1,
  className = '',
}: {
  count?: number;
  className?: string;
}) {
  return (
    <div className={`grid gap-4 ${className}`}>
      {Array.from({ length: count }, (_, index) => (
        <div key={index} className="bg-slate-800 rounded-lg p-6 animate-pulse">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-slate-700 rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-slate-700 rounded w-1/3 mb-2" />
              <div className="h-3 bg-slate-700 rounded w-1/4" />
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="h-3 bg-slate-700 rounded" />
            <div className="h-3 bg-slate-700 rounded w-5/6" />
            <div className="h-3 bg-slate-700 rounded w-4/6" />
          </div>
          
          <div className="flex justify-between items-center mt-4">
            <div className="h-8 bg-slate-700 rounded w-20" />
            <div className="h-8 bg-slate-700 rounded w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}

// Table skeleton loader
export function TableSkeleton({
  rows = 5,
  columns = 4,
  className = '',
}: {
  rows?: number;
  columns?: number;
  className?: string;
}) {
  return (
    <div className={`bg-slate-800 rounded-lg overflow-hidden ${className}`}>
      {/* Header */}
      <div className="bg-slate-900/50 border-b border-slate-700 p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }, (_, index) => (
            <div key={index} className="h-4 bg-slate-700 rounded animate-pulse" />
          ))}
        </div>
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }, (_, rowIndex) => (
        <div key={rowIndex} className="border-b border-slate-700 p-4 last:border-b-0">
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }, (_, colIndex) => (
              <div key={colIndex} className="h-3 bg-slate-700 rounded animate-pulse" />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// Status loading indicator with different states
export function StatusLoading({
  status,
  message,
  className = '',
}: {
  status: 'loading' | 'success' | 'error' | 'warning';
  message?: string;
  className?: string;
}) {
  const getStatusIcon = () => {
    switch (status) {
      case 'loading':
        return <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />;
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-amber-400" />;
    }
  };

  const getStatusColor = () => {
    switch (status) {
      case 'loading': return 'text-blue-400 bg-blue-400/10 border-blue-400/30';
      case 'success': return 'text-green-400 bg-green-400/10 border-green-400/30';
      case 'error': return 'text-red-400 bg-red-400/10 border-red-400/30';
      case 'warning': return 'text-amber-400 bg-amber-400/10 border-amber-400/30';
    }
  };

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${getStatusColor()} ${className}`}>
      {getStatusIcon()}
      {message && (
        <span className="text-sm font-medium">{message}</span>
      )}
    </div>
  );
}