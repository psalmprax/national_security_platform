'use client';

import React from 'react';
import { LoadingOverlay } from './LoadingOverlay';
import { useLoading } from '../hooks/useLoading';

interface LoadingProviderProps {
  children: React.ReactNode;
}

export function LoadingProvider({ children }: LoadingProviderProps) {
  const { isLoading, message, progress } = useLoading();

  return (
    <>
      <LoadingOverlay
        isLoading={isLoading}
        message={message}
        progress={progress}
        showProgress={progress !== undefined}
      />
      {children}
    </>
  );
}

// Hook for accessing global loading state
export function useGlobalLoading() {
  // This would typically connect to a context
  // For now, use the local hook
  return useLoading();
}