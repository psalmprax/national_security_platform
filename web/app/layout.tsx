import './globals.css'
import type { Metadata } from 'next'
import React from 'react'
import { AuthProvider } from '@/lib/AuthContext'

export const metadata: Metadata = {
    title: 'National Security Platform - Dashboard',
    description: 'AI-Augmented Situational Awareness',
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className="bg-black text-white">
                <AuthProvider>
                    {children}
                </AuthProvider>
            </body>
        </html>
    )
}
