import React from 'react';
import { Activity, FileText, TrendingUp } from 'lucide-react';
import { Alert } from '../../../lib/api';

interface StrategicOverviewProps {
    alerts: Alert[];
    trends: number[];
    distribution: any[];
    criticalCount: number;
    isAlertRedacted: (alert: Alert | null) => boolean;
    onSelectAlert: (alert: Alert) => void;
}

export default function StrategicOverview({
    alerts,
    trends,
    distribution,
    criticalCount,
    isAlertRedacted,
    onSelectAlert
}: StrategicOverviewProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Charts Area */}
            <div className="lg:col-span-2 space-y-8">
                <div className="glass-card-premium p-6 min-h-[400px]">
                    <h3 className="font-black text-slate-900 dark:text-white mb-6 flex items-center gap-2 uppercase text-xs tracking-widest">
                        <Activity className="w-4 h-4 text-blue-500" />
                        Incident Trend Analysis (Last 12 Hours)
                    </h3>
                    <div className="w-full h-64 flex items-end justify-between gap-2 px-4 py-4 border-b border-l border-slate-200/20">
                        {trends.map((h, i) => (
                            <div
                                key={i}
                                className={`w-full rounded-t transition-all duration-700 relative group cursor-pointer
                                    ${h > 80 ? 'bg-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : h > 50 ? 'bg-amber-400 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-blue-500 shadow-[0_0_15px_rgba(59,130,246,0.3)]'}
                                `}
                                style={{ height: `${Math.max(h, 5)}%` }}
                            >
                                <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 text-[10px] font-black text-slate-900 dark:text-white opacity-0 group-hover:opacity-100 transition-opacity bg-white/10 backdrop-blur-md px-2 py-1 rounded border border-white/10 whitespace-nowrap">
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
                                            <p className="text-sm font-black text-slate-900 dark:text-white leading-none mb-1.5 flex items-center gap-2">
                                                {isAlertRedacted(alert) ? (
                                                    <span className="text-red-500 font-black uppercase tracking-widest text-[10px] glow-red">!!! CLASSIFIED_INTEL !!!</span>
                                                ) : (
                                                    <>
                                                        SIGINT: #{alert.id.substring(0, 8)}
                                                        {alert.severity_score !== undefined && (
                                                            <span className="text-[8px] px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-500 border border-blue-500/20 font-black tracking-widest">
                                                                AI:{Math.round(alert.severity_score * 100)}%
                                                            </span>
                                                        )}
                                                    </>
                                                )}
                                            </p>
                                            <div className="flex items-center gap-2">
                                                <p className="text-[10px] text-slate-500 dark:text-white/30 uppercase font-bold tracking-widest font-mono">
                                                    {isAlertRedacted(alert) ? 'SOURCE_ENCRYPTED' : alert.type} • {new Date(alert.timestamp).toLocaleTimeString()}
                                                </p>
                                                {alert.risk_keywords && alert.risk_keywords.length > 0 && !isAlertRedacted(alert) && (
                                                    <div className="flex gap-1">
                                                        {alert.risk_keywords.slice(0, 2).map(kw => (
                                                            <span key={kw} className="text-[8px] text-slate-400 dark:text-white/20 uppercase font-mono tracking-tighter">
                                                                #{kw}
                                                            </span>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => onSelectAlert(alert)}
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
                                        <span className="text-slate-600 dark:text-white/60">{item.name}</span>
                                        <span className="text-slate-900 dark:text-white">{Math.round(item.percentage)}%</span>
                                    </div>
                                    <div className="w-full h-1.5 bg-slate-200/20 dark:bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full transition-all duration-1000 ${(item.name || '').toLowerCase().includes('cyber') ? 'bg-blue-500 glow-blue' :
                                                (item.name || '').toLowerCase().includes('physical') ? 'bg-amber-500 glow-yellow' :
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
                    </div>
                </div>
            </div>
        </div>
    );
}
