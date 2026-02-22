"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch, formatLabel } from './api';

export interface User {
    id: string;
    phone_number: string;
    full_name: string;
    role: string;
    clearance_level: string;
    nin_verified: boolean;
    biometric_enrolled: boolean;
    status: string;
    created_at: string;
    updated_at: string;
}

interface AuthContextType {
    user: User | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
    getCsrfToken: () => string;
    isAuthenticated: boolean;
    currentUserRole: string | undefined;
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
            // apiFetch handles the base URL and CSRF token automatically
            const response = await apiFetch(`/api/v1/auth/me`);

            if (response.ok) {
                const userData = await response.json();
                if (userData) {
                    // Assuming formatLabel is imported or globally available if not from ./api
                    userData.role = formatLabel(userData.role);
                    userData.clearance_level = formatLabel(userData.clearance_level);
                    userData.status = formatLabel(userData.status);
                }
                setUser(userData);
            } else if (response.status === 401 || response.status === 403) {
                // Unauthorized or Forbidden: clear local state
                console.warn('Session invalid or expired');
                setUser(null);
            } else {
                console.error(`Failed to fetch user info: ${response.status}`);
            }
        } catch (error) {
            console.error('Network error fetching user info:', error);
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

    const logout = async () => {
        try {
            await apiFetch('/api/v1/auth/logout', {
                method: 'POST',
            });
        } catch (error) {
            console.error('Logout API call failed:', error);
        } finally {
            // Always clear client state even if API fails
            setUser(null);
            router.push('/login');
        }
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

    const isAuthenticated = !!user;
    const currentUserRole = user?.role;

    return (
        <AuthContext.Provider value={{ user, isLoading, login, logout, checkAuth, getCsrfToken, isAuthenticated, currentUserRole }}>
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
