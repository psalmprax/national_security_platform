"use client";

import React from 'react';
import { PieChart, FileText, Activity, Shield, TrendingUp, ShieldAlert, Bell, User as UserIcon } from 'lucide-react';
import { getIncidentTrends, getThreatDistribution, Alert, SystemStatus } from '../../lib/api';
import { User } from '../../lib/AuthContext';
import SafetyLeaderboard from '../analytics/SafetyLeaderboard';

interface StrategicDashboardProps {
    alerts: Alert[];
    currentTime: Date | null;
    securityStatus: SystemStatus;
    user: User | null;
    logout: () => void;
    displayMode: 'dark' | 'light' | 'contrast' | 'oled' | 'terminal';
    setDisplayMode: (mode: 'dark' | 'light' | 'contrast' | 'oled' | 'terminal') => void;
}

export default function StrategicDashboard({ alerts, currentTime, securityStatus, user, logout, displayMode, setDisplayMode }: StrategicDashboardProps) {
    const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const [activeView, setActiveView] = React.useState<'overview' | 'profile' | 'registry' | 'analytics'>('overview');
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [notifications, setNotifications] = React.useState([
        { message: "System initialized. Secure connection established.", timestamp: new Date(), type: 'system' }
    ]);

    const criticalCount = (alerts || []).filter(a => a.severity > 0.8).length;
    const trends = getIncidentTrends(alerts || []);
    const distribution = getThreatDistribution(alerts || []);
    // Unused variables for now, but keeping for future chart expansion
    // const urgentCount = alerts.filter(a => a.severity > 0.6 && a.severity <= 0.8).length;
    // const routineCount = alerts.filter(a => a.severity <= 0.6).length;
    const isAlertRedacted = (alert: Alert | null): boolean => {
        if (!alert) return false;
        return (
            (alert.content || '').includes('[REDACTED') ||
            (alert.priority_class === 'CRITICAL' && alert.isEncrypted === true) ||
            alert.isDuress === true
        );
    };

    return (
        <div className="w-full h-full bg-transparent text-slate-900 border-none overflow-auto font-sans" data-theme={displayMode}>
            {/* Top Navigation Bar */}
            <nav className="h-16 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-slate-200 dark:border-white/10 flex items-center justify-between px-8 shadow-sm">
                <div className="flex items-center gap-3">
                    <div
                        onClick={() => setActiveView('overview')}
                        className="bg-blue-600 p-1.5 rounded-lg text-white cursor-pointer hover:bg-blue-500 transition-all shadow-lg shadow-blue-500/20"
                    >
                        <Activity className="w-5 h-5" />
                    </div>
                    <span
                        onClick={() => setActiveView('overview')}
                        className="font-black text-lg text-slate-900 dark:text-white tracking-widest uppercase cursor-pointer"
                    >
                        National Security Overview
                    </span>
                </div>
                <div className="flex items-center gap-6 text-sm text-slate-500">
                    <button
                        onClick={() => setActiveView('overview')}
                        className={`font-medium px-3 py-1 rounded transition-colors cursor-pointer ${activeView === 'overview' ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700 hover:bg-slate-50'}`}
                    >
                        Reports
                    </button>
                    <button
                        onClick={() => setActiveView('analytics')}
                        className={`font-medium px-3 py-1 rounded transition-colors cursor-pointer ${activeView === 'analytics' ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700 hover:bg-slate-50'}`}
                    >
                        Analytics
                    </button>
                    <button
                        onClick={() => setActiveView('registry')}
                        className={`font-medium px-3 py-1 rounded transition-colors cursor-pointer ${activeView === 'registry' ? 'text-blue-700 bg-blue-50' : 'hover:text-blue-700 hover:bg-slate-50'}`}
                    >
                        Agencies
                    </button>
                    <div className="h-4 w-px bg-slate-300 mx-2" />
                    <div className="relative group">
                        <Bell
                            onClick={() => setShowNotifications(!showNotifications)}
                            className={`w-5 h-5 transition-colors cursor-pointer ${showNotifications ? 'text-blue-700' : 'text-slate-500 hover:text-blue-700'
                                }`}
                        />
                        <div className="absolute left-full ml-3 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Notifications
                        </div>
                    </div>
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all uppercase cursor-pointer ${showUserMenu ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-900 bg-blue-900 text-white hover:ring-4 hover:ring-blue-100'}`}
                        >
                            <UserIcon className="w-4 h-4" />
                        </button>

                        {showUserMenu && (
                            <div className="absolute top-12 right-0 w-64 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 z-50 animate-in slide-in-from-top-2 fade-in duration-200">
                                <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-100">
                                    <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-900">
                                        <Shield className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <p className="text-slate-900 font-bold text-sm tracking-tight">{user?.full_name || 'Anonymous'}</p>
                                        <p className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">{user?.role || 'Guest'}</p>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <button
                                        onClick={() => {
                                            setActiveView('profile');
                                            setShowUserMenu(false);
                                        }}
                                        className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all font-medium cursor-pointer ${activeView === 'profile' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'}`}
                                    >
                                        Account Settings
                                    </button>
                                    <button
                                        onClick={() => {
                                            setActiveView('registry');
                                            setShowUserMenu(false);
                                        }}
                                        className={`w-full text-left text-xs px-3 py-2 rounded-lg transition-all font-medium cursor-pointer ${activeView === 'registry' ? 'text-blue-700 bg-blue-50' : 'text-slate-600 hover:text-blue-700 hover:bg-slate-50'}`}
                                    >
                                        Agency Profile
                                    </button>
                                    <button
                                        onClick={logout}
                                        className="w-full text-left text-xs text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-all font-bold mt-2 cursor-pointer"
                                    >
                                        Terminate Session
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </nav>

            <main className="p-8 max-w-7xl mx-auto">
                {/* Executive Summary Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Executive Summary</h1>
                    <p className="text-slate-500 dark:text-white/40 font-mono text-xs uppercase font-bold">
                        Overview as of {currentTime?.toLocaleString()}
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="glass-card-premium p-6 flex flex-col hover:scale-[1.02]">
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-white/40 mb-2 tracking-[0.2em]">Total Incidents</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{(alerts || []).length}</span>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">▲ {trends[11]} recent</span>
                        </div>
                    </div>
                    <div className="glass-card-premium p-6 flex flex-col relative overflow-hidden group hover:scale-[1.02]">
                        <div className={`absolute top-0 right-0 w-1 h-full ${criticalCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-200/20'}`} />
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-white/40 mb-2 tracking-[0.2em]">Critical Threats</span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-black ${criticalCount > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{criticalCount}</span>
                            {criticalCount > 0 && <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-tighter">Action Required</span>}
                        </div>
                    </div>
                    <div className="glass-card-premium p-6 flex flex-col hover:scale-[1.02]">
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-white/40 mb-2 tracking-[0.2em]">Active Agents</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{securityStatus.trustedDevices ?? 0}</span>
                            <span className="text-[10px] font-bold text-emerald-500 uppercase">● Online</span>
                        </div>
                    </div>
                    <div className="glass-card-premium p-6 flex flex-col hover:scale-[1.02]">
                        <span className="text-[10px] font-black uppercase text-slate-400 dark:text-white/40 mb-2 tracking-[0.2em]">System Integrity</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-900 dark:text-white">{(alerts || []).length > 0 ? (100 - (criticalCount / (alerts || []).length * 20)).toFixed(1) : '100'}%</span>
                            <Shield className="w-5 h-5 text-blue-500 ml-auto" />
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                {activeView === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Charts Area */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="glass-card-premium p-6 min-h-[400px]">
                                <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                                    <Activity className="w-4 h-4 text-blue-500" />
                                    Incident Trend Analysis (Last 12 Hours)
                                </h3>
                                {/* Dynamic Chart Visualization */}
                                <div className="w-full h-64 flex items-end justify-between gap-2 px-4 py-4 border-b border-l border-slate-200/20">
                                    {trends.map((h, i) => (
                                        <div
                                            key={i}
                                            className={`w-full rounded-t transition-all duration-700 relative group cursor-pointer
                                                ${h > 80 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : h > 50 ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'}
                                            `}
                                            style={{ height: `${Math.max(h, 5)}%` }}
                                        >
                                            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/10">
                                                {Math.round(h)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-[10px] font-black text-slate-400 dark:text-white/20 mt-4 px-2 uppercase tracking-[0.2em]">
                                    <span>T-12H</span>
                                    <span>T-6H</span>
                                    <span className="text-blue-500 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-ping" /> LIVE_INTELLIGENCE</span>
                                </div>
                            </div>

                            <div className="glass-card-premium p-6">
                                <h3 className="font-black text-slate-900 dark:text-white mb-4 uppercase text-xs tracking-widest">Recent Logs</h3>
                                <div className="divide-y divide-slate-200/10">
                                    {(alerts || []).length === 0 ? (
                                        <p className="py-4 text-slate-400 dark:text-white/20 text-[10px] font-bold uppercase italic tracking-widest text-center">No intelligence records found</p>
                                    ) : (
                                        (alerts || []).slice(0, 3).map(alert => (
                                            <div key={alert.id} className="py-4 flex items-center justify-between group cursor-default">
                                                <div className="flex items-center gap-4">
                                                    <div className={`p-2.5 rounded-xl transition-all ${alert.severity > 0.8 ? 'bg-red-500/10 text-red-500 border border-red-500/20' :
                                                        alert.severity > 0.6 ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                                                        }`}>
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1.5">
                                                            {isAlertRedacted(alert) ? (
                                                                <span className="text-red-500 font-black uppercase tracking-widest text-[10px] glow-red">!!! CLASSIFIED_INTEL !!!</span>
                                                            ) : (
                                                                `SIGINT: #${alert.id.substring(0, 8)}`
                                                            )}
                                                        </p>
                                                        <p className="text-[10px] text-slate-500 dark:text-white/30 uppercase font-bold tracking-widest font-mono">
                                                            {isAlertRedacted(alert) ? 'SOURCE_ENCRYPTED' : alert.type.replace(/_/g, ' ')} • {new Date(alert.timestamp).toLocaleTimeString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedAlert(alert)}
                                                    className="text-[9px] font-black text-blue-500 dark:text-blue-400 border border-blue-500/20 px-4 py-1.5 rounded-lg hover:bg-blue-500/10 transition-all uppercase tracking-widest"
                                                >
                                                    View Trace
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar - Breakdown */}
                        <div className="space-y-8">
                            <div className="glass-card-premium p-6 flex-1">
                                <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                                    <TrendingUp className="w-4 h-4 text-blue-500" />
                                    Threat Composition
                                </h3>
                                <div className="space-y-5">
                                    {(distribution || []).length === 0 ? (
                                        <p className="text-[10px] font-bold text-slate-400 dark:text-white/20 italic uppercase tracking-widest text-center">Insufficient telemetry for analysis</p>
                                    ) : (
                                        (distribution || []).map((item: any, idx: number) => (
                                            <div key={idx} className="space-y-2">
                                                <div className="flex justify-between text-[9px] font-black uppercase tracking-[0.1em]">
                                                    <span className="text-slate-600 dark:text-white/60">{item.name.replace(/_/g, ' ')}</span>
                                                    <span className="text-slate-900 dark:text-white">{Math.round(item.percentage)}%</span>
                                                </div>
                                                <div className="w-full h-1.5 bg-slate-200/20 dark:bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${item.name.toLowerCase().includes('cyber') ? 'bg-blue-500 glow-blue' :
                                                            item.name.toLowerCase().includes('physical') ? 'bg-amber-500 glow-yellow' :
                                                                'bg-slate-500'
                                                            }`}
                                                        style={{ width: `${item.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/10">
                                    <div className="text-[10px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em] mb-4 font-mono">Strategic Advisory</div>
                                    <div className="p-4 bg-blue-500/10 rounded-xl border border-blue-500/20 shadow-inner">
                                        <p className="text-xs text-blue-900 dark:text-blue-300 leading-relaxed font-bold font-mono">
                                            {criticalCount > 2 ? '⚠️ HIGH_ALERT:' : '✓ OPS_NOMINAL:'} telemetry suggests {criticalCount > 2 ? 'uncontained' : 'contained'} risk. Recommend surveillance increase in {((alerts || [])[0] && isAlertRedacted(alerts[0])) ? 'REDACTED_SECTORS' : ((alerts || [])[0]?.location || 'ALL_NODES')}.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-900 p-6 rounded-xl text-white shadow-lg">
                                <h3 className="font-bold mb-2">System Status</h3>
                                <p className="text-blue-200 text-sm mb-4">All systems operational. Network grid stability is optimal.</p>
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="opacity-70">Latency</span>
                                        <span className="font-mono font-bold">18ms</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="opacity-70">Uptime</span>
                                        <span className="font-mono font-bold">99.99%</span>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="opacity-70">Active Nodes</span>
                                        <span className="font-mono font-bold">{securityStatus.trustedDevices ?? 0}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'profile' && (
                    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                        <div className="glass-card-premium p-12 overflow-hidden relative">
                            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />
                            <div className="flex items-center gap-8 mb-12 pb-12 border-b border-white/10">
                                <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-[0_0_30px_rgba(37,99,235,0.4)]">
                                    {user?.full_name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{user?.full_name || 'Administrator'}</h1>
                                    <div className="flex items-center gap-4">
                                        <span className="bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-lg border border-blue-500/20">
                                            Primary Authority
                                        </span>
                                        <span className="text-slate-400 dark:text-white/20 text-[10px] font-black uppercase tracking-widest font-mono">NODE_IDENTITY: {user?.id || 'AUTH_GATEWAY_03'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em] mb-4">Functional Role</h3>
                                        <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.role || 'Strategic Intelligence Officer'}</p>
                                        <p className="text-xs text-slate-500 dark:text-white/40 mt-2 font-medium italic">Overseeing national security metrics and cross-agency intelligence coordination.</p>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em] mb-4">Authorized Clearance</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['STRAT_VIEW', 'AGENCY_MGMT', 'BIO_AUTH', 'LEGAL_AUDIT'].map((p, i) => (
                                                <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-white/60 bg-white/5 p-3 rounded-lg border border-white/10 group hover:border-blue-500/30 transition-all">
                                                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                                    {p}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-blue-500/5 p-8 rounded-2xl border border-blue-500/10 relative">
                                    <Shield className="w-8 h-8 text-blue-500 mb-4 opacity-50" />
                                    <h3 className="font-black text-slate-900 dark:text-white mb-2 uppercase text-xs tracking-widest">Account Security</h3>
                                    <p className="text-xs text-slate-500 dark:text-white/40 mb-8 leading-relaxed font-medium">Your account is protected by hardware-bound PKI and multi-factor biometric authentication.</p>
                                    <div className="space-y-4">
                                        <p className="text-slate-400 dark:text-white/20 text-[9px] font-black mb-2 uppercase tracking-[0.2em] font-mono">Platform Integrity Score</p>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-1">
                                            <span className="text-slate-500 dark:text-white/40">Auth Level</span>
                                            <span className="text-blue-500">98% SECURE</span>
                                        </div>
                                        <div className="w-full h-2 bg-black/20 dark:bg-white/5 rounded-full overflow-hidden border border-white/5">
                                            <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-[98%] shadow-[0_0_15px_rgba(37,99,235,0.3)]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'registry' && (
                    <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                        <div className="glass-card-premium overflow-hidden">
                            <div className="px-8 py-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                                <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Agency Node Registry</h1>
                                <span className="bg-blue-500/10 text-blue-500 text-[9px] font-black uppercase px-4 py-1.5 rounded-lg border border-blue-500/20 tracking-widest">
                                    Verified Nodes: {securityStatus.trustedDevices}
                                </span>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-white/5 border-b border-white/10">
                                    <tr className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">
                                        <th className="px-8 py-5">Agency Designation</th>
                                        <th className="px-8 py-5">Operational Status</th>
                                        <th className="px-8 py-5">Network Latency</th>
                                        <th className="px-8 py-5 text-right">Certificate ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {[
                                        { id: 'LAGOS_HQ_GATEWAY', status: 'ONLINE', latency: '12ms', cert: 'CRT-A982' },
                                        { id: 'ABUJA_STRAT_CENTRE', status: 'ONLINE', latency: '15ms', cert: 'CRT-B114' },
                                        { id: 'KADUNA_FIELD_OPS', status: 'STANDBY', latency: '42ms', cert: 'CRT-C772' },
                                        { id: 'PH_RURAL_SECTOR', status: 'ONLINE', latency: '28ms', cert: 'CRT-D009' }
                                    ].map((node, i) => (
                                        <tr key={i} className="hover:bg-white/5 transition-colors group">
                                            <td className="px-8 py-6 text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">{node.id}</td>
                                            <td className="px-8 py-6">
                                                <span className={`inline-flex items-center gap-2 text-[9px] font-black px-3 py-1 rounded-lg border ${node.status === 'ONLINE' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-500/10 text-slate-500 border-slate-500/20'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'ONLINE' ? 'bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-500'}`} />
                                                    {node.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-6 text-xs font-bold font-mono text-slate-500 dark:text-white/40">{node.latency}</td>
                                            <td className="px-8 py-6 text-right text-[10px] font-black font-mono text-blue-500/60 uppercase">{node.cert}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                            <div className="glass-card-premium p-6 hover:scale-[1.02]">
                                <h4 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest mb-3">Protocol Integrity</h4>
                                <p className="text-[10px] text-slate-500 dark:text-white/40 leading-relaxed font-bold italic">All agency nodes utilize AES-256-GCM authenticated encryption for cross-boundary intelligence sharing.</p>
                            </div>
                            <div className="glass-card-premium p-6 hover:scale-[1.02]">
                                <h4 className="font-black text-slate-900 dark:text-white uppercase text-[10px] tracking-widest mb-3">Node Lifecycle</h4>
                                <p className="text-[10px] text-slate-500 dark:text-white/40 leading-relaxed font-bold italic">Certificates are automatically rotated every 24 hours to prevent impersonation and credential capture.</p>
                            </div>
                            <div className="p-6 bg-gradient-to-tr from-blue-700 to-blue-500 rounded-2xl shadow-xl flex flex-col justify-center relative overflow-hidden group hover:scale-[1.05] transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16" />
                                <h4 className="font-black text-white/80 uppercase text-[9px] tracking-[0.2em] mb-2">Global Health</h4>
                                <div className="text-3xl font-black text-white tracking-tighter">99.8%</div>
                                <div className="text-[10px] font-black text-blue-200 uppercase tracking-widest mt-1 opacity-70 italic font-mono">VERIFIED_MESH_NET</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'analytics' && (
                    <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8">
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight mb-2 uppercase">Strategic Intelligence Analytics</h2>
                            <p className="text-slate-500 dark:text-white/40 text-[10px] font-black uppercase tracking-widest font-mono">Long-term threat distribution and agency resource performance metrics.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className="glass-card-premium p-8">
                                <h3 className="font-black text-slate-900 dark:text-white mb-8 flex items-center gap-2 uppercase text-xs tracking-widest">
                                    <TrendingUp className="w-5 h-5 text-blue-500" />
                                    Agency Response Efficiency
                                </h3>
                                <div className="space-y-8">
                                    {[
                                        { agency: 'Cyber Command', efficiency: 94, trend: '+2.1%' },
                                        { agency: 'National Intelligence', efficiency: 88, trend: '+0.5%' },
                                        { agency: 'Regional Defense', efficiency: 72, trend: '-1.4%' },
                                        { agency: 'Border Security', efficiency: 81, trend: '+4.2%' }
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-3">
                                            <div className="flex justify-between items-end">
                                                <span className="text-[10px] font-black text-slate-700 dark:text-white/70 uppercase tracking-widest">{item.agency}</span>
                                                <span className={`text-[10px] font-black ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>{item.trend}</span>
                                            </div>
                                            <div className="w-full h-2 bg-black/20 dark:bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${item.efficiency > 90 ? 'bg-blue-600' : item.efficiency > 80 ? 'bg-blue-400 font-bold' : 'bg-slate-500'}`}
                                                    style={{ width: `${item.efficiency}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">
                                                <span>Operational Score</span>
                                                <span>{item.efficiency}/100</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-blue-900 p-8 rounded-2xl text-white shadow-xl relative overflow-hidden group">
                                <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-white/10 transition-all duration-700" />
                                <h3 className="font-bold mb-8 flex items-center gap-2">
                                    <UserIcon className="w-5 h-5 text-slate-500" />
                                    System Security Posture
                                </h3>
                                <div className="grid grid-cols-2 gap-8">
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="text-3xl font-black mb-1">98.4%</div>
                                        <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Network Stability</div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="text-3xl font-black mb-1">11ms</div>
                                        <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Global Latency</div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="text-3xl font-black mb-1">4.2k</div>
                                        <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Trusted Handshakes</div>
                                    </div>
                                    <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                                        <div className="text-3xl font-black mb-1">0.05%</div>
                                        <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Anomaly Detection</div>
                                    </div>
                                </div>
                                <div className="mt-8 pt-8 border-t border-white/10 italic">
                                    <p className="text-xs text-blue-200 leading-relaxed font-serif">
                                        "National assets remain in a state of high readiness. No significant deviations from baseline security protocols have been detected within the last audit cycle."
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div className="glass-card-premium p-8 mt-8">
                            <h3 className="font-black text-slate-900 dark:text-white mb-8 uppercase tracking-[0.2em] text-xs">Intelligence Forecast</h3>
                            <div className="flex items-center gap-8">
                                <div className="flex-1 space-y-6">
                                    <div className="p-5 bg-blue-500/5 rounded-2xl border border-blue-500/10 relative">
                                        <p className="text-xs text-slate-600 dark:text-blue-100/60 leading-relaxed font-bold italic font-mono"> Predicted_trend indicates a <span className="text-blue-500 font-black">12% decrease</span> in routine alerts over the next quarter due to optimized agency coordination protocols.</p>
                                    </div>
                                    <button className="w-full py-4 bg-blue-600 dark:bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-[0.3em] hover:bg-blue-500 transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-blue-500/40 border border-blue-400/30">
                                        Generate Full Strategic Report
                                    </button>
                                </div>
                                <div className="w-48 h-48 rounded-full border-8 border-white/5 flex flex-col items-center justify-center relative group">
                                    <div className="absolute inset-0 border-8 border-blue-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 85%)' }} />
                                    <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">85%</span>
                                    <span className="text-[9px] font-black text-slate-400 dark:text-white/30 tracking-widest uppercase mt-1">Confidence</span>
                                </div>
                            </div>
                        </div>

                        <div className="mt-8">
                            <SafetyLeaderboard />
                        </div>
                    </div>
                )}
            </main>

            {/* Notifications Panel */}
            {showNotifications && (
                <div className="fixed inset-0 z-50 flex items-start justify-end p-4 pointer-events-none">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-sm p-6 pointer-events-auto">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-slate-900">Notifications</h3>
                            <button onClick={() => setShowNotifications(false)} className="text-slate-400 hover:text-slate-600">
                                ✕
                            </button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {(notifications || []).length === 0 ? (
                                <div className="bg-slate-50 p-4 rounded border border-slate-100">
                                    <p className="text-sm text-slate-800">System operational - All services running</p>
                                    <span className="text-xs text-slate-400">Now</span>
                                </div>
                            ) : (
                                (notifications || []).map((notif, idx) => (
                                    <div key={idx} className="bg-slate-50 p-3 rounded border border-slate-100 animate-fade-in-up">
                                        <p className="text-sm text-slate-900">{notif.message}</p>
                                        <span className="text-xs text-slate-400">{notif.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}


            {/* Incident Detail Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
                    <div className="glass-card-premium w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/20">
                        <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5 relative">
                            <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500" />
                            <div>
                                <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Intelligence Record Detail</h2>
                                <p className="text-[10px] text-slate-500 dark:text-white/30 font-black font-mono mt-1 uppercase tracking-widest">TRACE_ID: {selectedAlert.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-10 space-y-10">
                            <div className="grid grid-cols-2 gap-10">
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Classification</span>
                                    <div className="flex items-center gap-3">
                                        <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] ${selectedAlert.severity > 0.8 ? 'bg-red-500 glow-red' : 'bg-blue-500 glow-blue'}`} />
                                        <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">{(selectedAlert.type || 'Standard').replace(/_/g, ' ')}</span>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Temporal Data</span>
                                    <p className="font-bold text-slate-900 dark:text-white text-xs font-mono">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Spatial Vector</span>
                                    <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest">
                                        {isAlertRedacted(selectedAlert) ? (
                                            <span className="text-red-500 font-black tracking-widest">[REDACTED_SECTOR]</span>
                                        ) : (
                                            selectedAlert.location
                                        )}
                                    </p>
                                </div>
                                <div className="space-y-2">
                                    <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Source_Trust</span>
                                    <div className="flex items-center gap-2">
                                        {selectedAlert.isTrusted ? (
                                            <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest">VERIFIED_IDENTITY</span>
                                        ) : (
                                            <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 uppercase tracking-widest">PENDING_AUDIT</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Intelligence Payload</span>
                                {isAlertRedacted(selectedAlert) ? (
                                    <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/20">
                                        <div className="flex items-center gap-2 mb-3">
                                            <ShieldAlert className="w-4 h-4 text-red-500" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Encrypted Payload Locked</span>
                                        </div>
                                        <p className="text-xs text-red-900/60 dark:text-red-400/60 leading-relaxed font-bold italic">
                                            Payload is guarded by sovereign-level encryption or was submitted under duress conditions. Access requires Level 5 Strategic clearance and physical duress override keys.
                                        </p>
                                        <div className="mt-4 space-y-2 opacity-5 blur-[2px] select-none">
                                            <div className="h-2 bg-red-500 rounded w-full" />
                                            <div className="h-2 bg-red-500 rounded w-5/6" />
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-blue-500/5 rounded-2xl p-6 border border-blue-500/10 text-slate-700 dark:text-white/70 leading-relaxed font-bold italic text-sm font-mono">
                                        "{selectedAlert.content}"
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 pt-4 border-t border-white/10">
                                <div className="flex items-center gap-2 text-blue-500">
                                    <Shield className="w-5 h-5 opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cryptographic Proof of Sovereignty</span>
                                </div>
                                <div className="bg-black/40 rounded-xl p-5 font-mono text-[9px] border border-white/5">
                                    <p className="text-slate-400 dark:text-white/20 mb-2 uppercase font-black">CONTENT_SHA256_HASH:</p>
                                    <p className="text-blue-500 dark:text-blue-400/80 break-all mb-4 leading-normal">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
                                    <p className="text-slate-400 dark:text-white/20 mb-2 uppercase font-black">BLOCK_COMMIT_REFERENCE:</p>
                                    <p className="text-blue-500 dark:text-blue-400/80 uppercase font-black">NG-SOVEREIGN-TX-{selectedAlert.id.substring(0, 12)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-8 bg-white/5 border-t border-white/10 flex justify-end">
                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-500 transition-all text-[10px] uppercase tracking-[0.3em] shadow-[0_10px_20px_rgba(37,99,235,0.2)] border border-blue-400/30"
                            >
                                Close Intelligence Record
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
