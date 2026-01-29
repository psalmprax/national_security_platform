"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface User {
    id: string;
    phone_number: string;
    full_name: string;
    role: string;
    status: string;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    isLoading: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        const storedToken = localStorage.getItem('auth_token');
        if (storedToken) {
            // Ensure cookie is in sync with localStorage
            document.cookie = `auth_token=${storedToken}; path=/; SameSite=Lax`;
            setToken(storedToken);
            fetchUserInfo(storedToken);
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchUserInfo = async (authToken: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/me`, {
                headers: {
                    'Authorization': `Bearer ${authToken}`
                }
            });

            if (response.ok) {
                const userData = await response.json();
                setUser(userData);
            } else {
                // Token might be invalid or expired
                logout();
            }
        } catch (error) {
            console.error('Failed to fetch user info:', error);
            logout();
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (newToken: string) => {
        localStorage.setItem('auth_token', newToken);
        // Use SameSite=Lax to ensure cookie is sent after redirects across local hostnames
        document.cookie = `auth_token=${newToken}; path=/; SameSite=Lax`;
        setToken(newToken);
        await fetchUserInfo(newToken);
        router.push('/');
    };

    const logout = () => {
        localStorage.removeItem('auth_token');
        document.cookie = 'auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
        setToken(null);
        setUser(null);
        router.push('/login');
    };

    const checkAuth = async () => {
        const currentToken = localStorage.getItem('auth_token');
        if (currentToken) {
            await fetchUserInfo(currentToken);
        } else {
            logout();
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isLoading, login, logout, checkAuth }}>
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
