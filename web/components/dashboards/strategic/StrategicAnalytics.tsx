import React from 'react';
import { TrendingUp, User as UserIcon } from 'lucide-react';
import { Mission, SectorReport, SystemStatus, Alert } from '../../../lib/api';

interface StrategicAnalyticsProps {
    trends: number[];
    missions: Mission[];
    systemIntegrity: number;
    sectorReport: SectorReport | null;
    liveStatus: SystemStatus | null;
    alerts: Alert[];
}

export default function StrategicAnalytics({
    trends,
    missions,
    systemIntegrity,
    sectorReport,
    liveStatus,
    alerts
}: StrategicAnalyticsProps) {
    return (
        <div className="animate-in slide-in-from-bottom-4 duration-500">
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
                            { agency: 'Cyber Command', efficiency: 94, trend: '+2.1%', total: 0, completed: 0 },
                            { agency: 'National Intelligence', efficiency: 88, trend: '+0.5%', total: 0, completed: 0 },
                            { agency: 'Regional Defense', efficiency: 72, trend: '-1.4%', total: 0, completed: 0 },
                            { agency: 'Border Security', efficiency: 81, trend: '+4.2%', total: 0, completed: 0 }
                        ].map((item, i) => {
                            const agencyMissions = missions.length > 0 ? missions.filter((_, idx) => idx % 4 === i) : [];
                            const completed = agencyMissions.filter(m => m.status === 'COMPLETED').length;
                            const actualEff = agencyMissions.length > 0 ? (completed / agencyMissions.length) * 100 : item.efficiency;

                            return (
                                <div key={i} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[10px] font-black text-slate-700 dark:text-white/70 uppercase tracking-widest">{item.agency}</span>
                                        <span className={`text-[10px] font-black ${item.trend.startsWith('+') ? 'text-emerald-500' : 'text-red-500'}`}>
                                            {missions.length > 0 ? `${completed}/${agencyMissions.length}` : item.trend}
                                        </span>
                                    </div>
                                    <div className="w-full h-2 bg-black/20 dark:bg-white/5 rounded-full overflow-hidden border border-white/5">
                                        <div
                                            className={`h-full transition-all duration-1000 ${actualEff > 90 ? 'bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]' : actualEff > 40 ? 'bg-blue-400' : 'bg-slate-500'}`}
                                            style={{ width: `${actualEff}%` }}
                                        />
                                    </div>
                                    <div className="flex justify-between text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">
                                        <span>Performance Index</span>
                                        <span>{Math.round(actualEff)}/100</span>
                                    </div>
                                </div>
                            );
                        })}
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
                            <div className="text-3xl font-black mb-1">{systemIntegrity.toFixed(1)}%</div>
                            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Global Stability</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-3xl font-black mb-1">{sectorReport?.threat_level || (liveStatus ? 'Active' : 'Degraded')}</div>
                            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Network Authority</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-3xl font-black mb-1">{missions.length}</div>
                            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Tactical Missions</div>
                        </div>
                        <div className="p-4 bg-white/5 rounded-xl border border-white/10">
                            <div className="text-3xl font-black mb-1">{sectorReport?.total_alerts || (alerts || []).length}</div>
                            <div className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">Total Ingested SigInt</div>
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
                            <p className="text-xs text-slate-600 dark:text-blue-100/60 leading-relaxed font-bold italic font-mono">
                                {trends[11] > (trends[10] || 0) ? (
                                    `ALERT_SURGE: Recent telemetry indicates a ${Math.round((trends[11] / Math.max(trends[10] || 1, 1) - 1) * 100)}% increase in incident density. Scaling resources for sector response.`
                                ) : (
                                    `SECURE_BASELINE: Trend analysis indicates a stabilize or slight decrease in localized threats. Current force posture is sufficient.`
                                )}
                            </p>
                        </div>
                        <button className="w-full py-4 bg-blue-600 dark:bg-blue-600 text-white font-black rounded-xl text-[10px] uppercase tracking-[0.3em] hover:bg-blue-500 transition-all shadow-[0_10px_20px_rgba(37,99,235,0.2)] hover:shadow-blue-500/40 border border-blue-400/30">
                            Generate Full Strategic Report
                        </button>
                    </div>
                    <div className="w-48 h-48 rounded-full border-8 border-white/5 flex flex-col items-center justify-center relative group shrink-0">
                        <div className="absolute inset-0 border-8 border-blue-600 rounded-full shadow-[0_0_20px_rgba(59,130,246,0.3)]" style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 0 85%)' }} />
                        <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tighter">85%</span>
                        <span className="text-[9px] font-black text-slate-400 dark:text-white/30 tracking-widest uppercase mt-1">Confidence</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
