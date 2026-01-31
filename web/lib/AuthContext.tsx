"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface User {
    id: string;
    phone_number: string;
    full_name: string;
    role: string;
    status: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    getCsrfToken: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // We no longer read from localStorage. 
        // We just attempt to fetch user info. If the auth_token cookie exists and is valid, 
        // the backend will return the user data.
        fetchUserInfo();
    }, []);

    const fetchUserInfo = async () => {
        try {
            // No need to pass token explicitly; browser sends HttpOnly cookie automatically
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`);

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                // If 401, we are unauthenticated
                setUser(null);
            }
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            setUser(null);
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (newToken: string) => {
        // Note: newToken is still returned by the API for legacy/mobile support,
        // but the web dashboard now relies on the HttpOnly cookie set by the backend.
        await fetchUserInfo();
        router.push('/');
    };

    const logout = () => {
        // To clear an HttpOnly cookie, we ideally need a backend logout endpoint.
        // For now, we'll clear the client-side state and overwrite the cookie if possible, 
        // though HttpOnly cookies can only be fully cleared by the server.
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setUser(null);
        router.push('/login');
    };

    const checkAuth = async () => {
        await fetchUserInfo();
    };

    const getCsrfToken = () => {
        if (typeof document === 'undefined') return '';
        const name = 'csrf_token=';
        const decodedCookie = decodeURIComponent(document.cookie);
        const ca = decodedCookie.split(';');
        for (let i = 0; i < ca.length; i++) {
            let c = ca[i];
            while (c.charAt(0) === ' ') {
                c = c.substring(1);
            }
            if (c.indexOf(name) === 0) {
                return c.substring(name.length, c.length);
            }
        }
        return '';
    };

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth, getCsrfToken }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
