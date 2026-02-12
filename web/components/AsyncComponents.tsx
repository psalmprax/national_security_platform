'use client';

import React, { useState } from 'react';
import { LoadingOverlay } from '@/components/LoadingOverlay';
import { useLoading } from '@/hooks/useLoading';
import { useToastNotifications } from '@/components/Toast';

interface AsyncButtonProps {
  children: React.ReactNode;
  onClick: () => Promise<any>;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  disabled?: boolean;
  className?: string;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
  showSuccessToast?: boolean;
  showErrorToast?: boolean;
}

export function AsyncButton({
  children,
  onClick,
  loadingText = 'Loading...',
  successText = 'Success!',
  errorText = 'Error occurred',
  disabled = false,
  className = '',
  variant = 'primary',
  size = 'md',
  onSuccess,
  onError,
  showSuccessToast = false,
  showErrorToast = true,
}: AsyncButtonProps) {
  const { withLoading } = useLoading();
  const { showSuccess, showError } = useToastNotifications();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const getVariantStyles = (): string => {
    const baseStyles = 'font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800';
    
    const variants = {
      primary: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500 text-white',
      secondary: 'bg-slate-700 hover:bg-slate-600 focus:ring-slate-500 text-white',
      danger: 'bg-red-600 hover:bg-red-700 focus:ring-red-500 text-white',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg',
    };

    return `${baseStyles} ${variants[variant]} ${sizes[size]}`;
  };

  const handleClick = async () => {
    if (disabled || status === 'loading') return;

    try {
      setStatus('loading');
      const result = await onClick();
      
      setStatus('success');
      if (showSuccessToast) {
        showSuccess(successText);
      }
      onSuccess?.(result);
      
      // Reset status after success
      setTimeout(() => setStatus('idle'), 1500);
    } catch (error) {
      setStatus('error');
      if (showErrorToast) {
        const errorMessage = error instanceof Error ? error.message : errorText;
        showError(errorMessage);
      }
      onError?.(error instanceof Error ? error : new Error(String(error)));
      
      // Reset status after error
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  const isDisabled = disabled || status === 'loading';

  return (
    <button
      onClick={handleClick}
      disabled={isDisabled}
      className={`${getVariantStyles()} ${className} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${
        status === 'success' ? 'bg-green-600 hover:bg-green-700' : ''
      } ${
        status === 'error' ? 'bg-red-600 hover:bg-red-700' : ''
      }`}
    >
      <span className="flex items-center justify-center gap-2">
        {status === 'loading' && (
          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        )}
        
        {status === 'success' && (
          <span className="text-green-300">✓</span>
        )}
        
        {status === 'error' && (
          <span className="text-red-300">✗</span>
        )}
        
        {status === 'idle' ? children : loadingText}
      </span>
    </button>
  );
}

// Form with loading state
export function AsyncForm<T extends Record<string, any>>({
  children,
  onSubmit,
  loadingText = 'Submitting...',
  successText = 'Submitted successfully!',
  errorText = 'Submission failed',
  className = '',
  onSuccess,
  onError,
}: {
  children: React.ReactNode;
  onSubmit: (data: T) => Promise<any>;
  loadingText?: string;
  successText?: string;
  errorText?: string;
  className?: string;
  onSuccess?: (result: any) => void;
  onError?: (error: Error) => void;
}) {
  const { withLoading } = useLoading();
  const { showSuccess, showError } = useToastNotifications();
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    
    const formData = new FormData(event.currentTarget);
    const data: Record<string, any> = {};
    
    formData.forEach((value, key) => {
      data[key] = value;
    });

    try {
      setStatus('loading');
      const result = await onSubmit(data as T);
      
      setStatus('success');
      showSuccess(successText);
      onSuccess?.(result);
      
      // Reset form
      event.currentTarget.reset();
      
      // Reset status after success
      setTimeout(() => setStatus('idle'), 2000);
    } catch (error) {
      setStatus('error');
      showError(error instanceof Error ? error.message : errorText);
      onError?.(error instanceof Error ? error : new Error(String(error)));
      
      // Reset status after error
      setTimeout(() => setStatus('idle'), 3000);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={className}>
      <div className={status === 'loading' ? 'opacity-50 pointer-events-none' : ''}>
        {children}
      </div>
      
      {status === 'loading' && (
        <div className="flex items-center justify-center py-4">
          <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <span className="ml-2 text-blue-400">{loadingText}</span>
        </div>
      )}
    </form>
  );
}