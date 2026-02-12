import './globals.css'
import './styles/accessibility.css'
import type { Metadata } from 'next'
import React from 'react'
import { AuthProvider } from '@/lib/AuthContext'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { SessionProvider } from '@/components/SessionProvider'

export const metadata: Metadata = {
    title: 'National Security Platform - Dashboard',
    description: 'AI-Augmented Situational Awareness',
    icons: {
        icon: '/favicon.ico',
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="bg-black text-white">
                <ErrorBoundary>
                    <AuthProvider>
                        <SessionProvider>
                            {children}
                        </SessionProvider>
                    </AuthProvider>
                </ErrorBoundary>
            </body>
        </html>
    )
}
