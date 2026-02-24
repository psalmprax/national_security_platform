"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Truck, Navigation, Plus, Building2, MapPin, Activity, Save, Loader2, AlertTriangle, User, LogOut, Layout, Map as MapIcon, List, Settings, Maximize, Minimize, ChevronDown, Layers, ZoomIn, ZoomOut, Compass, Eye, EyeOff, Target, Radio, Clock } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/lib/auth';
import { fetchSectorReport, Asset, Mission, fetchActiveMissions, updateMissionStatus } from '@/lib/api';
import dynamic from 'next/dynamic';
const MapboxMap = dynamic(() => import('@/components/MapboxMap'), { ssr: false });

import UserMenu from '@/components/UserMenu';
import CommandBar from '@/components/CommandBar';
import Portal from '@/components/Portal';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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

export default function AgencyPortalPage() {
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAssetForm, setShowAssetForm] = useState(false);
    const [agencyName, setAgencyName] = useState('SITUATION ROOM');
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [displayMode, setDisplayMode] = useState<'dark' | 'light' | 'contrast' | 'oled' | 'terminal'>('dark');
    const [watermarkMode, setWatermarkMode] = useState<'none' | 'seal' | 'coat_of_arms'>('seal');
    const [showSettings, setShowSettings] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [isMissionsLoading, setIsMissionsLoading] = useState(false);
    const [isPanicMode, setIsPanicMode] = useState(false);
    const [isFramed, setIsFramed] = useState(false);
    // Map Controls
    const [mapLayer, setMapLayer] = useState<'street' | 'satellite' | 'terrain'>('satellite');
    const [showLegend, setShowLegend] = useState(true);
    const [mapZoom, setMapZoom] = useState(12);

    useEffect(() => {
        setIsFramed(window !== window.parent);
    }, []);

    // New Asset Form State
    const [newAsset, setNewAsset] = useState({
        agency_id: '00000000-0000-0000-0000-000000000000',
        name: '',
        type: 'PATROL_VEHICLE',
        latitude: 9.0765,
        longitude: 7.3986,
        status: 'ACTIVE',
        description: '',
        call_sign: '',
        capacity_level: 100
    });

    // Fetch Assets & Agency Info
    const loadPortalData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/assets`, {});
            if (res.ok) {
                const data = await res.json();
                setAssets(data || []);
            }

            if (user?.role === 'AGENCY_OFFICER') {
                const report = await fetchSectorReport();
                if (report && report.sector_id) {
                    setAgencyName(report.sector_id);
                }
            } else if (user?.role === 'ADMIN') {
                setAgencyName("SITUATION ROOM");
            }
        } catch (err) {
            console.error("Failed to fetch portal data", err);
        } finally {
            setIsLoading(false);
        }
    };

    const loadMissions = async () => {
        setIsMissionsLoading(true);
        try {
            const data = await fetchActiveMissions();
            setMissions(data || []);
        } catch (err) {
            console.error("Failed to fetch missions", err);
        } finally {
            setIsMissionsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading && user) {
            loadPortalData();
            loadMissions();
            const interval = setInterval(loadMissions, 5000);
            return () => clearInterval(interval);
        }

        const savedMode = localStorage.getItem('nsp_display_mode') as any;
        if (savedMode) setDisplayMode(savedMode);

        const savedWatermark = localStorage.getItem('nsp_watermark_mode') as any;
        if (savedWatermark) setWatermarkMode(savedWatermark);
    }, [user, isAuthLoading]);

    const updateWatermarkMode = (mode: 'none' | 'seal' | 'coat_of_arms') => {
        setWatermarkMode(mode);
        localStorage.setItem('nsp_watermark_mode', mode);
    };

    const updateDisplayMode = (mode: 'dark' | 'light' | 'contrast' | 'oled' | 'terminal') => {
        setDisplayMode(mode);
        localStorage.setItem('nsp_display_mode', mode);
    };

    // Handle Panic Mode Toggling
    const togglePanicMode = () => {
        const newMode = !isPanicMode;
        setIsPanicMode(newMode);

        if (newMode) {
            setNewAsset(prev => ({
                ...prev,
                type: 'RAPID_RESPONSE_UNIT',
                status: 'CRITICAL_DEPLOYMENT',
                description: 'EMERGENCY SCRAMBLE - COMMANDER AUTHORIZATION',
                capacity_level: 100
            }));
            setShowAssetForm(true);
        } else {
            setNewAsset(prev => ({
                ...prev,
                type: 'PATROL_VEHICLE',
                status: 'ACTIVE',
                description: '',
                capacity_level: 100
            }));
        }
    };

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">ACCESS DENIED</h1>
                <p className="text-slate-400 text-center max-w-md">You must be logged in to access the Agency Command Portal.</p>
                <a href="/login" className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all">
                    Return to Login
                </a>
            </div>
        );
    }

    const role = user.role as UserRole;
    const hasPortalAccess = role === 'ADMIN' || role === 'AGENCY_OFFICER';

    if (!hasPortalAccess) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <Shield className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">UNAUTHORIZED</h1>
                <p className="text-slate-400 text-center max-w-md">Your credentials do not grant access to the Agency Command Portal. Please contact system administration for clearance.</p>
                <a href="/" className="mt-6 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold transition-all">
                    Back to Dashboard
                </a>
            </div>
        );
    }

    const handleCreateAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/assets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-Token': getCsrfToken()
                },
                body: JSON.stringify(newAsset)
            });
            if (res.ok) {
                setShowAssetForm(false);
                loadPortalData();
                alert('Asset Deployed Successfully');
            } else {
                alert('Failed to deploy asset');
            }
        } catch (err) {
            console.error(err);
        }
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    return (
        <div className="min-h-screen bg-black text-slate-900 dark:text-white relative flex flex-col overflow-hidden" data-theme={displayMode} data-watermark={watermarkMode}>
            {/* Aesthetic Overlays */}
            <div className={`absolute inset-0 pointer-events-none z-0 transition-opacity duration-1000 ${isPanicMode ? 'opacity-40' : 'opacity-100'}`}>
                <div className="absolute inset-0 cyber-grid opacity-[0.03]" />
                <div className="absolute inset-0 cyber-grid-animate opacity-[0.02]" />
                <div className="absolute inset-0 cyber-scanline opacity-[0.03]" />
            </div>

            {/* Panic Mode Red Overlay */}
            <AnimatePresence>
                {isPanicMode && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 0.15 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-red-900 pointer-events-none z-10"
                    />
                )}
            </AnimatePresence>

            {!isFramed && (
                <>
                    <CommandBar
                        agencyName={agencyName}
                        userRole={user?.role}
                        showSettings={showSettings}
                        setShowSettings={setShowSettings}
                        isFullscreen={isFullscreen}
                        toggleFullscreen={toggleFullscreen}
                        showUserMenu={showUserMenu}
                        setShowUserMenu={setShowUserMenu}
                    />

                    <UserMenu
                        user={user}
                        onLogout={logout}
                        showMenu={showUserMenu}
                    />
                </>
            )}

            {/* Global Environment Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed z-[9999] w-[300px] glass-contrast rounded-xl p-6 shadow-2xl backdrop-blur-xl"
                            style={{
                                top: '80px',
                                right: '24px',
                                position: 'fixed',
                                left: 'auto'
                            }}
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-[#00D1FF]" />
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Config</h3>
                                </div>
                                <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white">✕</button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-3">Display Mode</h4>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[
                                            { id: 'dark', label: 'Dark', color: '#000000' },
                                            { id: 'light', label: 'Light', color: '#ffffff' },
                                            { id: 'contrast', label: 'Contrast', color: '#000000' },
                                            { id: 'oled', label: 'OLED', color: '#000000' },
                                            { id: 'terminal', label: 'Term', color: '#0a0a0a' }
                                        ].map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => updateDisplayMode(theme.id as any)}
                                                className={`h-8 rounded border flex flex-col items-center justify-center transition-all ${displayMode === theme.id ? 'border-[#00D1FF] bg-[#00D1FF]/10' : 'border-white/10 hover:border-white/20'}`}
                                            >
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.color, border: '1px solid white' }} />
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-3">Background Identity</h4>
                                    <div className="grid grid-cols-1 gap-2">
                                        {[
                                            { id: 'none', label: 'NONE' },
                                            { id: 'seal', label: 'COMMISSION SEAL' },
                                            { id: 'coat_of_arms', label: 'COAT OF ARMS' }
                                        ].map(wm => (
                                            <button
                                                key={wm.id}
                                                onClick={() => updateWatermarkMode(wm.id as any)}
                                                className={`py-2 rounded border transition-all text-left px-3 ${watermarkMode === wm.id ? 'border-[#00D1FF] bg-[#00D1FF]/10 text-[#00D1FF]' : 'border-white/10 text-white/40 hover:text-white/60'}`}
                                            >
                                                <span className="text-[8px] font-black uppercase tracking-tighter">{wm.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-6 relative overflow-hidden p-6 z-10 scrollbar-cyber">
                {/* Action Toolbar (Centered & Unified) */}
                <div className="lg:col-span-4 flex justify-center mb-2">
                    <div className="glass-card-premium p-1.5 rounded-2xl border-white/10 flex items-center gap-4 shadow-2xl backdrop-blur-xl">

                        {/* View Toggles */}
                        <div className="flex bg-white/5 dark:bg-black/40 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center justify-center gap-2 w-28 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list'
                                    ? 'bg-[#00D1FF] text-black shadow-lg shadow-[#00D1FF]/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <List className="w-3.5 h-3.5" />
                                Index
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`flex items-center justify-center gap-2 w-28 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map'
                                    ? 'bg-[#00D1FF] text-black shadow-lg shadow-[#00D1FF]/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <MapIcon className="w-3.5 h-3.5" />
                                Spatial
                            </button>
                        </div>

                        {/* Divider */}
                        <div className="w-px h-8 bg-white/10" />

                        {/* Actions */}
                        <div className="flex items-center gap-3 pr-2">
                            <button
                                onClick={() => setShowAssetForm(!showAssetForm)}
                                className={`w-48 justify-center px-6 py-2 rounded-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${showAssetForm
                                    ? 'bg-[#00D1FF]/20 text-[#00D1FF] border-[#00D1FF]/50 shadow-[0_0_15px_rgba(0,209,255,0.3)]'
                                    : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30'}`}
                            >
                                <Plus className={`w-3.5 h-3.5 transition-transform ${showAssetForm ? 'rotate-45' : 'group-hover:rotate-90'}`} />
                                {showAssetForm ? 'Close_Interface' : 'Deploy_Asset'}
                            </button>

                            <button
                                onClick={togglePanicMode}
                                className={`w-40 justify-center px-6 py-2 rounded-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${isPanicMode
                                    ? 'bg-red-600 text-white border-red-500 shadow-[0_0_20px_rgba(220,38,38,0.6)] animate-pulse'
                                    : 'bg-white/5 text-slate-400 hover:text-red-400 border-transparent hover:border-red-500/30 hover:bg-red-500/10'
                                    }`}
                            >
                                <AlertTriangle className={`w-3.5 h-3.5 ${isPanicMode ? 'animate-bounce' : ''}`} />
                                {isPanicMode ? 'PANIC_ACTIVE' : 'PANIC'}
                            </button>
                        </div>

                    </div>
                </div>

                {/* Asset Form Panel - Sliding Overlay */}
                <AnimatePresence>
                    {showAssetForm && (
                        <div className="fixed inset-0 z-[115] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
                            <motion.div
                                initial={{ opacity: 0, x: 100, scale: 0.95 }}
                                animate={{ opacity: 1, x: 0, scale: 1 }}
                                exit={{ opacity: 0, x: 100, scale: 0.95 }}
                                transition={{ type: 'spring', damping: 25, stiffness: 200 }}
                                className="glass-card-premium p-8 w-full max-w-lg border-[#00D1FF]/30 relative overflow-hidden"
                            >
                                {/* Scanline for form */}
                                <div className="absolute inset-x-0 top-0 h-px bg-[#00D1FF]/50 cyber-scanline" />

                                <div className="flex justify-between items-center mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-[#00D1FF]/10 rounded-xl flex items-center justify-center border border-[#00D1FF]/20">
                                            <Navigation className="w-5 h-5 text-[#00D1FF]" />
                                        </div>
                                        <div>
                                            <h2 className="text-sm font-black uppercase tracking-widest text-white">Deployment Interface</h2>
                                            <p className="text-[8px] text-white/40 uppercase tracking-[0.2em] font-black">Authorized_Access_Only</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowAssetForm(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
                                        <LogOut className="w-4 h-4 rotate-180" />
                                    </button>
                                </div>

                                <form onSubmit={handleCreateAsset} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-white/40 uppercase tracking-[0.25em] pl-1">Asset Designation</label>
                                        <input
                                            type="text"
                                            required
                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[11px] font-black uppercase tracking-widest focus:border-[#00D1FF]/50 outline-none text-white transition-all shadow-inner placeholder:text-white/10"
                                            placeholder="ALPHA_PATROL_01"
                                            value={newAsset.name}
                                            onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black text-white/40 uppercase tracking-[0.25em] pl-1">Resource Type</label>
                                            <div className="relative">
                                                <select
                                                    className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[11px] font-black uppercase tracking-widest focus:border-[#00D1FF]/50 outline-none text-white appearance-none cursor-pointer shadow-inner pr-10"
                                                    value={newAsset.type}
                                                    onChange={e => setNewAsset({ ...newAsset, type: e.target.value })}
                                                >
                                                    <option value="PATROL_VEHICLE">Vehicle</option>
                                                    <option value="STATION">HQ Node</option>
                                                    <option value="CHECKPOINT">Sentinel</option>
                                                    <option value="AMBULANCE">Medical</option>
                                                    <option value="FIRE_TRUCK">Tactical</option>
                                                </select>
                                                <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 pointer-events-none" />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black text-white/40 uppercase tracking-[0.25em] pl-1">IDENT_Code</label>
                                            <input
                                                type="text"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[11px] font-black uppercase tracking-widest focus:border-[#00D1FF]/50 outline-none text-white transition-all shadow-inner placeholder:text-white/10"
                                                placeholder="RED-1"
                                                value={newAsset.call_sign}
                                                onChange={e => setNewAsset({ ...newAsset, call_sign: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black text-white/40 uppercase tracking-[0.25em] pl-1">Lat_Vect</label>
                                            <input
                                                type="number"
                                                step="0.0001"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[11px] font-black uppercase tracking-widest focus:border-[#00D1FF]/50 outline-none text-white transition-all shadow-inner"
                                                value={newAsset.latitude}
                                                onChange={e => setNewAsset({ ...newAsset, latitude: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="block text-[9px] font-black text-white/40 uppercase tracking-[0.25em] pl-1">Long_Vect</label>
                                            <input
                                                type="number"
                                                step="0.0001"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-[11px] font-black uppercase tracking-widest focus:border-[#00D1FF]/50 outline-none text-white transition-all shadow-inner"
                                                value={newAsset.longitude}
                                                onChange={e => setNewAsset({ ...newAsset, longitude: parseFloat(e.target.value) })}
                                            />
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-[#00D1FF] hover:bg-[#00D1FF]/90 text-black font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all mt-4 uppercase text-[10px] tracking-[0.3em] shadow-[0_10px_20px_rgba(0,209,255,0.2)]"
                                    >
                                        <Save className="w-4 h-4" />
                                        Authorize_Deployment
                                    </button>
                                </form>
                            </motion.div>
                        </div>
                    )}
                </AnimatePresence>

                {/* Main Content Area */}
                <div className="lg:col-span-4 space-y-6 h-full overflow-y-auto pr-2 scrollbar-cyber">
                    {/* Mission Control Section */}
                    {viewMode === 'list' && (
                        <div className="glass-card-premium p-6 border-emerald-500/20 relative overflow-hidden min-h-[200px]">
                            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500/20" />

                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                        <Activity className="w-4 h-4 text-emerald-500" />
                                    </div>
                                    <div>
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Active_Mission_Control</h2>
                                        <p className="text-[7px] text-emerald-500/60 uppercase font-black tracking-widest">Real-Time Operational Pulse</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-md bg-emerald-500/5 border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-emerald-500 text-[8px] font-black tracking-widest uppercase">Live_Sync</span>
                                    </div>
                                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-3 py-1 rounded-md border border-emerald-500/20 tracking-widest uppercase">
                                        {missions.length} OPS
                                    </span>
                                </div>
                            </div>

                            {isMissionsLoading && missions.length === 0 ? (
                                <div className="h-24 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                </div>
                            ) : missions.length === 0 ? (
                                <div className="py-12 bg-emerald-500/[0.02] rounded-xl border border-dashed border-emerald-500/10 flex flex-col items-center justify-center gap-3">
                                    <Shield className="w-8 h-8 text-emerald-500/10" />
                                    <p className="text-[8px] font-black uppercase text-emerald-500/30 tracking-[0.2em]">All sectors quiet. No active missions assigned.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {missions.map(mission => (
                                        <div key={mission.id} className="flex items-center gap-4 bg-white/[0.02] border border-white/5 p-3 rounded-xl hover:bg-white/[0.05] hover:border-[#00D1FF]/30 transition-all group">
                                            <div className="w-8 h-8 rounded-lg bg-[#00D1FF]/10 flex items-center justify-center text-[#00D1FF] border border-[#00D1FF]/20 group-hover:scale-105 transition-transform shrink-0">
                                                <Navigation className="w-3.5 h-3.5" />
                                            </div>

                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-0.5">
                                                    <span className="text-[9px] font-black text-white uppercase tracking-tighter">OP_{mission.id.slice(0, 8)}</span>
                                                    <span className={`text-[7px] font-black px-1.5 py-0.5 rounded border tracking-[0.15em] uppercase ${mission.priority === 'IMMEDIATE' ? 'bg-red-500/20 text-red-500 border-red-500/20' :
                                                        mission.priority === 'HIGH' ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' :
                                                            'bg-blue-500/20 text-blue-500 border-blue-500/20'
                                                        }`}>
                                                        {mission.priority}
                                                    </span>
                                                </div>
                                                <p className="text-[8px] text-white/30 uppercase font-black tracking-widest truncate">{mission.description || 'No_Data_Logged'}</p>
                                            </div>

                                            <div className="flex items-center gap-6 shrink-0">
                                                <div className="text-right">
                                                    <p className={`text-[8px] font-black uppercase tracking-widest ${mission.status === 'ASSIGNED' ? 'text-blue-400' :
                                                        mission.status === 'EN_ROUTE' ? 'text-amber-400' :
                                                            'text-emerald-400'
                                                        }`}>{mission.status}</p>
                                                    {mission.eta_minutes !== null && (
                                                        <p className="text-[7px] text-white/20 font-mono">ETA: {mission.eta_minutes}m</p>
                                                    )}
                                                </div>

                                                <button
                                                    onClick={async () => {
                                                        const nextStatus = mission.status === 'ASSIGNED' ? 'EN_ROUTE' : 'ON_SITE';
                                                        if (mission.status === 'ON_SITE') return;
                                                        await updateMissionStatus(mission.id, nextStatus);
                                                        loadMissions();
                                                    }}
                                                    className={`px-4 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all border ${mission.status === 'ON_SITE'
                                                        ? 'border-emerald-500/20 text-emerald-500 bg-emerald-500/5 cursor-default'
                                                        : 'bg-emerald-600/10 hover:bg-emerald-600 text-emerald-400 hover:text-white border-emerald-500/30'
                                                        }`}
                                                >
                                                    {mission.status === 'ASSIGNED' ? 'Advance' : mission.status === 'EN_ROUTE' ? 'Arrive' : 'Active'}
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* View: LIST */}
                    {viewMode === 'list' && (
                        <div className="glass-card-premium p-6 border-[#00D1FF]/20 relative overflow-hidden min-h-[300px]">
                            <div className="absolute top-0 left-0 w-1 h-full bg-[#00D1FF]/20" />

                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#00D1FF]/10 flex items-center justify-center border border-[#00D1FF]/20">
                                        <Truck className="w-4 h-4 text-[#00D1FF]" />
                                    </div>
                                    <div>
                                        <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Fleet_Resource_Manifest</h2>
                                        <p className="text-[7px] text-[#00D1FF]/60 uppercase font-black tracking-widest">Global Asset Distribution</p>
                                    </div>
                                </div>
                                <span className="bg-[#00D1FF]/10 text-[#00D1FF] text-[8px] font-black px-3 py-1 rounded-md border border-[#00D1FF]/20 tracking-widest uppercase">
                                    {assets.length} UNITS_SYNCED
                                </span>
                            </div>

                            {isLoading ? (
                                <div className="h-48 flex flex-col items-center justify-center gap-4">
                                    <Loader2 className="w-8 h-8 text-[#00D1FF] animate-spin" />
                                    <span className="text-[8px] text-white/30 font-black uppercase tracking-widest animate-pulse">Synchronizing_Neural_Link...</span>
                                </div>
                            ) : assets.length === 0 ? (
                                <div className="text-center py-24 bg-white/[0.01] rounded-2xl border border-dashed border-white/5">
                                    <Truck className="w-12 h-12 text-white/5 mx-auto mb-4" />
                                    <p className="text-[9px] font-black uppercase text-white/20 tracking-widest">No active deployments found in sector.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                                    {assets.map((asset) => (
                                        <div key={asset.id} className="bg-white/[0.02] border border-white/5 rounded-xl p-4 hover:border-[#00D1FF]/30 transition-all group relative overflow-hidden">
                                            {/* Status Glow Tip */}
                                            <div className={`absolute top-0 right-0 w-16 h-1 bg-gradient-to-l from-transparent to-transparent ${asset.status === 'ACTIVE' ? 'via-emerald-500/40' : 'via-amber-500/40'
                                                }`} />

                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-[#00D1FF]/5 p-2 rounded-lg text-[#00D1FF] border border-[#00D1FF]/10 group-hover:scale-105 transition-transform">
                                                    {asset.type === 'STATION' ? <Building2 className="w-4 h-4" /> :
                                                        asset.type === 'CHECKPOINT' ? <MapPin className="w-4 h-4" /> :
                                                            <Truck className="w-4 h-4" />}
                                                </div>
                                                <span className={`text-[7px] font-black px-2 py-0.5 rounded border uppercase tracking-[0.2em] ${asset.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.2)]' :
                                                    'bg-amber-500/10 text-amber-500 border-amber-500/20 shadow-[0_0_8px_rgba(245,158,11,0.2)]'
                                                    }`}>
                                                    {asset.status}
                                                </span>
                                            </div>

                                            <h3 className="font-black text-white mb-1 uppercase tracking-tight text-[11px] truncate group-hover:text-[#00D1FF] transition-colors">{(asset.name || 'UNNAMED_UNIT')}</h3>
                                            <p className="text-[8px] text-white/20 line-clamp-1 font-medium tracking-wide">{(asset.description || 'No sectoral intelligence logged.')}</p>

                                            <div className="mt-4 pt-3 border-t border-white/5 flex justify-between items-center">
                                                <div className="flex items-center gap-1.5">
                                                    <div className="w-1 h-1 rounded-full bg-[#00D1FF]/40" />
                                                    <span className="text-[8px] text-white/40 font-black tracking-widest uppercase">Cap: {asset.capacity_level}%</span>
                                                </div>
                                                <span className="text-[7px] text-white/10 font-mono tracking-tighter shrink-0">{asset.id.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* View: MAP - Enhanced Spatial Overlay */}
                {viewMode === 'map' && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: 'easeOut' }}
                        className="glass-card-premium p-6 border-[#00D1FF]/20 relative overflow-hidden min-h-[500px]"
                    >
                        {/* Left Color Bar with Gradient */}
                        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#00D1FF]/40 via-[#00D1FF]/20 to-[#00D1FF]/5" />

                        {/* Enhanced Header */}
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-4">
                                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#00D1FF]/20 to-[#00D1FF]/5 flex items-center justify-center border border-[#00D1FF]/30 shadow-lg shadow-[#00D1FF]/10">
                                    <MapIcon className="w-5 h-5 text-[#00D1FF]" />
                                </div>
                                <div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.2em] text-white">Tactical Spatial Overlay</h2>
                                    <p className="text-[8px] text-[#00D1FF]/70 uppercase font-bold tracking-widest flex items-center gap-2">
                                        <Radio className="w-3 h-3 animate-pulse" />
                                        Geographic Asset Visualization
                                    </p>
                                </div>
                            </div>

                            {/* Map Controls */}
                            <div className="flex items-center gap-2">
                                {/* Layer Selector */}
                                <div className="flex bg-black/30 rounded-lg p-1 border border-white/10">
                                    {(['street', 'satellite', 'terrain'] as const).map((layer) => (
                                        <button
                                            key={layer}
                                            onClick={() => setMapLayer(layer)}
                                            className={`px-3 py-1.5 text-[9px] font-bold uppercase tracking-wider rounded-md transition-all ${mapLayer === layer
                                                    ? 'bg-[#00D1FF] text-black shadow-lg'
                                                    : 'text-white/50 hover:text-white hover:bg-white/10'
                                                }`}
                                        >
                                            {layer}
                                        </button>
                                    ))}
                                </div>

                                {/* Zoom Controls */}
                                <div className="flex bg-black/30 rounded-lg border border-white/10">
                                    <button
                                        onClick={() => setMapZoom(Math.max(1, mapZoom - 1))}
                                        className="p-2 text-white/70 hover:text-[#00D1FF] hover:bg-white/10 rounded-l-lg transition-all"
                                    >
                                        <ZoomOut className="w-4 h-4" />
                                    </button>
                                    <div className="px-3 py-2 text-[9px] font-mono text-[#00D1FF] border-x border-white/10 min-w-[50px] text-center">
                                        {mapZoom}x
                                    </div>
                                    <button
                                        onClick={() => setMapZoom(Math.min(20, mapZoom + 1))}
                                        className="p-2 text-white/70 hover:text-[#00D1FF] hover:bg-white/10 rounded-r-lg transition-all"
                                    >
                                        <ZoomIn className="w-4 h-4" />
                                    </button>
                                </div>

                                {/* Legend Toggle */}
                                <button
                                    onClick={() => setShowLegend(!showLegend)}
                                    className={`p-2 rounded-lg border transition-all ${showLegend
                                            ? 'bg-[#00D1FF]/20 border-[#00D1FF]/50 text-[#00D1FF]'
                                            : 'bg-black/30 border-white/10 text-white/50 hover:text-white'
                                        }`}
                                >
                                    <Layers className="w-4 h-4" />
                                </button>

                                {/* Fullscreen Toggle */}
                                <button
                                    onClick={() => setIsFullscreen(!isFullscreen)}
                                    className="p-2 rounded-lg bg-black/30 border border-white/10 text-white/50 hover:text-[#00D1FF] hover:border-[#00D1FF]/30 transition-all"
                                >
                                    {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
                                </button>
                            </div>
                        </div>

                        {/* Stats Bar */}
                        <div className="flex items-center gap-4 mb-4">
                            <div className="flex items-center gap-2 px-4 py-2 bg-[#00D1FF]/10 rounded-lg border border-[#00D1FF]/20">
                                <Target className="w-4 h-4 text-[#00D1FF]" />
                                <span className="text-[10px] font-bold text-[#00D1FF] uppercase tracking-wider">
                                    {assets.length} Assets Tracked
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-wider">
                                    Live Tracking
                                </span>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                                <Clock className="w-4 h-4 text-amber-500" />
                                <span className="text-[10px] font-bold text-amber-500 uppercase tracking-wider">
                                    Last Update: Just now
                                </span>
                            </div>
                        </div>

                        {/* Map Container with Legend */}
                        <div className="relative">
                            {/* Map Container */}
                            <motion.div
                                initial={{ scale: 0.98, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: 0.1, duration: 0.3 }}
                                className="glass-card-premium overflow-hidden min-h-[380px] border-[#00D1FF]/10 relative rounded-xl"
                            >
                                {/* Corner Decorations */}
                                <div className="absolute top-0 left-0 w-16 h-16 bg-gradient-to-br from-[#00D1FF]/20 to-transparent pointer-events-none z-10" />
                                <div className="absolute bottom-0 right-0 w-16 h-16 bg-gradient-to-tl from-[#00D1FF]/10 to-transparent pointer-events-none z-10" />

                                {/* Scan Line Effect */}
                                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#00D1FF]/5 to-transparent bg-[length:100%_4px] animate-scan pointer-events-none z-10" />

                                <MapboxMap
                                    alerts={[]}
                                    resources={assets}
                                    mode="tactical"
                                    primaryColor="#00D1FF"
                                />
                            </motion.div>

                            {/* Legend Panel */}
                            <AnimatePresence>
                                {showLegend && (
                                    <motion.div
                                        initial={{ opacity: 0, x: 20 }}
                                        animate={{ opacity: 1, x: 0 }}
                                        exit={{ opacity: 0, x: 20 }}
                                        className="absolute top-4 right-4 bg-black/80 backdrop-blur-xl rounded-xl border border-[#00D1FF]/30 p-4 z-20 min-w-[180px]"
                                    >
                                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-white/10">
                                            <Compass className="w-4 h-4 text-[#00D1FF]" />
                                            <span className="text-[10px] font-bold text-white uppercase tracking-wider">Asset Legend</span>
                                        </div>
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" />
                                                <span className="text-[9px] text-white/70">Patrol Vehicle</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-blue-500 shadow-lg shadow-blue-500/50" />
                                                <span className="text-[9px] text-white/70">Station</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
                                                <span className="text-[9px] text-white/70">Checkpoint</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="w-3 h-3 rounded-full bg-red-500 shadow-lg shadow-red-500/50 animate-pulse" />
                                                <span className="text-[9px] text-white/70">Active Incident</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 pt-2 border-t border-white/10">
                                            <div className="flex items-center justify-between text-[8px]">
                                                <span className="text-white/40">Coverage</span>
                                                <span className="text-[#00D1FF] font-bold">Abuja Metro</span>
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
