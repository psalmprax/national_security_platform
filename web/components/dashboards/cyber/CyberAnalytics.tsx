import React from 'react';
import { TrendingUp, Activity, Zap, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

export default function CyberAnalytics() {
    return (
        <div className="w-full h-full overflow-y-auto scrollbar-cyber pointer-events-auto">
            <div className="w-full max-w-6xl mx-auto p-8 space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-2xl font-black tracking-wider text-white uppercase">Intelligence Analytics</h2>
                        <p className="text-[#00FF95]/60 text-xs font-mono">NODE_CLUSTER: ABUJA_CENTRAL_INTELLEGENCE</p>
                    </div>
                    <div className="px-4 py-2 bg-[#00FF95]/10 border border-[#00FF95]/20 rounded-lg">
                        <span className="text-[10px] text-[#00FF95] font-black uppercase tracking-widest animate-pulse">Live Feed Active</span>
                    </div>
                </div>

                {/* KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[
                        { label: 'Threat Throughput', value: '1.2k/hr', icon: Zap, color: '#00FF95' },
                        { label: 'Security Integrity', value: '98.4%', icon: ShieldCheck, color: '#60A5FA' },
                        { label: 'Signal Latency', value: '14ms', icon: Activity, color: '#FACC15' },
                        { label: 'Vulnerability Score', value: '0.02', icon: TrendingUp, color: '#EF4444' }
                    ].map((kpi, i) => (
                        <div key={kpi.label} className="glass-card p-6 border border-white/5 bg-white/[0.02]">
                            <kpi.icon className="w-4 h-4 mb-4" style={{ color: kpi.color }} />
                            <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">{kpi.label}</p>
                            <p className="text-xl font-black text-white mt-1 tabular-nums">{kpi.value}</p>
                        </div>
                    ))}
                </div>

                {/* Chart Mockups */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="glass-card p-6 border border-white/5 min-h-[300px] flex flex-col">
                        <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-6">Threat Distribution (24h)</h3>
                        <div className="flex-1 flex items-end gap-3 px-4 pb-4 border-b border-white/5">
                            {[60, 40, 85, 30, 50, 95, 70, 45, 80, 25, 55, 65].map((h, i) => (
                                <div key={i} className="flex-1 group relative">
                                    <div
                                        className="w-full bg-[#00FF95]/20 border-t border-[#00FF95]/40 transition-all group-hover:bg-[#00FF95]/40"
                                        style={{ height: `${h}%` }}
                                    />
                                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap text-[8px] text-[#00FF95]">
                                        {h}% Load
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between mt-4 text-[9px] text-white/20 font-mono">
                            <span>00:00</span>
                            <span>08:00</span>
                            <span>16:00</span>
                            <span>23:59</span>
                        </div>
                    </div>

                    <div className="glass-card p-6 border border-white/5 min-h-[300px] flex flex-col">
                        <h3 className="text-sm font-bold text-white/80 uppercase tracking-widest mb-6">Regional Risk Heatmap</h3>
                        <div className="flex-1 flex flex-col gap-6 justify-center">
                            {[
                                { region: 'NE Nigeria (Borno)', score: 0.92, color: '#EF4444' },
                                { region: 'NW Nigeria (Katsina)', score: 0.75, color: '#F97316' },
                                { region: 'Lake Chad Basin', score: 0.88, color: '#EF4444' },
                                { region: 'Central Hub (FCT)', score: 0.24, color: '#00FF95' }
                            ].map((r) => (
                                <div key={r.region}>
                                    <div className="flex justify-between text-[10px] mb-1.5 uppercase font-bold">
                                        <span className="text-white/60">{r.region}</span>
                                        <span style={{ color: r.color }}>{(r.score * 100).toFixed(0)}% Risk</span>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full"
                                            style={{ width: `${r.score * 100}%`, backgroundColor: r.color }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Matrix Style Scrolling Text */}
                <div className="glass-card p-4 border border-white/5 bg-black/40 font-mono text-[9px] text-[#00FF95]/30 h-24 overflow-hidden relative">
                    <div className="animate-scroll-up">
                        {Array.from({ length: 10 }).map((_, i) => (
                            <p key={i}>
                                ANALYZING_PACKET_STREAM_{Math.random().toString(36).substring(7).toUpperCase()} ... [OK]
                                CROSS_REFERENCING_GEO_DATABASE_{i} ... [OK]
                                ENCRYPTING_TUNNEL_01 ... [SUCCESS]
                            </p>
                        ))}
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes scroll-up {
                    from { transform: translateY(0); }
                    to { transform: translateY(-50%); }
                }
                .animate-scroll-up {
                    animation: scroll-up 10s linear infinite;
                }
            `}</style>
        </div>
    );
}
