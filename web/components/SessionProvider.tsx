'use client';

import React from 'react';
import { ToastProvider } from './Toast';
import { SessionWarning } from './SessionWarning';

export function SessionProvider({ children }: { children: React.ReactNode }) {
    return (
        <ToastProvider>
            {children}
            <SessionWarning />
        </ToastProvider>
    );
}
