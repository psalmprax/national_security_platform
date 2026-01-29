"use client";

import React, { useState } from 'react';
import { Shield, User, Phone, Lock, Building2, CheckCircle, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export default function RequestAccessPage() {
    const [formData, setFormData] = useState({
        phoneNumber: '',
        firstName: '',
        lastName: '',
        password: '',
        role: 'CITIZEN'
    });
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/auth/request-access`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phone_number: formData.phoneNumber,
                    full_name: `${formData.firstName} ${formData.lastName}`.trim(),
                    password: formData.password,
                    role: formData.role
                }),
            });

            const data = await response.json();

            if (response.ok) {
                setIsSubmitted(true);
            } else {
                setError(data.message || 'Failed to submit request. Please try again.');
            }
        } catch (err) {
            setError('Connection error. Please check if the security gateway is active.');
            console.error('Registration error:', err);
        } finally {
            setIsLoading(false);
        }
    };

    const ROLES = [
        { value: 'INTEL_OFFICER', label: 'Intelligence Officer', description: 'Access to analytics and classified reports' },
        { value: 'GOVT_OFFICIAL', label: 'Government Official', description: 'Access to regional metrics and summaries' },
        { value: 'TRADITIONAL_RULER', label: 'Traditional Ruler', description: 'Access to community verification tools' },
        { value: 'CITIZEN', label: 'Field Agent / Citizen', description: 'Limited access to submission status' }
    ];

    if (isSubmitted) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center p-4">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-slate-900 border border-slate-800 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl"
                >
                    <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-10 h-10 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Request Transmitted</h2>
                    <p className="text-slate-400 mb-8">
                        Your application for access has been logged in the national registry. An administrator will verify your credentials shortly.
                    </p>
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-cyan-400 font-bold hover:text-cyan-300 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Return to Login Gate
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black flex items-center justify-center p-4 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-[128px]"></div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-xl relative z-10"
            >
                <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-800 rounded-3xl p-8 md:p-12 shadow-2xl">
                    <div className="flex items-center gap-4 mb-10">
                        <Link href="/login" className="p-2 bg-slate-800/50 rounded-xl hover:bg-slate-800 text-slate-400 hover:text-white transition-all">
                            <ArrowLeft className="w-5 h-5" />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-bold text-white tracking-tight">Access Proclamation</h1>
                            <p className="text-slate-400 text-sm">Submit credentials for platform authorization</p>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex items-center gap-3">
                                <Shield className="w-5 h-5 text-red-500" />
                                <p className="text-red-400 text-sm font-medium">{error}</p>
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-slate-500 text-xs font-bold uppercase tracking-widest px-1">First Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.firstName}
                                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                        placeholder="First Name"
                                        className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-slate-500 text-xs font-bold uppercase tracking-widest px-1">Last Name</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.lastName}
                                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                        placeholder="Last Name"
                                        className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-slate-500 text-xs font-bold uppercase tracking-widest px-1">Device Binding</label>
                                <div className="relative">
                                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                    <input
                                        type="text"
                                        required
                                        value={formData.phoneNumber}
                                        onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                                        placeholder="Phone Number (Registered)"
                                        className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none transition-all"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-slate-500 text-xs font-bold uppercase tracking-widest px-1">Security Key</label>
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-600" />
                                    <input
                                        type="password"
                                        required
                                        value={formData.password}
                                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                        placeholder="Create Secure Password"
                                        className="w-full bg-slate-950/50 border border-slate-800 focus:border-cyan-500/50 rounded-2xl py-3.5 pl-12 pr-4 text-white placeholder:text-slate-600 outline-none transition-all"
                                    />
                                </div>
                            </div>
                        </div>



                        <div className="space-y-3">
                            <label className="text-slate-500 text-xs font-bold uppercase tracking-widest px-1">Personnel Classification</label>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {ROLES.map((role) => (
                                    <button
                                        key={role.value}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, role: role.value })}
                                        className={`text-left p-4 rounded-2xl border transition-all ${formData.role === role.value
                                            ? 'bg-cyan-500/10 border-cyan-500/50 ring-1 ring-cyan-500/50'
                                            : 'bg-slate-950/50 border-slate-800 hover:border-slate-700'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-1">
                                            <Building2 className={`w-4 h-4 ${formData.role === role.value ? 'text-cyan-400' : 'text-slate-600'}`} />
                                            <span className={`text-sm font-bold ${formData.role === role.value ? 'text-white' : 'text-slate-400'}`}>
                                                {role.label}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 leading-tight uppercase tracking-wider">{role.description}</p>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-gradient-to-r from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-xl shadow-cyan-900/20 active:scale-[0.98] disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                <span>SUBMIT ACCESS REQUEST</span>
                            )}
                        </button>
                    </form>
                </div>
            </motion.div>
        </div>
    );
}
