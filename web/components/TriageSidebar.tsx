"use client";

import React from 'react';
import { AlertCircle, Clock, CheckCircle2, ShieldAlert, Activity } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

import { Alert } from '../lib/api';

export default function TriageSidebar({ alerts, onSelect, selectedId }: { alerts: Alert[], onSelect?: (alert: Alert) => void, selectedId?: string | null }) {
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    return (
        <aside className="w-96 glass-surface flex flex-col z-30">
            <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <Activity className="w-5 h-5 text-[#00FF95] glow-green" />
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

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4 scrollbar-hide">
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
                            className={`p-5 rounded-2xl bg-white/[0.03] border transition-all duration-500 cursor-pointer group relative overflow-hidden
                                ${selectedId === alert.id ? 'border-[#00FF95] bg-[#00FF95]/5' : 'border-white/5 hover:border-[#00FF95]/30 hover:bg-white/[0.05]'}
                            `}
                        >
                            {/* Threat Progress Bar Background */}
                            <div className="absolute top-0 left-0 h-1 bg-white/5 w-full" />
                            <div
                                className={`absolute top-0 left-0 h-1 transition-all duration-1000 ${alert.severity > 0.8 ? 'bg-[#FF003C] glow-red' : 'bg-[#00FF95] glow-green'}`}
                                style={{ width: `${alert.severity * 100}%` }}
                            />

                            <div className="flex justify-between items-start mb-4">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black tracking-widest uppercase ${alert.severity > 0.8 ? 'text-[#FF003C]' : 'text-[#00FF95]'}`}>
                                            {alert.type}
                                        </span>
                                        {alert.isDuress && (
                                            <span className="bg-[#FF003C]/20 text-[#FF003C] text-[8px] px-1.5 py-0.5 rounded-sm font-bold border border-[#FF003C]/30 tracking-tighter">
                                                DURESS SIGNAL
                                            </span>
                                        )}
                                        {alert.isTrusted ? (
                                            <span className="text-[7px] text-[#00FF95]/40 border border-[#00FF95]/10 px-1 py-0 rounded-sm font-bold tracking-widest">SECURE - VERIFIED</span>
                                        ) : (
                                            <span className="text-[7px] text-[#FF003C]/60 border border-[#FF003C]/20 px-1 py-0 rounded-sm font-bold tracking-widest bg-[#FF003C]/5 animate-pulse">UNTRUSTED - SIG_FAIL</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-white/40 font-mono tracking-tighter uppercase">
                                        LO-CAT: {alert.location}
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
                                    <div className="w-2 h-2 rounded-full bg-[#00FF95] animate-pulse" />
                                    <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">Verified 88%</span>
                                </div>
                                <div className="flex gap-2">
                                    <button className="h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 hover:bg-[#FF003C]/20 hover:border-[#FF003C]/40 transition-all group/btn">
                                        <AlertCircle className="w-3.5 h-3.5 text-white/40 group-hover/btn:text-[#FF003C]" />
                                    </button>
                                    <button className="h-8 w-8 rounded-full flex items-center justify-center bg-white/[0.05] border border-white/10 hover:bg-[#00FF95]/20 hover:border-[#00FF95]/40 transition-all group/btn">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white/40 group-hover/btn:text-[#00FF95]" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <div className="p-6 border-t border-white/5 bg-white/[0.02] backdrop-blur-md">
                <button className="w-full h-12 rounded-xl bg-[#00FF95] text-black text-[11px] font-black tracking-[0.2em] uppercase hover:scale-[1.02] active:scale-[0.98] transition-all glow-green">
                    Generate Sector Report
                </button>
            </div>
        </aside>
    );
}
