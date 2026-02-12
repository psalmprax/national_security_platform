import React from 'react';
import { Shield } from 'lucide-react';
import { Mission } from '../../../lib/api';

interface StrategicKPIsProps {
    alertsCount: number;
    missions: Mission[];
    systemIntegrity: number;
    criticalCount: number;
    recentTrend: number;
}

export default function StrategicKPIs({
    alertsCount,
    missions,
    systemIntegrity,
    criticalCount,
    recentTrend
}: StrategicKPIsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="glass-card-premium p-6 flex flex-col hover:scale-[1.02] transition-transform">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-white/40 mb-2 tracking-[0.2em]">Total Incidents</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{alertsCount}</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">▲ {recentTrend} recent</span>
                </div>
            </div>

            <div className="glass-card-premium p-6 flex flex-col relative overflow-hidden group hover:scale-[1.02] transition-transform">
                <div className={`absolute top-0 right-0 w-1 h-full ${criticalCount > 0 ? 'bg-red-500 animate-pulse' : 'bg-slate-200/20'}`} />
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-white/40 mb-2 tracking-[0.2em]">Critical Threats</span>
                <div className="flex items-baseline gap-2">
                    <span className={`text-3xl font-black ${criticalCount > 0 ? 'text-red-500' : 'text-slate-900 dark:text-white'}`}>{criticalCount}</span>
                    {criticalCount > 0 && <span className="text-[9px] font-black text-red-500 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20 uppercase tracking-tighter">Action Required</span>}
                </div>
            </div>

            <div className="glass-card-premium p-6 flex flex-col hover:scale-[1.02] transition-transform">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-white/40 mb-2 tracking-[0.2em]">Active Missions</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">{missions.length}</span>
                    <span className="text-[10px] font-bold text-emerald-500 uppercase">● {missions.filter(m => m.status === 'ON_SITE').length} On-Site</span>
                </div>
            </div>

            <div className="glass-card-premium p-6 flex flex-col hover:scale-[1.02] transition-transform">
                <span className="text-[10px] font-black uppercase text-slate-400 dark:text-white/40 mb-2 tracking-[0.2em]">System Integrity</span>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-slate-900 dark:text-white">
                        {systemIntegrity.toFixed(1)}%
                    </span>
                    <Shield className={`w-5 h-5 ml-auto ${systemIntegrity > 90 ? 'text-blue-500' : 'text-amber-500'}`} />
                </div>
            </div>
        </div>
    );
}
