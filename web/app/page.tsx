"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { verifyAlertSignature, UserRole, AgencyView, hasAccess } from '../lib/auth';
import { fetchAlerts, fetchSystemStatus, Alert, SystemStatus } from '../lib/api';
import CyberDashboard from '../components/dashboards/CyberDashboard';
import TacticalDashboard from '../components/dashboards/TacticalDashboard';
import StrategicDashboard from '../components/dashboards/StrategicDashboard';
import AccessManagement from '../components/admin/AccessManagement';
import { Layout, Users, ShieldAlert, LogOut, Key, Maximize, Minimize } from 'lucide-react';
import { useAuth, User } from '../lib/AuthContext';
import Draggable from 'react-draggable';

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
    const [showAgencyPicker, setShowAgencyPicker] = useState(false);

    // Initial view selection and enforcement
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const requestedView = params.get('view') as AgencyView;

        if (currentUserRole === 'ADMIN' && requestedView && ['cyber', 'tactical', 'strategic'].includes(requestedView)) {
            setAgencyView(requestedView);
        } else if (currentUserRole !== 'ADMIN') {
            if (currentUserRole === 'CYBER_ANALYST') setAgencyView('cyber');
            else if (currentUserRole === 'STRATEGIC_PLANNER') setAgencyView('strategic');
            else if (currentUserRole === 'TACTICAL_COMMAND') setAgencyView('tactical');
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
        setShowAgencyPicker(false);
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
            <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[110] flex items-center">
                <div className="flex items-center bg-black/80 border-b border-x border-white/20 rounded-b-xl backdrop-blur-md px-1 py-1 shadow-2xl">
                    {/* View Picker Toggle */}
                    {user?.role === 'ADMIN' && (
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

            {/* View Switcher UI - Controlled by Admin check */}
            {showAgencyPicker && user?.role === 'ADMIN' && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[110] bg-black/90 border border-white/20 rounded-xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-200">
                    <div className="flex items-center gap-4 text-white">
                        <button
                            disabled={!hasAccess(currentUserRole, 'cyber')}
                            onClick={() => toggleAgencyView('cyber')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${!hasAccess(currentUserRole, 'cyber') ? 'opacity-30 cursor-not-allowed border-transparent text-white/40' : agencyView === 'cyber' ? 'bg-[#00FF95]/20 border-[#00FF95] text-[#00FF95]' : 'border-transparent hover:bg-white/10 text-white/60 hover:text-white'}`}
                        >
                            <Layout className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase">Cyber</span>
                            {!hasAccess(currentUserRole, 'cyber') && <span className="text-[9px] text-red-400">LOCKED</span>}
                        </button>
                        <button
                            disabled={!hasAccess(currentUserRole, 'tactical')}
                            onClick={() => toggleAgencyView('tactical')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${!hasAccess(currentUserRole, 'tactical') ? 'opacity-30 cursor-not-allowed border-transparent text-white/40' : agencyView === 'tactical' ? 'bg-white text-black border-white' : 'border-transparent hover:bg-white/10 text-white/60 hover:text-white'}`}
                        >
                            <Layout className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase">Tactical</span>
                            {!hasAccess(currentUserRole, 'tactical') && <span className="text-[9px] text-red-400">LOCKED</span>}
                        </button>
                        <button
                            disabled={!hasAccess(currentUserRole, 'strategic')}
                            onClick={() => toggleAgencyView('strategic')}
                            className={`flex flex-col items-center gap-2 p-3 rounded-lg border transition-all ${!hasAccess(currentUserRole, 'strategic') ? 'opacity-30 cursor-not-allowed border-transparent text-white/40' : agencyView === 'strategic' ? 'bg-blue-600 border-blue-500 text-white' : 'border-transparent hover:bg-white/10 text-white/60 hover:text-white'}`}
                        >
                            <Layout className="w-6 h-6" />
                            <span className="text-xs font-bold uppercase">Strategic</span>
                            {!hasAccess(currentUserRole, 'strategic') && <span className="text-[9px] text-red-400">LOCKED</span>}
                        </button>
                        <button
                            disabled={!hasAccess(currentUserRole, 'access')}
                            onClick={() => toggleAgencyView('access')}
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
                <Draggable>
                    <div className="fixed bottom-20 right-4 z-[110] group cursor-move">
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
                    <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] p-8 text-center">
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
                            />
                        )}
                        {agencyView === 'tactical' && (
                            <TacticalDashboard
                                alerts={alerts}
                                currentTime={currentTime}
                                securityStatus={securityStatus}
                                user={user}
                                logout={logout}
                            />
                        )}
                        {agencyView === 'strategic' && (
                            <StrategicDashboard
                                alerts={alerts}
                                currentTime={currentTime}
                                securityStatus={securityStatus}
                                user={user}
                                logout={logout}
                            />
                        )}
                        {agencyView === 'access' && (
                            <AccessManagement />
                        )}
                    </>
                )}
            </div>
        </div >
    );
}

