"use client";
import React from 'react';

import { AlertCircle, Clock, CheckCircle2, ShieldAlert, Activity, Shield, FileDown, X, TrendingUp } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Alert, SectorReport, fetchSectorReport } from '../lib/api';
import { useAuth } from '../lib/AuthContext';

export default function TriageSidebar({
    alerts,
    onSelect,
    selectedId,
    themeColor = '#00FF95'
}: {
    alerts: Alert[],
    onSelect?: (alert: Alert) => void,
    selectedId?: string | null,
    themeColor?: string
}) {
    const { user } = useAuth();
    const [isMounted, setIsMounted] = React.useState(false);
    const [report, setReport] = React.useState<SectorReport | null>(null);
    const [isGenerating, setIsGenerating] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleGenerateReport = async () => {
        setIsGenerating(true);
        // Artificial delay for "premium" feel
        await new Promise(resolve => setTimeout(resolve, 1500));
        try {
            const data = await fetchSectorReport();
            setReport(data);
        } catch (error) {
            console.error('Failed to generate report:', error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <aside className="w-96 glass-surface flex flex-col z-30">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 transition-colors" style={{ color: themeColor, filter: `drop-shadow(0 0 8px ${themeColor}40)` }} />
                    <h2 className="text-sm font-black tracking-[0.2em] text-white/90">INTELLIGENCE TRIAGE</h2>
                </div>
                <div className="flex items-center gap-2">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                    </span>
                    <span className="text-[10px] font-bold text-red-500/80 tracking-widest uppercase">
                        {alerts.length} Active
                    </span>
                </div>
            </div>

            {/* ALERT LIST */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-cyber">
                {alerts.length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4">
                        <div className="w-12 h-12 rounded-full border border-white/5 flex items-center justify-center">
                            <ShieldAlert className="w-6 h-6 text-white/10" />
                        </div>
                        <p className="text-xs text-white/20 uppercase tracking-widest font-medium">Monitoring secured sectors...</p>
                    </div>
                ) : (
                    alerts.map(alert => (
                        <div
                            key={alert.id}
                            onClick={() => onSelect?.(alert)}
                            className={`p-5 rounded-2xl bg-white/[0.03] border transition-all duration-500 cursor-pointer group relative overflow-hidden`}
                            style={selectedId === alert.id ? { borderColor: themeColor, backgroundColor: themeColor + '0d' } : { borderColor: 'rgba(255,255,255,0.05)' }}
                        >
                            {/* Threat Progress Bar Background */}
                            <div className="absolute top-0 left-0 h-1 bg-white/5 w-full" />
                            <div
                                className={`absolute top-0 left-0 h-1 transition-all duration-1000 ${alert.severity > 0.8 ? 'bg-[#FF003C] glow-red' : ''}`}
                                style={{ width: `${alert.severity * 100}%`, backgroundColor: alert.severity > 0.8 ? '#FF003C' : themeColor, boxShadow: alert.severity > 0.8 ? '0 0 10px #FF003C' : `0 0 10px ${themeColor}40` }}
                            />

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black tracking-widest uppercase`} style={{ color: alert.severity > 0.8 ? '#FF003C' : themeColor }}>
                                            {alert.type}
                                        </span>
                                        {alert.isDuress && (
                                            <span className="bg-[#FF003C]/20 text-[#FF003C] text-[8px] px-1.5 py-0.5 rounded-sm font-bold border border-[#FF003C]/30 tracking-tighter">
                                                DURESS SIGNAL
                                            </span>
                                        )}
                                        {alert.isTrusted ? (
                                            <span className="text-[7px] border px-1 py-0 rounded-sm font-bold tracking-widest" style={{ color: themeColor + '66', borderColor: themeColor + '1a' }}>SECURE - VERIFIED</span>
                                        ) : (
                                            <span className="text-[7px] text-[#FF003C]/60 border border-[#FF003C]/20 px-1 py-0 rounded-sm font-bold tracking-widest bg-[#FF003C]/5 animate-pulse">UNTRUSTED - SIG_FAIL</span>
                                        )}
                                    </div>
                                    <span className="text-[12px] text-white font-bold tracking-tight uppercase">
                                        {(alert.lga_name && alert.lga_name !== 'Unknown') ? `${alert.lga_name}, ${alert.state_name}` : `GRID: ${alert.location.split(',').map(c => Number(c).toFixed(2)).join(', ')}`}
                                    </span>
                                    <span className="text-[9px] text-white/40 font-mono tracking-tighter uppercase">
                                        COORDS: {alert.location}
                                    </span>
                                </div>
                                <span className="text-[10px] text-white/30 flex items-center gap-1 font-mono min-w-[80px] justify-end">
                                    <Clock className="w-3 h-3" />
                                    {isMounted ? formatDistanceToNow(new Date(alert.timestamp)) : 'Just now'}
                                </span>
                            </div>

                            <p className="text-xs text-white/70 mb-5 leading-relaxed font-light">
                                {alert.content}
                            </p>

                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: themeColor }} />
                                    <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Verified 88%</span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 hover:bg-[#FF003C]/20 hover:border-[#FF003C]/40 transition-all group/btn">
                                        <AlertCircle className="w-3.5 h-3.5 text-white/40 group-hover/btn:text-[#FF003C]" />
                                    </button>
                                    <button className="h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 transition-all group/btn"
                                        style={{ '&:hover': { backgroundColor: themeColor + '33', borderColor: themeColor + '66' } } as any}>
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white/40 transition-colors" style={{ '&:group-hover/btn': { color: themeColor } } as any} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 border-t border-white/5 bg-white/[0.02] backdrop-blur-md">
                <button
                    onClick={handleGenerateReport}
                    disabled={isGenerating}
                    className={`w-full h-12 rounded-xl text-black text-[11px] font-black tracking-[0.2em] uppercase transition-all flex items-center justify-center gap-2 ${isGenerating ? 'bg-white/10 text-white/40 cursor-wait' : 'hover:scale-[1.02] active:scale-[0.98]'}`}
                    style={isGenerating ? {} : { backgroundColor: themeColor, boxShadow: `0 0 20px ${themeColor}40` }}
                >
                    {isGenerating ? (
                        <>
                            <div className="w-4 h-4 border-2 border-white/20 rounded-full animate-spin" style={{ borderTopColor: themeColor }} />
                            Analyzing Assets...
                        </>
                    ) : (
                        <>
                            <Shield className="w-4 h-4" />
                            Generate Sector Report
                        </>
                    )}
                </button>
            </div>

            {/* SECTOR REPORT MODAL */}
            {report && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-[#121212] border-2 rounded-3xl w-full max-w-xl overflow-hidden animate-in zoom-in-95 duration-300" style={{ borderColor: themeColor + '4d', boxShadow: `0 0 100px ${themeColor}1a` }}>
                        <div className="relative p-8 border-b border-white/5 bg-gradient-to-r from-transparent to-transparent" style={{ backgroundImage: `linear-gradient(to right, ${themeColor}0d, transparent)` }}>
                            <button
                                onClick={() => setReport(null)}
                                className="absolute top-6 right-6 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white transition-all border border-white/10"
                            >
                                <X className="w-4 h-4" />
                            </button>
                            <div className="flex items-center gap-4 mb-6">
                                <div className="w-12 h-12 rounded-2xl border flex items-center justify-center" style={{ backgroundColor: themeColor + '1a', borderColor: themeColor + '33' }}>
                                    <Shield className="w-6 h-6" style={{ color: themeColor }} />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black text-white uppercase tracking-wider">Sector Intelligence Report</h3>
                                    <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">{report.sector_id} • {new Date(report.timestamp).toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">Threat Level</p>
                                    <p className={`text-xl font-black`} style={report.threat_level === 'CRITICAL' || report.threat_level === 'HIGH' ? { color: 'rgb(239, 68, 68)' } : { color: themeColor }}>
                                        {report.threat_level}
                                    </p>
                                </div>
                                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl">
                                    <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-1">System Integrity</p>
                                    <p className="text-xl font-black" style={{ color: themeColor }}>{report.system_integrity.toFixed(1)}%</p>
                                </div>
                            </div>
                        </div>

                        <div className="p-8 space-y-8">
                            <div className="space-y-4">
                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Alert Composition</h4>
                                <div className="grid grid-cols-3 gap-4">
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-white">{report.total_alerts}</p>
                                        <p className="text-[9px] font-bold text-white/40 uppercase">Total</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black text-red-500">{report.critical_threats}</p>
                                        <p className="text-[9px] font-bold text-white/40 uppercase">Critical</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-2xl font-black" style={{ color: themeColor }}>{report.routine_alerts}</p>
                                        <p className="text-[9px] font-bold text-white/40 uppercase">Routine</p>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">
                                    <span>Average Trust Factor</span>
                                    <span style={{ color: themeColor }}>{Math.round(report.trust_score_avg * 10)}%</span>
                                </div>
                                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                    <div
                                        className="h-full transition-all duration-1000"
                                        style={{ width: `${Math.min(report.trust_score_avg * 10, 100)}%`, background: `linear-gradient(to right, ${themeColor}80, ${themeColor})` }}
                                    />
                                </div>
                                <p className="text-[9px] text-white/40 italic">
                                    Last known vector: <span className="text-white font-bold uppercase">{report.last_incident_type}</span>
                                </p>
                            </div>

                            <div className="flex gap-3 pt-4 border-t border-white/5">
                                <button
                                    onClick={() => {
                                        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
                                        const url = URL.createObjectURL(blob);
                                        const a = document.createElement('a');
                                        a.href = url;
                                        a.download = `sector-report-${report.sector_id.toLowerCase()}.json`;
                                        a.click();
                                    }}
                                    className="flex-1 h-12 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black tracking-widest uppercase transition-all flex items-center justify-center gap-2"
                                >
                                    <FileDown className="w-4 h-4" /> Export Data
                                </button>
                                <button
                                    onClick={() => window.print()}
                                    className="flex-1 h-12 rounded-xl text-black text-[10px] font-black tracking-widest uppercase hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                                    style={{ backgroundColor: themeColor, boxShadow: `0 0 20px ${themeColor}40` }}
                                >
                                    <TrendingUp className="w-4 h-4" /> Full Analytics
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </aside>
    );
}
