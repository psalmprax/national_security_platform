"use client";

import React from 'react';
import { PieChart, FileText, Activity, Shield, TrendingUp } from 'lucide-react';
import { getIncidentTrends, getThreatDistribution, Alert, SystemStatus } from '../../lib/api';
import { User } from '../../lib/AuthContext';

interface StrategicDashboardProps {
    alerts: Alert[];
    currentTime: Date | null;
    securityStatus: SystemStatus;
    user: User | null;
    logout: () => void;
}

export default function StrategicDashboard({ alerts, currentTime, securityStatus, user, logout }: StrategicDashboardProps) {
    const [selectedAlert, setSelectedAlert] = React.useState<Alert | null>(null);
    const [showUserMenu, setShowUserMenu] = React.useState(false);
    const [activeView, setActiveView] = React.useState<'overview' | 'profile' | 'registry' | 'analytics'>('overview');

    const criticalCount = alerts.filter(a => a.severity > 0.8).length;
    const trends = getIncidentTrends(alerts);
    const distribution = getThreatDistribution(alerts);
    // Unused variables for now, but keeping for future chart expansion
    // const urgentCount = alerts.filter(a => a.severity > 0.6 && a.severity <= 0.8).length;
    // const routineCount = alerts.filter(a => a.severity <= 0.6).length;

    return (
        <div className="w-full h-full bg-slate-50 text-slate-800 overflow-auto font-sans">
            {/* Top Navigation Bar */}
            <nav className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-8 shadow-sm">
                <div className="flex items-center gap-3">
                    <div
                        onClick={() => setActiveView('overview')}
                        className="bg-blue-900 p-1.5 rounded text-white cursor-pointer hover:bg-blue-800 transition-colors"
                    >
                        <Activity className="w-5 h-5" />
                    </div>
                    <span
                        onClick={() => setActiveView('overview')}
                        className="font-bold text-lg text-slate-900 tracking-tight cursor-pointer"
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
                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-bold text-xs transition-all uppercase cursor-pointer ${showUserMenu ? 'border-blue-600 bg-blue-600 text-white' : 'border-blue-900 bg-blue-900 text-white hover:ring-4 hover:ring-blue-100'}`}
                        >
                            {user?.full_name?.charAt(0) || 'A'}
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
                    <h1 className="text-3xl font-bold text-slate-900 mb-2">Executive Summary</h1>
                    <p className="text-slate-500">
                        Overview as of {currentTime?.toLocaleString()}
                    </p>
                </div>

                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <span className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wider">Total Incidents</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{alerts.length}</span>
                            <span className="text-sm font-medium text-green-600">▲ {trends[11]} recent</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col relative overflow-hidden group">
                        <div className={`absolute top-0 right-0 w-1 h-full ${criticalCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-200'}`} />
                        <span className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wider">Critical Threats</span>
                        <div className="flex items-baseline gap-2">
                            <span className={`text-3xl font-bold ${criticalCount > 0 ? 'text-red-600' : 'text-slate-900'}`}>{criticalCount}</span>
                            {criticalCount > 0 && <span className="text-xs font-bold text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 uppercase tracking-tighter">Action Required</span>}
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <span className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wider">Active Agents</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{securityStatus.trustedDevices ?? 0}</span>
                            <span className="text-sm font-medium text-green-600">● Online</span>
                        </div>
                    </div>
                    <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <span className="text-xs font-semibold uppercase text-slate-400 mb-2 tracking-wider">System Integrity</span>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-bold text-slate-900">{alerts.length > 0 ? (100 - (criticalCount / alerts.length * 20)).toFixed(1) : '100'}%</span>
                            <Shield className="w-4 h-4 text-blue-600 ml-auto" />
                        </div>
                    </div>
                </div>

                {/* Content Sections */}
                {activeView === 'overview' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Charts Area */}
                        <div className="lg:col-span-2 space-y-8">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm min-h-[400px]">
                                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <Activity className="w-4 h-4 text-slate-400" />
                                    Incident Trend Analysis (Last 12 Hours)
                                </h3>
                                {/* Dynamic Chart Visualization */}
                                <div className="w-full h-64 flex items-end justify-between gap-2 px-4 py-4 border-b border-l border-slate-100">
                                    {trends.map((h, i) => (
                                        <div
                                            key={i}
                                            className={`w-full rounded-t transition-all duration-500 relative group
                                                ${h > 80 ? 'bg-red-500 hover:bg-red-400' : h > 50 ? 'bg-orange-400 hover:bg-orange-300' : 'bg-blue-500 hover:bg-blue-400'}
                                            `}
                                            style={{ height: `${Math.max(h, 5)}%` }}
                                        >
                                            <div className="absolute bottom-full mb-1 left-1/2 -translate-x-1/2 text-[10px] font-bold text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity">
                                                {Math.round(h)}%
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex justify-between text-xs font-bold text-slate-400 mt-2 px-2 uppercase tracking-tighter">
                                    <span>T-12H</span>
                                    <span>T-6H</span>
                                    <span className="text-blue-600 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-ping" /> REALTIME</span>
                                </div>
                            </div>

                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-900 mb-4">Recent Reports</h3>
                                <div className="divide-y divide-slate-100">
                                    {alerts.length === 0 ? (
                                        <p className="py-4 text-slate-400 text-sm italic">No recent reports available.</p>
                                    ) : (
                                        alerts.slice(0, 3).map(alert => (
                                            <div key={alert.id} className="py-3 flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className={`p-2 rounded-lg ${alert.severity > 0.8 ? 'bg-red-50 text-red-600' :
                                                        alert.severity > 0.6 ? 'bg-orange-50 text-orange-600' : 'bg-blue-50 text-blue-600'
                                                        }`}>
                                                        <FileText className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <p className="text-sm font-medium text-slate-900">Incident: #{alert.id.substring(0, 8)}</p>
                                                        <p className="text-xs text-slate-500 uppercase">{alert.type.replace(/_/g, ' ')} • {new Date(alert.timestamp).toLocaleTimeString()}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => setSelectedAlert(alert)}
                                                    className="text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-100 px-3 py-1 rounded hover:bg-blue-50 transition-all"
                                                >
                                                    View Log
                                                </button>
                                            </div>
                                        ))
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Sidebar - Breakdown */}
                        <div className="space-y-8">
                            <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm flex-1">
                                <h3 className="font-bold text-slate-900 mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-4 h-4 text-slate-400" />
                                    Threat Composition
                                </h3>
                                <div className="space-y-4">
                                    {distribution.length === 0 ? (
                                        <p className="text-sm text-slate-400 italic">Insufficient data for distribution analysis</p>
                                    ) : (
                                        distribution.map((item, idx) => (
                                            <div key={idx} className="space-y-1">
                                                <div className="flex justify-between text-xs font-bold uppercase tracking-wider">
                                                    <span className="text-slate-600">{item.name.replace(/_/g, ' ')}</span>
                                                    <span className="text-slate-900">{Math.round(item.percentage)}%</span>
                                                </div>
                                                <div className="w-full h-2 bg-slate-50 rounded-full overflow-hidden border border-slate-100">
                                                    <div
                                                        className={`h-full transition-all duration-1000 ${item.name.toLowerCase().includes('cyber') ? 'bg-blue-500' :
                                                            item.name.toLowerCase().includes('physical') ? 'bg-orange-500' :
                                                                'bg-slate-400'
                                                            }`}
                                                        style={{ width: `${item.percentage}%` }}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <div className="mt-8 pt-8 border-t border-slate-100">
                                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Strategic Advisory</div>
                                    <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
                                        <p className="text-xs text-blue-900 leading-relaxed font-medium">
                                            Current telemetry suggests a {criticalCount > 2 ? 'high' : 'contained'} risk level. Recommend increasing surveillance in {alerts[0]?.location || 'all sectors'}.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-blue-900 p-6 rounded-xl text-white shadow-lg">
                                <h3 className="font-bold mb-2">System Status</h3>
                                <p className="text-blue-200 text-sm mb-4">All systems operational. Network grid stability is optimal.</p>
                                <div className="flex items-center justify-between text-sm">
                                    <span className="opacity-70">Latency</span>
                                    <span className="font-mono font-bold">18ms</span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-2">
                                    <span className="opacity-70">Uptime</span>
                                    <span className="font-mono font-bold">99.99%</span>
                                </div>
                                <div className="flex items-center justify-between text-sm mt-2">
                                    <span className="opacity-70">Active Nodes</span>
                                    <span className="font-mono font-bold">{securityStatus.trustedDevices ?? 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'profile' && (
                    <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-12">
                            <div className="flex items-center gap-8 mb-12 pb-12 border-b border-slate-100">
                                <div className="w-24 h-24 rounded-full bg-blue-900 flex items-center justify-center text-white text-4xl font-black">
                                    {user?.full_name?.charAt(0) || 'A'}
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black text-slate-900 mb-2">{user?.full_name || 'Administrator'}</h1>
                                    <div className="flex items-center gap-4">
                                        <span className="bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-widest px-4 py-1 rounded-full border border-blue-100">
                                            Primary Authority
                                        </span>
                                        <span className="text-slate-400 text-xs font-mono">NODE_IDENTITY: {user?.id || 'AUTH_GATEWAY_03'}</span>
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                                <div className="space-y-8">
                                    <div>
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Functional Role</h3>
                                        <p className="text-lg font-bold text-slate-900">{user?.role || 'Strategic Intelligence Officer'}</p>
                                        <p className="text-sm text-slate-500 mt-2">Overseeing national security metrics and cross-agency intelligence coordination.</p>
                                    </div>
                                    <div>
                                        <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-4">Authorized Clearance</h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {['STRAT_VIEW', 'AGENCY_MGMT', 'BIO_AUTH', 'LEGAL_AUDIT'].map((p, i) => (
                                                <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 p-2 rounded border border-slate-100">
                                                    <div className="w-1 h-1 bg-blue-600 rounded-full" />
                                                    {p}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                                <div className="bg-slate-50 p-8 rounded-2xl border border-slate-100">
                                    <Shield className="w-8 h-8 text-blue-900 mb-4" />
                                    <h3 className="font-bold text-slate-900 mb-2">Account Security</h3>
                                    <p className="text-sm text-slate-500 mb-6 leading-relaxed">Your account is protected by hardware-bound PKI and multi-factor biometric authentication.</p>
                                    <div className="space-y-3">
                                        <div className="flex justify-between text-xs font-bold uppercase tracking-tighter">
                                            <span className="text-slate-400">Security Score</span>
                                            <span className="text-blue-600">98/100</span>
                                        </div>
                                        <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 w-[98%]" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'registry' && (
                    <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                            <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center">
                                <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Agency Node Registry</h1>
                                <span className="bg-slate-100 text-slate-500 text-[10px] font-bold uppercase px-3 py-1 rounded-full border border-slate-200">
                                    Verified Nodes: {securityStatus.trustedDevices}
                                </span>
                            </div>
                            <table className="w-full text-left">
                                <thead className="bg-slate-50 border-b border-slate-100">
                                    <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        <th className="px-8 py-4">Agency Designation</th>
                                        <th className="px-8 py-4">Operational Status</th>
                                        <th className="px-8 py-4">Network Latency</th>
                                        <th className="px-8 py-4 text-right">Certificate ID</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {[
                                        { id: 'LAGOS_HQ_GATEWAY', status: 'ONLINE', latency: '12ms', cert: 'CRT-A982' },
                                        { id: 'ABUJA_STRAT_CENTRE', status: 'ONLINE', latency: '15ms', cert: 'CRT-B114' },
                                        { id: 'KADUNA_FIELD_OPS', status: 'STANDBY', latency: '42ms', cert: 'CRT-C772' },
                                        { id: 'PH_RURAL_SECTOR', status: 'ONLINE', latency: '28ms', cert: 'CRT-D009' }
                                    ].map((node, i) => (
                                        <tr key={i} className="hover:bg-slate-50/50 transition-colors">
                                            <td className="px-8 py-5 text-sm font-bold text-slate-900">{node.id}</td>
                                            <td className="px-8 py-5">
                                                <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-2 py-0.5 rounded border ${node.status === 'ONLINE' ? 'bg-green-50 text-green-700 border-green-100' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full ${node.status === 'ONLINE' ? 'bg-green-600 animate-pulse' : 'bg-slate-400'}`} />
                                                    {node.status}
                                                </span>
                                            </td>
                                            <td className="px-8 py-5 text-sm font-mono text-slate-500">{node.latency}</td>
                                            <td className="px-8 py-5 text-right text-xs font-mono text-slate-300 font-bold">{node.cert}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-8">
                            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-900 mb-2">Protocol Integrity</h4>
                                <p className="text-xs text-slate-500 leading-relaxed italic">All agency nodes utilize AES-256-GCM authenticated encryption for cross-boundary intelligence sharing.</p>
                            </div>
                            <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm">
                                <h4 className="font-bold text-slate-900 mb-2">Node Lifecycle</h4>
                                <p className="text-xs text-slate-500 leading-relaxed italic">Certificates are automatically rotated every 24 hours to prevent impersonation and credential capture.</p>
                            </div>
                            <div className="p-6 bg-blue-900 rounded-2xl shadow-lg flex flex-col justify-center">
                                <h4 className="font-bold text-white mb-1">Global Health</h4>
                                <div className="text-3xl font-black text-white">99.8%</div>
                                <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest mt-1 opacity-70 italic">Verified Network Mesh</div>
                            </div>
                        </div>
                    </div>
                )}

                {activeView === 'analytics' && (
                    <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
                        <div className="mb-8">
                            <h2 className="text-2xl font-bold text-slate-900 tracking-tight mb-2">Strategic Intelligence Analytics</h2>
                            <p className="text-slate-500 text-sm">Long-term threat distribution and agency resource performance metrics.</p>
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                            <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                                <h3 className="font-bold text-slate-800 mb-6 flex items-center gap-2">
                                    <TrendingUp className="w-5 h-5 text-blue-600" />
                                    Agency Response Efficiency
                                </h3>
                                <div className="space-y-6">
                                    {[
                                        { agency: 'Cyber Command', efficiency: 94, trend: '+2.1%' },
                                        { agency: 'National Intelligence', efficiency: 88, trend: '+0.5%' },
                                        { agency: 'Regional Defense', efficiency: 72, trend: '-1.4%' },
                                        { agency: 'Border Security', efficiency: 81, trend: '+4.2%' }
                                    ].map((item, i) => (
                                        <div key={i} className="space-y-2">
                                            <div className="flex justify-between items-end">
                                                <span className="text-sm font-bold text-slate-700">{item.agency}</span>
                                                <span className={`text-xs font-bold ${item.trend.startsWith('+') ? 'text-green-600' : 'text-red-500'}`}>{item.trend}</span>
                                            </div>
                                            <div className="w-full h-2.5 bg-slate-50 rounded-full overflow-hidden border border-slate-100 italic">
                                                <div
                                                    className={`h-full transition-all duration-1000 ${item.efficiency > 90 ? 'bg-blue-600' : item.efficiency > 80 ? 'bg-blue-400' : 'bg-slate-400'}`}
                                                    style={{ width: `${item.efficiency}%` }}
                                                />
                                            </div>
                                            <div className="flex justify-between text-[10px] font-bold text-slate-400 uppercase tracking-widest">
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
                                    <Shield className="w-5 h-5 text-blue-400" />
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

                        <div className="bg-white p-8 rounded-2xl border border-slate-200 shadow-sm">
                            <h3 className="font-bold text-slate-900 mb-6 uppercase tracking-widest text-xs">Intelligence Forecast</h3>
                            <div className="flex items-center gap-8">
                                <div className="flex-1 space-y-4">
                                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 italic">
                                        <p className="text-sm text-slate-600">Predicted trend indicates a <span className="text-blue-700 font-bold">12% decrease</span> in routine alerts over the next quarter due to optimized agency coordination.</p>
                                    </div>
                                    <button className="w-full py-3 bg-slate-900 text-white font-bold rounded-lg text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-900/10">
                                        Generate Full Strategic Report
                                    </button>
                                </div>
                                <div className="w-48 h-48 rounded-full border-8 border-slate-50 flex flex-col items-center justify-center relative">
                                    <div className="absolute inset-0 border-8 border-blue-600 rounded-full" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 85%)' }} />
                                    <span className="text-3xl font-black text-slate-900">85%</span>
                                    <span className="text-[8px] font-bold text-slate-400 tracking-tighter uppercase">Confidence</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </main>

            {/* Incident Detail Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
                            <div>
                                <h2 className="text-xl font-bold text-slate-900">Incident Log Detail</h2>
                                <p className="text-xs text-slate-500 font-mono mt-1">ID: {selectedAlert.id}</p>
                            </div>
                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white hover:shadow-sm text-slate-400 hover:text-slate-600 transition-all border border-transparent hover:border-slate-200"
                            >
                                ✕
                            </button>
                        </div>
                        <div className="p-8 space-y-8">
                            <div className="grid grid-cols-2 gap-8">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Classification</span>
                                    <div className="flex items-center gap-2">
                                        <div className={`w-2 h-2 rounded-full ${selectedAlert.severity > 0.8 ? 'bg-red-500' : 'bg-blue-500'}`} />
                                        <span className="font-bold text-slate-900 uppercase">{selectedAlert.type.replace(/_/g, ' ')}</span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Timestamp</span>
                                    <p className="font-medium text-slate-900">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Location Vector</span>
                                    <p className="font-medium text-slate-900">{selectedAlert.location}</p>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Validation Status</span>
                                    <div className="flex items-center gap-2">
                                        {selectedAlert.isTrusted ? (
                                            <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded border border-green-100">VERIFIED SOURCE</span>
                                        ) : (
                                            <span className="text-xs font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">PENDING VERIFICATION</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Intel Summary</span>
                                <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 text-slate-700 leading-relaxed italic">
                                    "{selectedAlert.content}"
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-slate-100">
                                <div className="flex items-center gap-2 text-blue-900">
                                    <Shield className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Audit Ledger Information</span>
                                </div>
                                <div className="bg-slate-900 rounded-lg p-4 font-mono text-[10px]">
                                    <p className="text-slate-400 mb-1">CONTENT_HASH (SHA-256):</p>
                                    <p className="text-blue-400 break-all mb-3">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
                                    <p className="text-slate-400 mb-1">BLOCKCHAIN_COMMIT_ID:</p>
                                    <p className="text-blue-400 uppercase">NG-SEC-TX-{selectedAlert.id.substring(0, 12)}</p>
                                </div>
                            </div>
                        </div>
                        <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="px-6 py-2 bg-blue-900 text-white font-bold rounded-lg hover:bg-blue-800 transition-all text-sm shadow-lg shadow-blue-900/20"
                            >
                                CLOSE REPORT
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
