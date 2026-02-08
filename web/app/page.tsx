"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyAlertSignature, UserRole, AgencyView, hasAccess } from '../lib/auth';
import { fetchAlerts, fetchSystemStatus, Alert, SystemStatus } from '../lib/api';
import CyberDashboard from '../components/dashboards/CyberDashboard';
import TacticalDashboard from '../components/dashboards/TacticalDashboard';
import StrategicDashboard from '../components/dashboards/StrategicDashboard';
import AccessManagement from '../components/admin/AccessManagement';
import { Layout, Users, ShieldAlert, LogOut, Key, Maximize, Minimize, Settings } from 'lucide-react';
import { useAuth, User } from '../lib/AuthContext';
import Draggable from 'react-draggable';
import { AnimatePresence, motion } from 'framer-motion';
import CommandBar from '@/components/CommandBar';
import UserMenu from '@/components/UserMenu';

export default function DashboardPage() {
    const { user, logout, isLoading } = useAuth();
    // Default to GUEST or empty to prevent flashing sensitive views
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>((user?.role as UserRole) || 'AGENCY_OFFICER');
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [securityStatus, setSecurityStatus] = useState<SystemStatus>({
        isAuthenticated: false,
        isEncrypted: true,
        trustedDevices: 0
    });
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [displayMode, setDisplayMode] = useState<'dark' | 'light' | 'contrast' | 'oled' | 'terminal'>('dark');
    const [watermarkMode, setWatermarkMode] = useState<'none' | 'seal' | 'coat_of_arms'>('seal');
    const [showSettingsModal, setShowSettingsModal] = useState(false);
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [useCommandBar, setUseCommandBar] = useState(true);
    const [showAgencyPicker, setShowAgencyPicker] = useState(false);
    const draggableRef = React.useRef(null);

    // Persistence for Display & Watermark
    useEffect(() => {
        const savedTheme = localStorage.getItem('nsp_display_mode') as any;
        if (savedTheme && ['dark', 'light', 'contrast', 'oled', 'terminal'].includes(savedTheme)) {
            setDisplayMode(savedTheme);
        }

        const savedWatermark = localStorage.getItem('nsp_watermark_mode') as any;
        if (savedWatermark && ['none', 'seal', 'coat_of_arms'].includes(savedWatermark)) {
            setWatermarkMode(savedWatermark);
        }

        const savedNav = localStorage.getItem('nsp_nav_style');
        if (savedNav === 'classic') {
            setUseCommandBar(false);
        }
    }, []);

    const toggleNavStyle = (useUnified: boolean) => {
        setUseCommandBar(useUnified);
        localStorage.setItem('nsp_nav_style', useUnified ? 'unified' : 'classic');
    };

    const updateDisplayMode = (mode: 'dark' | 'light' | 'contrast' | 'oled' | 'terminal') => {
        setDisplayMode(mode);
        localStorage.setItem('nsp_display_mode', mode);
    };

    const updateWatermarkMode = (mode: 'none' | 'seal' | 'coat_of_arms') => {
        setWatermarkMode(mode);
        localStorage.setItem('nsp_watermark_mode', mode);
    };

    const router = useRouter();

    // Show loading state to prevent Render-Then-Redirect


    // Update role when user changes
    useEffect(() => {
        if (!isLoading && !user) {
            router.push('/login');
            return;
        }

        if (user?.role) {
            setCurrentUserRole(user.role as UserRole);
        } else {
            // Fallback only if still loading or verified guest (shouldn't happen with redirection)
            // But to be safe, we don't default to a privileged role like TACTICAL_COMMAND
        }
    }, [user, isLoading, router]);

    // Agency View State
    const [agencyView, setAgencyView] = useState<AgencyView>('cyber');

    // Initial view selection and enforcement
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const requestedView = params.get('view') as AgencyView;

        if (currentUserRole === 'ADMIN' && requestedView && ['cyber', 'tactical', 'strategic', 'access'].includes(requestedView)) {
            setAgencyView(requestedView);
        } else if (currentUserRole !== 'ADMIN') {
            if (currentUserRole === 'CYBER_ANALYST' || currentUserRole === 'SYSTEM_ADMIN') setAgencyView('cyber');
            else if (currentUserRole === 'STRATEGIC_PLANNER') setAgencyView('strategic');
            else if (currentUserRole === 'TACTICAL_COMMAND') setAgencyView('tactical');
            else if (currentUserRole === 'SECURITY_OFFICER') setAgencyView('access');
        }
    }, [currentUserRole]);

    // Clock update
    useEffect(() => {
        setCurrentTime(new Date());
        const interval = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(interval);
    }, []);

    // Fetch alerts
    useEffect(() => {
        const loadAlerts = async () => {
            try {
                const rawAlerts = await fetchAlerts();

                const transformedAlerts = await Promise.all(rawAlerts.map(async (a: Alert) => {
                    const mockSignature = a.priority_class === 'CRITICAL' ? 'sig_trusted_' + a.id.substring(0, 8) : 'invalid_sig';
                    return {
                        ...a,
                        signature: mockSignature,
                        isTrusted: await verifyAlertSignature(a.id, mockSignature, a.content || '')
                    };
                }));

                const systemStatus = await fetchSystemStatus();

                setAlerts(transformedAlerts);
                setSecurityStatus((prev) => ({
                    ...prev,
                    isAuthenticated: true,
                    trustedDevices: systemStatus ? systemStatus.total_users : prev.trustedDevices
                }));
            } catch (error) {
                console.error('Failed to load alerts:', error);
            }
        };

        if (user) {
            loadAlerts();
            const interval = setInterval(loadAlerts, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    // Apply Watermark to Body
    useEffect(() => {
        document.body.setAttribute('data-watermark', watermarkMode);
    }, [watermarkMode]);

    // Listen for fullscreen changes (e.g. Esc key)
    useEffect(() => {
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    // Show loading state to prevent Render-Then-Redirect
    if (isLoading) {
        return (
            <div className="w-full h-screen bg-black flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="w-12 h-12 border-4 border-slate-800 border-t-cyan-500 rounded-full animate-spin"></div>
                    <p className="text-cyan-500 font-mono text-sm animate-pulse">AUTHENTICATING...</p>
                </div>
            </div>
        );
    }

    const toggleAgencyView = (view: AgencyView) => {
        if (!hasAccess(currentUserRole, view)) return;
        setAgencyView(view);
    };

    const toggleFullscreen = () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch((err) => {
                console.error(`Error attempting to enable full-screen mode: ${err.message}`);
            });
            setIsFullscreen(true);
        } else {
            if (document.exitFullscreen) {
                document.exitFullscreen();
                setIsFullscreen(false);
            }
        }
    };

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Unified Command Bar - Only for System Admin or Higher */}
            {/* Unified Command Bar - Only for System Admin or Higher */}
            {useCommandBar ? (
                <CommandBar
                    agencyName="SITUATION ROOM"
                    userRole={user?.role || 'GUEST'}
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
                />
            ) : (
                /* Legacy Floating Capsule Navigation */
                <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[110] flex items-center">
                    <div className="flex items-center bg-black/80 border-b border-x border-white/20 rounded-b-xl backdrop-blur-md px-1 py-1 shadow-2xl">
                        {/* View Picker Toggle */}
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

                        {/* Global Settings */}
                        <button
                            onClick={() => setShowSettingsModal(!showSettingsModal)}
                            className={`h-7 w-8 rounded-lg flex items-center justify-center transition-all group ${showSettingsModal ? 'bg-[#00FF95]/20 text-[#00FF95]' : 'text-white/40 hover:text-white hover:bg-white/10'}`}
                            title="Global Environment Settings"
                        >
                            <Settings className="w-3.5 h-3.5" />
                        </button>

                        <div className="w-px h-4 bg-white/10 mx-1" />

                        {/* Fullscreen Toggle */}
                        <button
                            onClick={toggleFullscreen}
                            className="h-7 w-8 hover:bg-white/10 rounded-lg flex items-center justify-center text-white/40 hover:text-white transition-all group"
                            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                        >
                            {isFullscreen ? (
                                <Minimize className="w-3.5 h-3.5" />
                            ) : (
                                <Maximize className="w-3.5 h-3.5" />
                            )}
                        </button>

                        {/* Global Logout */}
                        <button
                            onClick={logout}
                            className="h-7 w-8 hover:bg-red-500/20 rounded-lg flex items-center justify-center text-white/40 hover:text-red-400 transition-all group"
                            title="Secure Logout"
                        >
                            <LogOut className="w-3.5 h-3.5" />
                        </button>
                    </div>
                </div>
            )}

            <UserMenu
                user={user}
                onLogout={logout}
                showMenu={showUserMenu}
            />

            {/* Global Environment Settings Modal */}
            <AnimatePresence>
                {showSettingsModal && (
                    <motion.div
                        initial={{ opacity: 0, y: -20, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%' }}
                        className="fixed top-14 left-1/2 z-[110] w-[400px] glass-contrast rounded-xl border border-[#00FF95]/30 p-6 shadow-2xl backdrop-blur-xl"
                    >
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-2">
                                <Settings className="w-4 h-4 text-[#00FF95]" />
                                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Registry Environment Config</h3>
                            </div>
                            <button onClick={() => setShowSettingsModal(false)} className="text-white/40 hover:text-white">✕</button>
                        </div>

                        <div className="space-y-6">
                            {/* Theme Selection */}
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
                                            className={`h-10 rounded border flex flex-col items-center justify-center transition-all ${displayMode === theme.id ? 'border-[#00FF95] bg-[#00FF95]/10' : 'border-white/10 hover:border-white/20'}`}
                                        >
                                            <div className="w-3 h-3 rounded-full mb-1" style={{ backgroundColor: theme.color, border: '1px solid white' }} />
                                            <span className="text-[7px] font-black text-white/60 uppercase">{theme.id}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Watermark Selection */}
                            <div>
                                <h4 className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-3">Background Identity</h4>
                                <div className="grid grid-cols-3 gap-2">
                                    {[
                                        { id: 'none', label: 'NONE' },
                                        { id: 'seal', label: 'COMMISSION SEAL' },
                                        { id: 'coat_of_arms', label: 'COAT OF ARMS' }
                                    ].map(wm => (
                                        <button
                                            key={wm.id}
                                            onClick={() => updateWatermarkMode(wm.id as any)}
                                            className={`py-3 rounded border transition-all ${watermarkMode === wm.id ? 'border-[#00FF95] bg-[#00FF95]/10 text-[#00FF95]' : 'border-white/10 text-white/40 hover:text-white/60'}`}
                                        >
                                            <span className="text-[8px] font-black uppercase tracking-tighter">{wm.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="pt-4 border-t border-white/5">
                                <p className="text-[7px] text-white/20 uppercase tracking-[0.3em] text-center">National Security Platform // Environment V2.0</p>
                            </div>

                            {/* Navigation Style Toggle */}
                            <div>
                                <h4 className="text-[8px] font-black text-white/40 uppercase tracking-widest mb-3">Navigation Style</h4>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => toggleNavStyle(true)}
                                        className={`flex-1 py-3 rounded border transition-all ${useCommandBar ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-white/10 text-white/40 hover:text-white/60'}`}
                                    >
                                        <span className="text-[8px] font-black uppercase tracking-tighter">UNIFIED BAR</span>
                                    </button>
                                    <button
                                        onClick={() => toggleNavStyle(false)}
                                        className={`flex-1 py-3 rounded border transition-all ${!useCommandBar ? 'border-blue-500 bg-blue-600/10 text-blue-400' : 'border-white/10 text-white/40 hover:text-white/60'}`}
                                    >
                                        <span className="text-[8px] font-black uppercase tracking-tighter">CAPSULE</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* View Switcher UI - Legacy Capsule Mode */}
            {!useCommandBar && showAgencyPicker && ['ADMIN', 'SYSTEM_ADMIN', 'SECURITY_OFFICER'].includes(user?.role || '') && (
                <div className="fixed top-12 left-1/2 -translate-x-1/2 z-[110] bg-black/90 border border-white/20 rounded-xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-200">
                    <div className="flex items-center gap-4 text-white">
                        <button
                            disabled={!hasAccess(currentUserRole, 'cyber')}
                            onClick={() => { setAgencyView('cyber'); setShowAgencyPicker(false); }}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${!hasAccess(currentUserRole, 'cyber') ? 'opacity-30 cursor-not-allowed border-transparent text-white/40' : agencyView === 'cyber' ? 'bg-[#00FF95]/20 border-[#00FF95] text-[#00FF95]' : 'border-transparent hover:bg-white/10 text-white/60 hover:text-white'}`}
                        >
                            <Layout className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase">Cyber</span>
                            {!hasAccess(currentUserRole, 'cyber') && <span className="text-[9px] text-red-400">LOCKED</span>}
                        </button>
                        <button
                            disabled={!hasAccess(currentUserRole, 'tactical')}
                            onClick={() => { setAgencyView('tactical'); setShowAgencyPicker(false); }}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${!hasAccess(currentUserRole, 'tactical') ? 'opacity-30 cursor-not-allowed border-transparent text-white/40' : agencyView === 'tactical' ? 'bg-white text-black border-white' : 'border-transparent hover:bg-white/10 text-white/60 hover:text-white'}`}
                        >
                            <Layout className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase">Tactical</span>
                            {!hasAccess(currentUserRole, 'tactical') && <span className="text-[9px] text-red-400">LOCKED</span>}
                        </button>
                        <button
                            disabled={!hasAccess(currentUserRole, 'strategic')}
                            onClick={() => { setAgencyView('strategic'); setShowAgencyPicker(false); }}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${!hasAccess(currentUserRole, 'strategic') ? 'opacity-30 cursor-not-allowed border-transparent text-white/40' : agencyView === 'strategic' ? 'bg-blue-600 border-blue-500 text-white' : 'border-transparent hover:bg-white/10 text-white/60 hover:text-white'}`}
                        >
                            <Layout className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase">Strategic</span>
                            {!hasAccess(currentUserRole, 'strategic') && <span className="text-[9px] text-red-400">LOCKED</span>}
                        </button>
                        <button
                            disabled={!hasAccess(currentUserRole, 'access')}
                            onClick={() => { setAgencyView('access'); setShowAgencyPicker(false); }}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${!hasAccess(currentUserRole, 'access') ? 'opacity-30 cursor-not-allowed border-transparent text-white/40' : agencyView === 'access' ? 'bg-[#00FF95] text-black border-[#00FF95]' : 'border-transparent hover:bg-white/10 text-white/60 hover:text-white'}`}
                        >
                            <Key className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase">Access</span>
                            {!hasAccess(currentUserRole, 'access') && <span className="text-[9px] text-red-400">LOCKED</span>}
                        </button>
                    </div>

                    {/* Admin Portal Tool */}
                    {currentUserRole === 'ADMIN' && (
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
                            <a
                                href="/agency/portal"
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-lg text-white font-bold text-xs uppercase transition-all hover:scale-105 shadow-lg shadow-blue-500/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>
                                Agency Command Portal
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Debug Role Switcher - System Admin Only */}
            {user?.role === 'ADMIN' && (
                <Draggable nodeRef={draggableRef}>
                    <div ref={draggableRef} className="fixed bottom-20 right-4 z-[110] group cursor-move">
                        <div className="bg-black/80 backdrop-blur border border-white/20 p-2 rounded-lg flex items-center gap-2 hover:bg-black transition-colors">
                            <ShieldAlert className="w-4 h-4 text-yellow-500" />
                            <span className="text-xs font-mono text-white/60 uppercase">System Admin Context:</span>
                            <select
                                value={currentUserRole}
                                onChange={(e) => {
                                    const newRole = e.target.value as UserRole;
                                    setCurrentUserRole(newRole);
                                    // Auto-switch if current view is lost
                                    if (!hasAccess(newRole, agencyView)) {
                                        if (hasAccess(newRole, 'tactical')) setAgencyView('tactical');
                                        else if (hasAccess(newRole, 'strategic')) setAgencyView('strategic');
                                        else if (hasAccess(newRole, 'cyber')) setAgencyView('cyber');
                                        else if (hasAccess(newRole, 'access')) setAgencyView('access');
                                    }
                                }}
                                className="bg-transparent text-yellow-500 text-xs font-bold uppercase outline-none cursor-pointer"
                            >
                                <option value="TACTICAL_COMMAND">Tactical</option>
                                <option value="CYBER_ANALYST">Cyber Analyst</option>
                                <option value="STRATEGIC_PLANNER">Strategic</option>
                                <option value="AGENCY_OFFICER">Agency Officer</option>
                                <option value="SYSTEM_ADMIN">System Admin</option>
                                <option value="SECURITY_OFFICER">Security Officer</option>
                                <option value="ADMIN">Super Admin</option>
                            </select>
                        </div>
                    </div>
                </Draggable>
            )}

            {/* View Container with Access Enforcement */}
            <div className="w-full h-full">
                {!hasAccess(currentUserRole, agencyView) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-transparent p-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-8 animate-pulse">
                            <ShieldAlert className="w-10 h-10 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-black text-white uppercase tracking-[0.2em] mb-4">Access Restricted</h2>
                        <p className="text-white/40 max-w-md leading-relaxed mb-8 font-medium">
                            Your current clearance level ({currentUserRole}) does not permit access to the {agencyView} View.
                        </p>
                        {currentUserRole === 'AGENCY_OFFICER' ? (
                            <a
                                href="/agency/portal"
                                className="px-8 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all hover:scale-105 shadow-xl shadow-blue-600/20 uppercase tracking-widest text-xs"
                            >
                                Enter Agency Command Portal
                            </a>
                        ) : (
                            <button
                                onClick={logout}
                                className="px-8 py-3 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all border border-white/10"
                            >
                                Terminate Session
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {agencyView === 'cyber' && (
                            <CyberDashboard
                                alerts={alerts}
                                currentTime={currentTime}
                                securityStatus={securityStatus}
                                user={user}
                                logout={logout}
                                displayMode={displayMode}
                                setDisplayMode={updateDisplayMode}
                            />
                        )}
                        {agencyView === 'tactical' && (
                            <TacticalDashboard
                                alerts={alerts}
                                currentTime={currentTime}
                                securityStatus={securityStatus}
                                user={user}
                                logout={logout}
                                displayMode={displayMode}
                                setDisplayMode={updateDisplayMode}
                            />
                        )}
                        {agencyView === 'strategic' && (
                            <StrategicDashboard
                                alerts={alerts}
                                currentTime={currentTime}
                                securityStatus={securityStatus}
                                user={user}
                                logout={logout}
                                displayMode={displayMode}
                                setDisplayMode={updateDisplayMode}
                            />
                        )}
                        {agencyView === 'access' && (
                            <AccessManagement
                                displayMode={displayMode}
                                setDisplayMode={updateDisplayMode}
                                watermarkMode={watermarkMode}
                                setWatermarkMode={updateWatermarkMode}
                            />
                        )}
                    </>
                )}
            </div>
        </div >
    );
}

