"use client";

import React, { useState, useEffect } from 'react';
import { Ghost, CheckCircle2, XCircle, Clock, MapPin, Eye, ExternalLink } from 'lucide-react';
import { fetchAnonymousTips, verifyTip, AnonymousTip } from '../../lib/api';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'react-toastify';

export default function AnonymousTipFeed() {
    const [tips, setTips] = useState<AnonymousTip[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');

    useEffect(() => {
        loadTips();
        const interval = setInterval(loadTips, 15000); // 15s refresh
        return () => clearInterval(interval);
    }, []);

    const loadTips = async () => {
        const data = await fetchAnonymousTips();
        setTips(data);
        setLoading(false);
    };

    const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
        const success = await verifyTip(id, status);
        if (success) {
            toast.success(`TIP ${status.toUpperCase()}`);
            loadTips();
        } else {
            toast.error('VERIFICATION FAILED');
        }
    };

    const filteredTips = tips.filter(t => filter === 'all' || t.verification_status === filter);

    const getThreatColor = (type: string) => {
        switch (type?.toLowerCase()) {
            case 'terrorism': return 'text-red-500';
            case 'kidnapping': return 'text-orange-500';
            case 'robbery': return 'text-yellow-500';
            default: return 'text-cyan-500';
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#050505]/60 backdrop-blur-xl rounded-2xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                        <Ghost className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Secret Inteligience (Tips)</h3>
                        <p className="text-[10px] text-white/40 font-mono uppercase">Unverified Crowdsourced Data</p>
                    </div>
                </div>

                <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                    {['pending', 'verified', 'all'].map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f as any)}
                            className={`px-3 py-1 text-[9px] font-black uppercase rounded-md transition-all ${filter === f ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                        >
                            {f}
                        </button>
                    ))}
                </div>
            </div>

            {/* Feed */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
                {loading ? (
                    <div className="flex flex-col items-center justify-center py-20 gap-4">
                        <div className="w-8 h-8 border-2 border-white/5 border-t-purple-500 rounded-full animate-spin" />
                        <span className="text-[10px] text-white/40 font-mono uppercase animate-pulse">Scanning Secure Channel...</span>
                    </div>
                ) : filteredTips.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 opacity-20">
                        <Ghost className="w-12 h-12 mb-4" />
                        <span className="text-[10px] text-white font-mono uppercase">Channel Silent</span>
                    </div>
                ) : (
                    filteredTips.map((tip) => (
                        <div
                            key={tip.id}
                            className={`p-4 rounded-xl border transition-all hover:bg-white/5 ${tip.verification_status === 'verified' ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/5'}`}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div className="flex items-center gap-2">
                                    <span className={`text-[10px] font-black uppercase px-2 py-0.5 rounded bg-white/5 border border-white/10 ${getThreatColor(tip.threat_type)}`}>
                                        {tip.threat_type || 'GENERAL'}
                                    </span>
                                    <span className="text-[9px] text-white/20 font-mono">
                                        ID: {tip.id.substring(0, 8)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-white/40 font-mono italic">
                                    <Clock className="w-3 h-3" />
                                    {formatDistanceToNow(new Date(tip.created_at))} ago
                                </div>
                            </div>

                            <p className="text-sm text-white/80 leading-relaxed mb-4">
                                {tip.tip_content}
                            </p>

                            {tip.location_description && (
                                <div className="flex items-center gap-2 text-[10px] text-cyan-400 font-bold uppercase mb-4">
                                    <MapPin className="w-3 h-3" />
                                    {tip.location_description}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                <div className="flex gap-2">
                                    {tip.media_urls && tip.media_urls.length > 0 && (
                                        <button className="flex items-center gap-1 text-[9px] font-black uppercase px-2 py-1 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded border border-white/5 transition-all">
                                            <ExternalLink className="w-3 h-3" />
                                            Evidence ({tip.media_urls.length})
                                        </button>
                                    )}
                                </div>

                                {tip.verification_status === 'pending' && (
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleVerify(tip.id, 'rejected')}
                                            className="flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-black rounded-lg border border-red-500/20 transition-all"
                                        >
                                            <XCircle className="w-3 h-3" />
                                            Dismiss
                                        </button>
                                        <button
                                            onClick={() => handleVerify(tip.id, 'verified')}
                                            className="flex items-center gap-1.5 text-[9px] font-black uppercase px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-black rounded-lg transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)]"
                                        >
                                            <CheckCircle2 className="w-3 h-3" />
                                            Verify Alert
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* System Status Footer */}
            <div className="p-3 bg-white/5 flex items-center justify-between text-[8px] font-mono text-white/20 uppercase tracking-widest">
                <span>Threat Channel Encrypted [AES-256]</span>
                <span className="text-cyan-500 animate-pulse">Monitoring Live Feeds...</span>
            </div>
        </div>
    );
}
