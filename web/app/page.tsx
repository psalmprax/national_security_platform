"use client";

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Layout,
    Users,
    ShieldAlert,
    LogOut,
    Key,
    Maximize,
    Minimize,
    Settings,
    Globe
} from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import CommandBar from '@/components/CommandBar';
import Portal from '@/components/Portal';
import { useAuth } from '@/lib/AuthContext';
import { AgencyView, hasAccess } from '@/lib/auth';
import { Alert, fetchAlerts } from '@/lib/api';
import CyberDashboard from '@/components/dashboards/CyberDashboard';
import TacticalDashboard from '@/components/dashboards/TacticalDashboard';
import StrategicDashboard from '@/components/dashboards/StrategicDashboard';
import AccessManagement from '@/components/admin/AccessManagement';
import AgentSystemStatus from '@/components/AgentSystemStatus';

export default function Home() {
    const router = useRouter();
    const { user, logout, isAuthenticated, currentUserRole } = useAuth();
    const [agencyView, setAgencyView] = useState<AgencyView>('cyber');
    const [displayMode, setDisplayMode] = useState<'dark' | 'light' | 'contrast' | 'oled' | 'terminal'>('dark');
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [securityStatus, setSecurityStatus] = useState({
        systemIntegrity: 98.4,
        networkSecure: true,
        encryptionActive: true,
        threatLevel: 'LOW',
        activeMonitors: 8472,
        lastScan: new Date().toISOString()
    });
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showAgencyPicker, setShowAgencyPicker] = useState(false);
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [useCommandBar, setUseCommandBar] = useState(true);
    const [watermarkMode, setWatermarkMode] = useState<'standard' | 'discrete' | 'off'>('standard');
    const [backgroundWatermarkMode, setBackgroundWatermarkMode] = useState<'none' | 'seal' | 'coat_of_arms'>('seal');

    // Load persisted view
    useEffect(() => {
        const saved = localStorage.getItem('agencyView') as AgencyView;
        if (saved && hasAccess(currentUserRole, saved)) {
            setAgencyView(saved);
        }

        // Load persisted background watermark
        const savedBg = localStorage.getItem('backgroundWatermarkMode') as 'none' | 'seal' | 'coat_of_arms';
        if (savedBg) setBackgroundWatermarkMode(savedBg);
    }, [currentUserRole]);

    // Persist background watermark
    const updateBackgroundWatermarkMode = (mode: 'none' | 'seal' | 'coat_of_arms') => {
        setBackgroundWatermarkMode(mode);
        localStorage.setItem('backgroundWatermarkMode', mode);
    };

    // Persist view changes
    const updateAgencyView = (view: AgencyView) => {
        if (hasAccess(currentUserRole, view)) {
            setAgencyView(view);
            localStorage.setItem('agencyView', view);
        }
    };

    // Update time every second
    useEffect(() => {
        setCurrentTime(new Date());
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    // Alert Fetching Logic
    useEffect(() => {
        const loadAlerts = async () => {
            const data = await fetchAlerts();
            setAlerts(data);
        };

        loadAlerts(); // Initial load
        const interval = setInterval(loadAlerts, 10000); // Poll every 10s
        return () => clearInterval(interval);
    }, []);

    // Fullscreen handler
    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
            setIsFullscreen(true);
        } else {
            document.exitFullscreen();
            setIsFullscreen(false);
        }
    };

    const updateDisplayMode = (mode: typeof displayMode) => {
        setDisplayMode(mode);
        document.documentElement.setAttribute('data-theme', mode);
        localStorage.setItem('displayMode', mode);
    };

    const updateWatermarkMode = (mode: typeof watermarkMode) => {
        setWatermarkMode(mode);
        localStorage.setItem('watermarkMode', mode);
    };

    // Simulated periodic security status updates
    useEffect(() => {
        const interval = setInterval(() => {
            setSecurityStatus(prev => ({
                ...prev,
                systemIntegrity: Math.min(100, Math.max(0, prev.systemIntegrity + (Math.random() * 2 - 1))),
                activeMonitors: prev.activeMonitors + Math.floor(Math.random() * 10),
            }));
        }, 5000);
        return () => clearInterval(interval);
    }, []);

    if (!isAuthenticated) {
        return (
            <div className="w-full h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
                    <p className="text-cyan-500 font-mono text-sm animate-pulse">AUTHENTICATING...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative w-full h-screen overflow-hidden flex flex-col items-stretch justify-start" data-watermark={backgroundWatermarkMode}>
            <Suspense fallback={null}>
                <ViewHandler setAgencyView={setAgencyView} currentUserRole={currentUserRole} />
            </Suspense>
            {/* Top Navigation Header */}
            <header className="flex-none z-50 w-full relative">
                {useCommandBar ? (
                    <CommandBar
                        agencyName="SITUATION ROOM"
                        userRole={user?.role || 'GUEST'}
                        user={user}
                        showSettings={showSettingsModal}
                        setShowSettings={setShowSettingsModal}
                        isFullscreen={isFullscreen}
                        toggleFullscreen={toggleFullscreen}
                        showUserMenu={showUserMenu}
                        setShowUserMenu={setShowUserMenu}
                        activeView={agencyView}
                        onNavigate={(view) => {
                            if (view === 'portal') {
                                window.location.href = '/agency/portal';
                                return;
                            }
                            const v = view as AgencyView;
                            if (hasAccess(currentUserRole, v)) {
                                setAgencyView(v);
                            }
                        }}
                        onLogout={logout}
                    />
                ) : (
                    <Portal>
                        <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[120] flex items-center pt-4">
                            <div className="flex items-center bg-black/80 border-b border-x border-white/20 rounded-xl backdrop-blur-md px-1 py-1 shadow-2xl">
                                {['ADMIN', 'SYSTEM_ADMIN', 'SECURITY_OFFICER'].includes(user?.role || '') && (
                                    <button
                                        className="h-7 px-4 hover:bg-white/5 rounded-lg flex items-center justify-center gap-2 cursor-pointer transition-all group"
                                        onClick={() => setShowAgencyPicker(!showAgencyPicker)}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-[#00FF95] animate-pulse" />
                                        <span className="text-[9px] font-black text-white/80 uppercase tracking-widest group-hover:text-[#00FF95]">
                                            {agencyView}
                                        </span>
                                    </button>
                                )}

                                <div className="w-px h-4 bg-white/10 mx-1" />

                                <button
                                    onClick={() => setShowSettingsModal(!showSettingsModal)}
                                    className={`h-7 w-8 rounded-lg flex items-center justify-center transition-all group ${showSettingsModal ? 'bg-[#00FF95]/20 text-[#00FF95]' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                                    title="Global Environment Settings"
                                >
                                    <Settings className="w-3.5 h-3.5" />
                                </button>

                                <div className="w-px h-4 bg-white/10 mx-1" />

                                <button
                                    onClick={toggleFullscreen}
                                    className="h-7 w-8 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-all group"
                                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                                >
                                    {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                                </button>

                                <div className="w-px h-4 bg-white/10 mx-1" />

                                <button
                                    onClick={logout}
                                    className="h-7 w-8 hover:bg-red-500/20 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 transition-all group"
                                    title="Secure Logout"
                                >
                                    <LogOut className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                    </Portal>
                )}
            </header>

            {/* Main Content Area */}
            <div className="flex-1 relative overflow-hidden w-full h-full z-10">
                {agencyView === 'cyber' && (
                    <div className="absolute inset-0">
                        <CyberDashboard
                            alerts={alerts}
                            currentTime={currentTime}
                            securityStatus={securityStatus}
                            user={user}
                            logout={logout}
                            displayMode={displayMode}
                            setDisplayMode={updateDisplayMode}
                        />
                    </div>
                )}

                {agencyView === 'tactical' && (
                    <div className="absolute inset-0">
                        <TacticalDashboard
                            alerts={alerts}
                            currentTime={currentTime}
                            securityStatus={securityStatus}
                            user={user}
                            logout={logout}
                            displayMode={displayMode}
                            setDisplayMode={updateDisplayMode}
                        />
                        {/* Agent System Status Overlay */}
                        <AgentSystemStatus />
                    </div>
                )}

                {agencyView === 'strategic' && (
                    <div className="absolute inset-0">
                        <StrategicDashboard
                            alerts={alerts}
                            currentTime={currentTime}
                            securityStatus={securityStatus}
                            user={user}
                            logout={logout}
                            displayMode={displayMode}
                            setDisplayMode={updateDisplayMode}
                        />
                    </div>
                )}

                {agencyView === 'access' && (
                    <div className="absolute inset-0">
                        <AccessManagement
                            displayMode={displayMode}
                            setDisplayMode={updateDisplayMode}
                            watermarkMode={backgroundWatermarkMode}
                            setWatermarkMode={updateBackgroundWatermarkMode}
                        />
                    </div>
                )}

                {agencyView === 'portal' && (
                    <div className="absolute inset-0 overflow-auto">
                        <iframe
                            src="/agency/portal"
                            className="w-full h-full border-none bg-black"
                            title="Agency Portal"
                        />
                    </div>
                )}

                {/* Dynamic Watermark - Scoped to Content */}
                {(watermarkMode === 'standard' || watermarkMode === 'discrete') && (
                    <div
                        className={`absolute inset-0 pointer-events-none z-0 flex items-center justify-center overflow-hidden ${watermarkMode === 'discrete' ? 'opacity-5' : 'opacity-10'}`}
                    >
                        <div className="whitespace-nowrap transform rotate-[-30deg] text-[20vw] font-black text-white select-none">
                            {Array(5).fill(`${agencyView.toUpperCase().replace('_', ' ')} // `).join('')}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Components */}
            <AnimatePresence>
                {showSettingsModal && (
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0, y: -20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className="fixed top-20 right-8 z-[110] w-[400px] glass-contrast rounded-xl border border-[#00FF95]/30 p-6 shadow-2xl backdrop-blur-xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-2">
                                    <Settings className="w-4 h-4 text-[#00FF95]" />
                                    <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Registry Environment Config</h3>
                                </div>
                                <button onClick={() => setShowSettingsModal(false)} className="text-white/40 hover:text-white">✕</button>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <h4 className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-3">Display Mode</h4>
                                    <div className="grid grid-cols-5 gap-2">
                                        {[
                                            { id: 'dark', name: 'Dark', color: '#1e293b', textColor: '#f8fafc' },
                                            { id: 'light', name: 'Light', color: '#f1f5f9', textColor: '#0f172a' },
                                            { id: 'contrast', name: 'High', color: '#000000', textColor: '#00ff00' },
                                            { id: 'oled', name: 'OLED', color: '#000000', textColor: '#ffffff' },
                                            { id: 'terminal', name: 'Term', color: '#0d1117', textColor: '#00ff00' }
                                        ].map((theme) => (
                                            <button
                                                key={theme.id}
                                                onClick={() => updateDisplayMode(theme.id as typeof displayMode)}
                                                className={`flex flex-col items-center gap-1 p-2 rounded-lg transition-all ${displayMode === theme.id ? 'ring-2 ring-[#00FF95] ring-offset-2 ring-offset-black' : 'hover:bg-white/5'}`}
                                                style={{ backgroundColor: theme.color, color: theme.textColor }}
                                            >
                                                <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: theme.color, border: '1px solid white' }} />
                                                <span className="text-[7px] font-black text-white/60 uppercase">{theme.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-3">Interface</h4>
                                    <div className="space-y-2">
                                        <button
                                            onClick={() => setUseCommandBar(!useCommandBar)}
                                            className={`w-full flex items-center justify-between px-4 py-3 rounded-lg border transition-all ${useCommandBar ? 'bg-white/5 border-white/10' : 'bg-transparent border-white/5'}`}
                                        >
                                            <span className="text-xs font-medium text-white/80">Unified Command Bar</span>
                                            <div className={`w-10 h-5 rounded-full relative transition-colors ${useCommandBar ? 'bg-[#00FF95]' : 'bg-white/20'}`}>
                                                <div className={`absolute top-1 w-3 h-3 bg-black rounded-full transition-all ${useCommandBar ? 'left-6' : 'left-1'}`} />
                                            </div>
                                        </button>
                                    </div>
                                </div>

                                <div>
                                    <h4 className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-3">Security Watermark</h4>
                                    <div className="grid grid-cols-3 gap-2">
                                        {(['standard', 'discrete', 'off'] as const).map((mode) => (
                                            <button
                                                key={mode}
                                                onClick={() => updateWatermarkMode(mode)}
                                                className={`py-2 px-3 rounded-lg border text-[9px] font-bold uppercase tracking-wider transition-all ${watermarkMode === mode ? 'bg-[#00FF95]/10 border-[#00FF95]/50 text-[#00FF95]' : 'border-white/10 text-white/40 hover:bg-white/5'}`}
                                            >
                                                {mode.charAt(0).toUpperCase() + mode.slice(1)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>

            <AnimatePresence>
                {showAgencyPicker && (
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[120] bg-black/80 backdrop-blur-xl flex items-center justify-center"
                        >
                            <motion.div
                                initial={{ scale: 0.95, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.95, opacity: 0 }}
                                className="bg-[#0a0a0a] border border-white/10 rounded-2xl p-8 max-w-2xl w-full mx-4 shadow-2xl"
                            >
                                <div className="flex items-center justify-between mb-8">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center">
                                            <Layout className="w-5 h-5 text-[#00FF95]" />
                                        </div>
                                        <div>
                                            <h2 className="text-lg font-bold text-white uppercase tracking-wide">Agency View</h2>
                                            <p className="text-xs text-white/40 uppercase tracking-wider">Select operational domain</p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setShowAgencyPicker(false)}
                                        className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    {[
                                        { id: 'cyber' as AgencyView, name: 'CYBER INTERFACE', icon: Key, desc: 'Network defense & threat monitoring', color: '#00FF95', bgColor: 'rgba(0, 255, 149, 0.1)' },
                                        { id: 'tactical' as AgencyView, name: 'TACTICAL MAP', icon: ShieldAlert, desc: 'Real-time field operations', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.1)' },
                                        { id: 'strategic' as AgencyView, name: 'STRATEGIC OPS', icon: Layout, desc: 'High-level command & control', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.1)' },
                                        { id: 'portal' as AgencyView, name: 'AGENCY PORTAL', icon: Globe, desc: 'Field agency management', color: '#00D1FF', bgColor: 'rgba(0, 209, 255, 0.1)' },
                                        { id: 'access' as AgencyView, name: 'ACCESS CONTROL', icon: Users, desc: 'Identity & permissions management', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.1)' }
                                    ].map((agency) => (
                                        <button
                                            key={agency.id}
                                            onClick={() => {
                                                updateAgencyView(agency.id);
                                                setShowAgencyPicker(false);
                                            }}
                                            disabled={!hasAccess(currentUserRole, agency.id)}
                                            className={`relative p-6 rounded-xl border transition-all group text-left ${hasAccess(currentUserRole, agency.id)
                                                ? 'border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10 cursor-pointer'
                                                : 'border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed'
                                                }`}
                                        >
                                            <div className={`absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none`} style={{ background: `radial-gradient(circle at center, ${agency.bgColor} 0%, transparent 70%)` }} />
                                            <div className="relative z-10">
                                                <div className={`w-12 h-12 rounded-lg flex items-center justify-center mb-4`} style={{ backgroundColor: agency.bgColor }}>
                                                    <agency.icon className="w-6 h-6" style={{ color: agency.color }} />
                                                </div>
                                                <h3 className="text-sm font-black text-white uppercase tracking-wider mb-1">{agency.name}</h3>
                                                <p className="text-[10px] text-white/40 uppercase tracking-wider">{agency.desc}</p>
                                            </div>
                                            {!hasAccess(currentUserRole, agency.id) && (
                                                <div className="absolute top-4 right-4 text-[8px] font-black text-white/20 uppercase tracking-widest border border-white/10 px-2 py-1 rounded">
                                                    ACCESS DENIED
                                                </div>
                                            )}
                                            {agencyView === agency.id && (
                                                <div className="absolute top-4 right-4 w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: agency.color }} />
                                            )}
                                        </button>
                                    ))}
                                </div>

                                <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
                                    <span className="text-[10px] text-white/30 uppercase tracking-widest">
                                        Current clearance: <span className="text-white/60 font-bold">{currentUserRole}</span>
                                    </span>
                                    <div className="flex items-center gap-2 text-[10px] text-[#00FF95]/60 uppercase tracking-wider">
                                        <span className="w-2 h-2 bg-[#00FF95] rounded-full animate-pulse" />
                                        System Secure
                                    </div>
                                </div>
                            </motion.div>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>

            {/* Footer Status Bar */}
            <footer className="flex-none h-10 bg-black/40 backdrop-blur-sm border-t border-white/5 flex items-center justify-between px-6 text-[10px] font-mono text-white/30 uppercase tracking-wider z-20 relative">
                <div className="flex items-center gap-6">
                    <span className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#00FF95] animate-pulse" />
                        System Operational
                    </span>
                    <span>Uptime: {currentTime?.toLocaleTimeString()}</span>
                    <span>Encrypted: AES-256</span>
                </div>
                <div className="flex items-center gap-6">
                    <span>Active Session: {user?.role}</span>
                    <span>Nodes: 8472</span>
                    <span>Integrity: {securityStatus.systemIntegrity.toFixed(1)}%</span>
                </div>
            </footer>
        </div>
    );
}

/**
 * ViewHandler Component
 * Listens for the 'view' query parameter and updates the dashboard state.
 * Wrapped in Suspense to satisfy Next.js client-side search parameter requirements.
 */
function ViewHandler({ setAgencyView, currentUserRole }: { setAgencyView: (v: AgencyView) => void, currentUserRole: string | undefined }) {
    const searchParams = useSearchParams();

    useEffect(() => {
        if (!searchParams) return;
        const view = searchParams.get('view') as AgencyView;
        if (view && hasAccess(currentUserRole, view)) {
            setAgencyView(view);
        }
    }, [searchParams, currentUserRole, setAgencyView]);

    return null;
}
