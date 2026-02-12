"use client";

import React from 'react';
import { PieChart, Activity, Shield, User as UserIcon } from 'lucide-react';
import { getIncidentTrends, getThreatDistribution, Alert, SystemStatus, Mission, SafetyScore, fetchActiveMissions, fetchSafetyScores, fetchSystemStatus, SectorReport, fetchSectorReport } from '../../lib/api';
import { User } from '../../lib/AuthContext';

// Sub-components
import StrategicKPIs from './strategic/StrategicKPIs';
import StrategicOverview from './strategic/StrategicOverview';
import StrategicAnalytics from './strategic/StrategicAnalytics';
import StrategicRegistry from './strategic/StrategicRegistry';
import StrategicProfile from './strategic/StrategicProfile';
import IncidentTraceModal from './strategic/IncidentTraceModal';

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
    const [activeView, setActiveView] = React.useState<'overview' | 'profile' | 'registry' | 'analytics'>('overview');
    const [showNotifications, setShowNotifications] = React.useState(false);
    const [notifications] = React.useState([
        { message: "Strategic intelligence systems active. Real-time telemetry established.", timestamp: new Date(), type: 'system' }
    ]);

    const [missions, setMissions] = React.useState<Mission[]>([]);
    const [safetyScores, setSafetyScores] = React.useState<SafetyScore[]>([]);
    const [liveStatus, setLiveStatus] = React.useState<SystemStatus | null>(null);
    const [sectorReport, setSectorReport] = React.useState<SectorReport | null>(null);
    const [loading, setLoading] = React.useState(true);

    const fetchData = React.useCallback(async () => {
        try {
            const [missionsData, scoresData, statusData, reportData] = await Promise.all([
                fetchActiveMissions(),
                fetchSafetyScores(),
                fetchSystemStatus(),
                fetchSectorReport()
            ]);
            setMissions(missionsData);
            setSafetyScores(scoresData);
            setLiveStatus(statusData);
            setSectorReport(reportData);
        } catch (error) {
            console.error('StrategicDashboard: Failed to load real-time data', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 15000); // 15s refresh
        return () => clearInterval(interval);
    }, [fetchData]);

    const criticalCount = (alerts || []).filter(a => a.severity > 0.8).length;
    const trends = getIncidentTrends(alerts || []);
    const distribution = getThreatDistribution(alerts || []);
    const systemIntegrity = sectorReport?.system_integrity ?? liveStatus?.systemIntegrity ?? securityStatus.systemIntegrity ?? 0;

    const isAlertRedacted = (alert: Alert | null): boolean => {
        if (!alert) return false;
        return (
            (alert.content || '').includes('[REDACTED') ||
            (alert.priority_class === 'CRITICAL' && alert.isEncrypted === true) ||
            alert.isDuress === true
        );
    };

    if (loading && !liveStatus) {
        return (
            <div className="flex items-center justify-center p-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-transparent text-slate-900 border-none overflow-auto font-sans" data-theme={displayMode}>
            <main className="p-8 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 border-b border-slate-200/10 pb-6">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 dark:text-white uppercase tracking-wider mb-2">Strategic Intelligence</h1>
                        <p className="text-slate-500 dark:text-white/40 font-mono text-xs uppercase font-bold">
                            Live Telemetry • {currentTime?.toLocaleString()}
                        </p>
                    </div>

                    <div className="flex bg-slate-100 dark:bg-white/5 p-1 rounded-xl border border-slate-200/10">
                        {[
                            { id: 'overview', label: 'Overview', icon: Activity },
                            { id: 'analytics', label: 'Analytics', icon: PieChart },
                            { id: 'registry', label: 'Registry', icon: Shield },
                            { id: 'profile', label: 'Profile', icon: UserIcon }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveView(tab.id as any)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${activeView === tab.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20'
                                    : 'text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <tab.icon className="w-3.5 h-3.5" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <StrategicKPIs
                    alertsCount={(alerts || []).length}
                    missions={missions}
                    systemIntegrity={systemIntegrity}
                    criticalCount={criticalCount}
                    recentTrend={trends[11]}
                />

                {activeView === 'overview' && (
                    <StrategicOverview
                        alerts={alerts}
                        trends={trends}
                        distribution={distribution}
                        criticalCount={criticalCount}
                        isAlertRedacted={isAlertRedacted}
                        onSelectAlert={setSelectedAlert}
                    />
                )}

                {activeView === 'profile' && (
                    <StrategicProfile user={user} />
                )}

                {activeView === 'registry' && (
                    <StrategicRegistry
                        safetyScores={safetyScores}
                        liveStatus={liveStatus}
                    />
                )}

                {activeView === 'analytics' && (
                    <StrategicAnalytics
                        trends={trends}
                        missions={missions}
                        systemIntegrity={systemIntegrity}
                        sectorReport={sectorReport}
                        liveStatus={liveStatus}
                        alerts={alerts}
                    />
                )}
            </main>

            {selectedAlert && (
                <IncidentTraceModal
                    selectedAlert={selectedAlert}
                    onClose={() => setSelectedAlert(null)}
                    isAlertRedacted={isAlertRedacted}
                />
            )}
        </div>
    );
}
