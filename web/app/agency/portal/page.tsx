"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Truck, Navigation, Plus, Building2, MapPin, Activity, Save, Loader2, AlertTriangle, User, LogOut, Layout, Map as MapIcon, List, Settings, Maximize, Minimize, ChevronDown } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/lib/auth';
import { fetchSectorReport, Asset, Mission, fetchActiveMissions, updateMissionStatus } from '@/lib/api';
import MapboxMap from '@/components/MapboxMap';
import UserMenu from '@/components/UserMenu';
import CommandBar from '@/components/CommandBar';

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
    const [agencyName, setAgencyName] = useState<string>("Agency Command Portal");
    const [viewMode, setViewMode] = useState<'list' | 'map'>('list');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [displayMode, setDisplayMode] = useState<'dark' | 'light' | 'contrast' | 'oled' | 'terminal'>('dark');
    const [watermarkMode, setWatermarkMode] = useState<'none' | 'seal' | 'coat_of_arms'>('seal');
    const [showSettings, setShowSettings] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [missions, setMissions] = useState<Mission[]>([]);
    const [isMissionsLoading, setIsMissionsLoading] = useState(false);
    const [isPanicMode, setIsPanicMode] = useState(false);

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
                setAgencyName("National Command Oversight");
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
        <div className="min-h-screen bg-transparent text-slate-900 dark:text-white relative flex flex-col" data-theme={displayMode} data-watermark={watermarkMode}>
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

            {/* Global Environment Settings Modal */}
            <AnimatePresence>
                {showSettings && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="fixed top-20 right-6 z-[110] w-[300px] bg-black/95 border border-white/10 rounded-xl p-6 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-blue-400" />
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
                                            className={`h-8 rounded border flex flex-col items-center justify-center transition-all ${displayMode === theme.id ? 'border-blue-500 bg-blue-600/10' : 'border-white/10 hover:border-white/20'}`}
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
                                            className={`py-2 rounded border transition-all text-left px-3 ${watermarkMode === wm.id ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-white/10 text-white/40 hover:text-white/60'}`}
                                        >
                                            <span className="text-[8px] font-black uppercase tracking-tighter">{wm.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            <main className="flex-1 grid grid-cols-1 lg:grid-cols-3 gap-8 relative overflow-hidden p-8 pt-20">
                {/* Action Toolbar (Centered & Unified) */}
                <div className="lg:col-span-3 flex justify-center mb-6">
                    <div className="glass-card-premium p-1.5 rounded-2xl border-white/10 flex items-center gap-4 shadow-2xl backdrop-blur-xl">

                        {/* View Toggles */}
                        <div className="flex bg-white/5 dark:bg-black/40 rounded-xl p-1 gap-1">
                            <button
                                onClick={() => setViewMode('list')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'list'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                                    }`}
                            >
                                <List className="w-3.5 h-3.5" />
                                Index
                            </button>
                            <button
                                onClick={() => setViewMode('map')}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${viewMode === 'map'
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
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
                                className="bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 px-6 py-2 rounded-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all group"
                            >
                                <Plus className="w-3.5 h-3.5 group-hover:rotate-90 transition-transform" />
                                Deploy_Asset
                            </button>

                            <button
                                onClick={togglePanicMode}
                                className={`px-6 py-2 rounded-lg flex items-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all border ${isPanicMode
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

                {/* Asset Form Panel - Sliding Overlay on Mobile or Sidebar on Desktop */}
                {showAssetForm && (
                    <div className="fixed inset-0 z-[115] bg-black/80 backdrop-blur-md flex items-center justify-center lg:static lg:bg-transparent lg:block lg:col-span-1">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="glass-card-premium p-8 w-full max-w-md lg:max-w-none border-blue-500/20"
                        >
                            <div className="flex justify-between items-center mb-8">
                                <h2 className="text-sm font-black flex items-center gap-3 uppercase tracking-widest text-slate-900 dark:text-white">
                                    <Navigation className="w-5 h-5 text-blue-500" />
                                    Deployment Interface
                                </h2>
                                <button onClick={() => setShowAssetForm(false)} className="lg:hidden text-slate-400 hover:text-white transition-all">
                                    <LogOut className="w-5 h-5 rotate-180" />
                                </button>
                            </div>

                            <form onSubmit={handleCreateAsset} className="space-y-5">
                                <div className="space-y-2">
                                    <label className="block text-[9px] font-black text-slate-500 dark:text-white/20 uppercase tracking-[0.25em] pl-1">Asset Designation</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-white/5 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-xl p-3.5 text-[11px] font-black uppercase tracking-widest focus:border-blue-500/50 outline-none dark:text-white transition-all shadow-inner"
                                        placeholder="ALPHA_PATROL_01"
                                        value={newAsset.name}
                                        onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-slate-500 dark:text-white/20 uppercase tracking-[0.25em] pl-1">Resource Type</label>
                                        <select
                                            className="w-full bg-white/5 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-xl p-3.5 text-[11px] font-black uppercase tracking-widest focus:border-blue-500/50 outline-none text-slate-900 dark:text-white appearance-none cursor-pointer shadow-inner"
                                            value={newAsset.type}
                                            onChange={e => setNewAsset({ ...newAsset, type: e.target.value })}
                                        >
                                            <option value="PATROL_VEHICLE">Vehicle</option>
                                            <option value="STATION">HQ Node</option>
                                            <option value="CHECKPOINT">Sentinel</option>
                                            <option value="AMBULANCE">Medical</option>
                                            <option value="FIRE_TRUCK">Tactical</option>
                                        </select>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-slate-500 dark:text-white/20 uppercase tracking-[0.25em] pl-1">IDENT_Code</label>
                                        <input
                                            type="text"
                                            className="w-full bg-white/5 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-xl p-3.5 text-[11px] font-black uppercase tracking-widest focus:border-blue-500/50 outline-none dark:text-white transition-all shadow-inner"
                                            placeholder="RED-1"
                                            value={newAsset.call_sign}
                                            onChange={e => setNewAsset({ ...newAsset, call_sign: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-slate-500 dark:text-white/20 uppercase tracking-[0.25em] pl-1">Lat_Vect</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            className="w-full bg-white/5 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-xl p-3.5 text-[11px] font-black uppercase tracking-widest focus:border-blue-500/50 outline-none dark:text-white transition-all shadow-inner"
                                            value={newAsset.latitude}
                                            onChange={e => setNewAsset({ ...newAsset, latitude: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-[9px] font-black text-slate-500 dark:text-white/20 uppercase tracking-[0.25em] pl-1">Long_Vect</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            className="w-full bg-white/5 dark:bg-black/30 border border-slate-200 dark:border-white/5 rounded-xl p-3.5 text-[11px] font-black uppercase tracking-widest focus:border-blue-500/50 outline-none dark:text-white transition-all shadow-inner"
                                            value={newAsset.longitude}
                                            onChange={e => setNewAsset({ ...newAsset, longitude: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-xl flex items-center justify-center gap-3 transition-all mt-4 uppercase text-[10px] tracking-[0.3em] shadow-[0_10px_20px_rgba(37,99,235,0.3)] border border-blue-400/30"
                                >
                                    <Save className="w-4 h-4" />
                                    Authorize_Deployment
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}

                {/* Main Content Area */}
                <div className={`${showAssetForm ? "lg:col-span-2" : "lg:col-span-3"} space-y-8 h-full`}>
                    {/* Mission Control Section */}
                    {viewMode === 'list' && (
                        <div className="glass-card-premium p-8 border-emerald-500/20">
                            <h2 className="text-sm font-black mb-6 flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-widest">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                Active_Mission_Control
                                <div className="ml-auto flex items-center gap-3">
                                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        <span className="text-emerald-500 text-[9px] font-black tracking-widest">LIVE</span>
                                    </div>
                                    <span className="bg-emerald-500/10 text-emerald-500 text-[9px] font-black px-3 py-1 rounded-lg border border-emerald-500/20 tracking-widest">
                                        {missions.length} LIVE_OPS
                                    </span>
                                </div>
                            </h2>

                            {isMissionsLoading && missions.length === 0 ? (
                                <div className="h-24 flex items-center justify-center">
                                    <Loader2 className="w-6 h-6 text-emerald-500 animate-spin" />
                                </div>
                            ) : missions.length === 0 ? (
                                <div className="py-12 bg-emerald-500/5 rounded-2xl border border-dashed border-emerald-500/20 flex flex-col items-center justify-center gap-3">
                                    <Shield className="w-8 h-8 text-emerald-500/20" />
                                    <p className="text-[9px] font-black uppercase text-emerald-500/40 tracking-[0.2em]">All sectors quiet. No active missions assigned.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-4 gap-4">
                                    {missions.map(mission => (
                                        <div key={mission.id} className="bg-white/5 dark:bg-black/20 border border-slate-200 dark:border-white/5 rounded-2xl p-4 hover:border-emerald-500/30 transition-all group">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 border border-emerald-500/20 group-hover:scale-110 transition-transform">
                                                        <Navigation className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-tighter">OP_{mission.id.slice(0, 6)}</p>
                                                        <p className="text-[8px] text-slate-400 dark:text-white/40 uppercase font-black">{mission.priority} PRIORITY</p>
                                                    </div>
                                                </div>
                                                <div className="flex flex-col items-end">
                                                    <span className={`text-[8px] font-black px-2 py-0.5 rounded-md border tracking-widest ${mission.status === 'ASSIGNED' ? 'bg-blue-500/20 text-blue-500 border-blue-500/20' :
                                                        mission.status === 'EN_ROUTE' ? 'bg-amber-500/20 text-amber-500 border-amber-500/20' :
                                                            'bg-emerald-500/20 text-emerald-500 border-emerald-500/20'
                                                        }`}>
                                                        {mission.status}
                                                    </span>
                                                    {mission.eta_minutes !== null && (
                                                        <p className="text-[8px] text-slate-400 dark:text-white/30 font-mono mt-1">ETA: {mission.eta_minutes}m</p>
                                                    )}
                                                </div>
                                            </div>

                                            <div className="flex gap-2 mt-4">
                                                <button
                                                    onClick={async () => {
                                                        const nextStatus = mission.status === 'ASSIGNED' ? 'EN_ROUTE' : 'ON_SITE';
                                                        if (mission.status === 'ON_SITE') return;
                                                        await updateMissionStatus(mission.id, nextStatus);
                                                        loadMissions();
                                                    }}
                                                    className={`flex-1 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest transition-all ${mission.status === 'ON_SITE'
                                                        ? 'bg-emerald-500/10 text-emerald-500 cursor-default'
                                                        : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-600/20'
                                                        }`}
                                                >
                                                    {mission.status === 'ASSIGNED' ? 'Advance_Route' : mission.status === 'EN_ROUTE' ? 'Confirm_Arrival' : 'Mission_Active'}
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
                        <div className="glass-card-premium p-8 h-full min-h-[500px]">
                            <h2 className="text-sm font-black mb-8 flex items-center gap-3 text-slate-900 dark:text-white uppercase tracking-widest">
                                <Activity className="w-5 h-5 text-emerald-500" />
                                Fleet_Resource_Manifest
                                <span className="bg-blue-500/10 text-blue-500 text-[9px] font-black px-3 py-1 rounded-lg border border-blue-500/20 ml-auto tracking-widest">
                                    {assets.length} UNITS_SYNCED
                                </span>
                            </h2>

                            {isLoading ? (
                                <div className="h-48 flex flex-col items-center justify-center gap-4">
                                    <div className="w-8 h-8 border-2 border-slate-200 dark:border-white/10 border-t-blue-500 rounded-full animate-spin" />
                                    <span className="text-[10px] text-slate-500 dark:text-white/40 font-black uppercase tracking-widest animate-pulse">Querying Central Hub...</span>
                                </div>
                            ) : assets.length === 0 ? (
                                <div className="text-center py-24 bg-white/5 dark:bg-black/20 rounded-2xl border border-dashed border-slate-200 dark:border-white/10">
                                    <Truck className="w-12 h-12 text-slate-300 dark:text-white/10 mx-auto mb-4" />
                                    <p className="text-[10px] font-black uppercase text-slate-400 dark:text-white/20 tracking-widest">No active deployments found in sector.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                    {assets.map((asset) => (
                                        <div key={asset.id} className="glass-card-premium p-6 hover:scale-[1.02] border-white/5">
                                            <div className="flex justify-between items-start mb-4">
                                                <div className="bg-blue-500/10 p-2.5 rounded-xl text-blue-500 border border-blue-500/20 group-hover:scale-110 transition-transform">
                                                    {asset.type === 'STATION' ? <Building2 className="w-5 h-5" /> :
                                                        asset.type === 'CHECKPOINT' ? <MapPin className="w-5 h-5" /> :
                                                            <Truck className="w-5 h-5" />}
                                                </div>
                                                <span className={`text-[9px] font-black px-2.5 py-1 rounded-lg border uppercase tracking-widest shadow-sm ${asset.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'
                                                    }`}>
                                                    {asset.status}
                                                </span>
                                            </div>
                                            <h3 className="font-black text-slate-900 dark:text-white mb-1.5 uppercase tracking-tight text-sm">{(asset.name || 'UNNAMED_ASSET')}</h3>
                                            <p className="text-[10px] text-slate-500 dark:text-white/40 line-clamp-2 font-medium italic">{(asset.description || 'No operational details logged by agency.')}</p>

                                            <div className="mt-5 pt-4 border-t border-white/10 flex justify-between items-center text-[9px] text-slate-400 dark:text-white/20 font-black font-mono tracking-widest uppercase">
                                                <span className="flex items-center gap-1.5"><span className="w-1 h-1 bg-blue-500 rounded-full" /> CAP: {asset.capacity_level}%</span>
                                                <span className="opacity-50">NODE_{asset.id.slice(0, 8)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}

                    {/* View: MAP */}
                    {viewMode === 'map' && (
                        <div className="glass-card-premium overflow-hidden h-full min-h-[500px]">
                            <MapboxMap
                                alerts={[]}
                                resources={assets}
                                mode="tactical"
                                primaryColor="#3B82F6"
                            />
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
