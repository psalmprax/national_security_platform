"use client";

import React, { useState } from 'react';
import { useAuth } from '@/lib/AuthContext';
import { Shield, Lock, Phone, AlertCircle, Loader2, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function LoginPage() {
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const { login, getCsrfToken } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/dashboard-login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken(),
                },
                body: JSON.stringify({ phone_number: phoneNumber, password }),
            });

            const data = await response.json();

            if (response.ok && data.token) {
                await login(data.token);
            } else if (response.status === 401) {
                setError('Session expired or invalid. Please clear your cookies and try again.');
            } else if (response.status === 403) {
                setError('ACCESS DENIED: Your role is unauthorized for this dashboard.');
            } else {
                setError(data.message || 'Authentication failed. Please check your credentials.');
            }
        } catch (err) {
            setError('Connection error. Please ensure the backend is reachable.');
            console.error('Login error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[128px] animate-pulse"></div>
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[128px] animate-pulse" style={{ animationDelay: '1s' }}></div>
            </div>

            {/* Grid Pattern */}
            <div className="absolute inset-0 opacity-20 pointer-events-none"
                style={{ backgroundImage: 'linear-gradient(#1e293b 1px, transparent 1px), linear-gradient(90deg, #1e293b 1px, transparent 1px)', backgroundSize: '40px 40px' }}
            ></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="bg-slate-900/40 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 shadow-2xl">
                    {/* Logo/Header */}
                    <div className="flex flex-col items-center mb-8">
                        <div className="w-16 h-16 bg-gradient-to-tr from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg shadow-cyan-500/20">
                            <Shield className="w-8 h-8 text-white" />
                        </div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">SITUATIONAL AWARENESS</h1>
                        <p className="text-slate-400 text-sm mt-1 uppercase tracking-widest font-medium">National Security Hub</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <AnimatePresence mode="wait">
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="bg-red-500/10 border border-red-500/20 p-3 rounded-xl flex items-center gap-3"
                                >
                                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                    <p className="text-red-400 text-sm font-medium">{error}</p>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-4">
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-cyan-400 text-slate-500 transition-colors">
                                    <Phone className="w-5 h-5" />
                                </div>
                                <input
                                    type="text"
                                    placeholder="Phone Number"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none transition-all"
                                    required
                                />
                            </div>

                            <div className="relative group">
                                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none group-focus-within:text-cyan-400 text-slate-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 focus:ring-4 focus:ring-cyan-500/5 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none transition-all"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-bold py-3.5 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <>
                                    <span>ACCESS PLATFORM</span>
                                    <ChevronRight className="w-5 h-5" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800 text-center space-y-4">
                        <p className="text-slate-400 text-sm">
                            Personnel without credentials?{' '}
                            <Link href="/request-access" className="text-cyan-400 font-bold hover:text-cyan-300 transition-colors">
                                Request Access Gate
                            </Link>
                        </p>
                        <p className="text-slate-500 text-xs">
                            <Link href="/agency/portal" className="hover:text-cyan-400 transition-colors flex items-center justify-center gap-1">
                                <Shield className="w-3 h-3" /> Agency Portal Access
                            </Link>
                        </p>
                    </div>
                </div>

                <div className="mt-6 text-center">
                    <p className="text-slate-600 text-xs uppercase tracking-widest font-bold">
                        Authorized Personnel Only • Federal Government of Nigeria
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
