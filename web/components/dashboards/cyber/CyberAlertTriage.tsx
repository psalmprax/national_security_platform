import React from 'react';
import { ShieldAlert } from 'lucide-react';
import { Alert } from '../../../lib/api';

interface CyberAlertTriageProps {
    alerts: Alert[];
    onSelect: (alert: Alert) => void;
    filterMode: 'all' | 'secure' | 'active' | 'signal';
    setActiveView: (view: any) => void;
    isAlertRedacted: (alert: Alert | null) => boolean;
}

export default function CyberAlertTriage({
    alerts,
    onSelect,
    filterMode,
    setActiveView,
    isAlertRedacted
}: CyberAlertTriageProps) {
    return (
        <div className="w-full h-full overflow-y-auto scrollbar-cyber">
            <div className="w-full max-w-6xl mx-auto p-8">
                <h2 className="text-2xl font-black tracking-wider text-white mb-6 uppercase">
                    Alert Triage {filterMode !== 'all' && <span className="text-[#00FF95] text-sm ml-2">[{filterMode.toUpperCase()}_FILTER]</span>}
                </h2>
                <div className="grid gap-4">
                    {(alerts || []).length === 0 ? (
                        <div className="glass-card p-8 text-center border border-white/5">
                            <p className="text-white/40 text-sm">No alerts match the current filter</p>
                        </div>
                    ) : (
                        (alerts || []).map((alert) => (
                            <div
                                key={alert.id}
                                onClick={() => {
                                    onSelect(alert);
                                    setActiveView('map');
                                }}
                                className="glass-card p-6 border border-white/5 hover:border-[#00FF95]/20 hover:bg-white/5 transition-all cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className={`w-3 h-3 rounded-full ${alert.severity > 0.8 ? 'bg-red-500 animate-pulse' : alert.severity > 0.6 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                                        <h3 className="text-white font-bold text-lg uppercase tracking-wide group-hover:text-[#00FF95] transition-colors">{alert.type}</h3>
                                    </div>
                                    <span className="text-xs text-white/40 font-mono">{new Date(alert.timestamp).toLocaleString()}</span>
                                </div>
                                {isAlertRedacted(alert) ? (
                                    <div className="bg-red-500/10 border border-red-500/20 p-2 rounded-lg mb-3 inline-flex flex-col gap-2">
                                        <div className="flex items-center gap-2">
                                            <ShieldAlert className="w-3 h-3 text-red-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-red-500 italic">Description Redacted [Clearance Required]</span>
                                        </div>
                                        <div className="space-y-1 opacity-20 blur-[2px] select-none pointer-events-none">
                                            <div className="h-1.5 bg-red-500/20 rounded w-48" />
                                            <div className="h-1.5 bg-red-500/20 rounded w-40" />
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-white/70 mb-3 line-clamp-2">{alert.content}</p>
                                )}
                                <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
                                    <span className="group-hover:text-white transition-colors">
                                        📍 {(alert.lga_name && alert.lga_name !== 'Unknown') ? `${alert.lga_name}, ${alert.state_name}` : alert.location}
                                    </span>
                                    {alert.isTrusted && <span className="text-[#00FF95]">✓ VERIFIED</span>}
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
