"use client";

import React, { useState, useEffect } from 'react';
import { verifyAlertSignature, UserRole, AgencyView, hasAccess } from '../lib/auth';
import { fetchAlerts, fetchSystemStatus, Alert as ApiAlert } from '../lib/api';
import CyberDashboard from '../components/dashboards/CyberDashboard';
import TacticalDashboard from '../components/dashboards/TacticalDashboard';
import StrategicDashboard from '../components/dashboards/StrategicDashboard';
import { Layout, Users, ShieldAlert, LogOut } from 'lucide-react';
import { useAuth } from '../lib/AuthContext';

export default function DashboardPage() {
    const { user, logout } = useAuth();
    const [currentUserRole, setCurrentUserRole] = useState<UserRole>((user?.role as UserRole) || 'TACTICAL_COMMAND');
    const [alerts, setAlerts] = useState<any[]>([]);
    const [currentTime, setCurrentTime] = useState<Date | null>(null);
    const [securityStatus, setSecurityStatus] = useState({
        isAuthenticated: false,
        isEncrypted: true,
        trustedDevices: 0
    });

    // Update role when user changes
    useEffect(() => {
        if (user?.role) {
            setCurrentUserRole(user.role as UserRole);
        }
    }, [user]);

    // Agency View State
    const [agencyView, setAgencyView] = useState<AgencyView>('cyber');
    const [showAgencyPicker, setShowAgencyPicker] = useState(false);

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

                const transformedAlerts = await Promise.all(rawAlerts.map(async (a: ApiAlert) => {
                    const mockSignature = a.priority_class === 'CRITICAL' ? 'sig_trusted_' + a.id.substring(0, 8) : 'invalid_sig';
                    return {
                        ...a,
                        signature: mockSignature,
                        isTrusted: await verifyAlertSignature(a.id, mockSignature, a.content || '')
                    };
                }));

                const systemStatus = await fetchSystemStatus();

                setAlerts(transformedAlerts);
                setSecurityStatus(prev => ({
                    ...prev,
                    isAuthenticated: true,
                    trustedDevices: systemStatus ? systemStatus.total_users : prev.trustedDevices
                }));
            } catch (error) {
                console.error('Failed to load alerts:', error);
            }
        };

        loadAlerts();
        const interval = setInterval(loadAlerts, 10000);
        return () => clearInterval(interval);
    }, []);

    const toggleAgencyView = (view: AgencyView) => {
        if (!hasAccess(currentUserRole, view)) return;
        setAgencyView(view);
        setShowAgencyPicker(false);
    };

    return (
        <div className="relative w-full h-screen overflow-hidden">
            {/* Agency View Switcher - Visible Tab */}
            <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] group">
                <button
                    className="h-8 px-6 bg-black/80 border-b border-x border-white/20 hover:border-[#00FF95] rounded-b-lg flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md transition-all hover:bg-black"
                    onClick={() => setShowAgencyPicker(!showAgencyPicker)}
                >
                    <div className="w-1.5 h-1.5 rounded-full bg-[#00FF95] animate-pulse" />
                    <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest group-hover:text-[#00FF95]">
                        {agencyView} VIEW
                    </span>
                    <div className="w-0 h-0 border-l-[3px] border-l-transparent border-t-[4px] border-t-white/60 border-r-[3px] border-r-transparent group-hover:border-t-[#00FF95]" />
                </button>
            </div>

            {/* Logout Button - Top Right */}
            <div className="fixed top-4 right-4 z-[100]">
                <button
                    onClick={logout}
                    className="h-10 w-10 bg-black/40 hover:bg-red-500/20 border border-white/10 hover:border-red-500/50 rounded-xl flex items-center justify-center text-white/60 hover:text-red-400 backdrop-blur-md transition-all group"
                    title="Logout / Terminate Session"
                >
                    <LogOut className="w-5 h-5 transition-transform group-hover:scale-110" />
                </button>
            </div>

            {/* View Switcher UI */}
            {showAgencyPicker && (
                <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] bg-black/90 border border-white/20 rounded-xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-200">
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
                    </div>

                    {/* Admin Tools */}
                    {currentUserRole === 'ADMIN' && (
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-center">
                            <a
                                href="/agency/portal"
                                className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 rounded-lg text-white font-bold text-xs uppercase transition-all hover:scale-105 shadow-lg shadow-purple-500/20"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z" /><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2" /><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2" /><path d="M10 6h4" /><path d="M10 10h4" /><path d="M10 14h4" /><path d="M10 18h4" /></svg>
                                Agency Command Portal
                            </a>
                        </div>
                    )}
                </div>
            )}

            {/* Debug Role Switcher (Bottom Right) */}
            <div className="fixed bottom-4 right-4 z-[100] group">
                <div className="bg-black/80 backdrop-blur border border-white/20 p-2 rounded-lg flex items-center gap-2 hover:bg-black transition-colors">
                    <ShieldAlert className="w-4 h-4 text-yellow-500" />
                    <span className="text-xs font-mono text-white/60 uppercase">Role:</span>
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
                            }
                        }}
                        className="bg-transparent text-yellow-500 text-xs font-bold uppercase outline-none cursor-pointer"
                    >
                        <option value="TACTICAL_COMMAND">Tactical</option>
                        <option value="CYBER_ANALYST">Cyber Analyst</option>
                        <option value="STRATEGIC_PLANNER">Strategic</option>
                        <option value="ADMIN">Admin</option>
                    </select>
                </div>
            </div>

            {/* View Container */}
            <div className="w-full h-full">
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
            </div>
        </div >
    );
}

