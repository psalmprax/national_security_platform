'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Shield, Link2, CheckCircle, AlertTriangle, RefreshCw, Hash, Clock, ChevronDown } from 'lucide-react';
import { fetchEvidenceLedger, verifyEvidenceHash, EvidenceLedgerEntry } from '../../../lib/api';

export default function EvidenceLedger() {
    const [entries, setEntries] = useState<EvidenceLedgerEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [verifying, setVerifying] = useState<string | null>(null);
    const [verifiedHashes, setVerifiedHashes] = useState<Record<string, boolean>>({});
    const [expandedEntry, setExpandedEntry] = useState<string | null>(null);

    const loadLedger = useCallback(async () => {
        setLoading(true);
        const data = await fetchEvidenceLedger();
        setEntries(data);
        setLoading(false);
    }, []);

    useEffect(() => { loadLedger(); }, [loadLedger]);

    const handleVerify = async (hash: string) => {
        setVerifying(hash);
        const result = await verifyEvidenceHash(hash);
        if (result) {
            setVerifiedHashes(prev => ({ ...prev, [hash]: result.chain_valid }));
        }
        setVerifying(null);
    };

    const formatTime = (iso: string) => {
        try { return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', year: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
        catch { return iso; }
    };

    return (
        <div className="w-full h-full overflow-y-auto scrollbar-cyber pointer-events-auto">
            <div className="w-full max-w-6xl mx-auto p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                            <Link2 className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black tracking-wider text-white uppercase">Evidence Ledger</h2>
                            <p className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Immutable Chain-Linked Audit Trail</p>
                        </div>
                    </div>
                    <button onClick={loadLedger} className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded text-[10px] text-white/50 uppercase tracking-widest font-bold transition-all">
                        <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
                        Refresh
                    </button>
                </div>

                {/* Stats Bar */}
                <div className="grid grid-cols-3 gap-3 mb-6">
                    {[
                        { label: 'Total Records', value: entries.length, icon: Hash, color: 'text-cyan-400' },
                        { label: 'Chain Verified', value: Object.values(verifiedHashes).filter(Boolean).length, icon: CheckCircle, color: 'text-emerald-400' },
                        { label: 'Integrity Alerts', value: Object.values(verifiedHashes).filter(v => !v).length, icon: AlertTriangle, color: 'text-red-400' },
                    ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="bg-white/[0.03] border border-white/5 rounded-lg p-3 flex items-center gap-3">
                            <Icon className={`w-4 h-4 ${color}`} />
                            <div>
                                <p className="text-[10px] text-white/30 uppercase tracking-widest font-bold">{label}</p>
                                <p className={`text-lg font-black ${color}`}>{value}</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Loading */}
                {loading && (
                    <div className="flex items-center justify-center py-16">
                        <div className="flex flex-col items-center gap-3">
                            <RefreshCw className="w-6 h-6 text-amber-400 animate-spin" />
                            <span className="text-[10px] text-white/30 uppercase tracking-[0.2em] font-bold">Querying Ledger Chain...</span>
                        </div>
                    </div>
                )}

                {/* Entries */}
                {!loading && entries.length === 0 && (
                    <div className="text-center py-16">
                        <Shield className="w-10 h-10 text-white/10 mx-auto mb-3" />
                        <p className="text-white/30 text-sm font-bold uppercase tracking-widest">No Evidence Records Found</p>
                        <p className="text-white/15 text-xs mt-1">Chain is empty — waiting for first evidence submission</p>
                    </div>
                )}

                {!loading && entries.length > 0 && (
                    <div className="space-y-2">
                        {entries.map((entry, idx) => (
                            <div key={entry.id} className="bg-white/[0.02] border border-white/5 rounded-lg overflow-hidden hover:border-amber-500/20 transition-all">
                                {/* Main Row */}
                                <div className="flex items-center gap-4 px-4 py-3 cursor-pointer" onClick={() => setExpandedEntry(expandedEntry === entry.id ? null : entry.id)}>
                                    {/* Chain Index */}
                                    <div className="flex-shrink-0 w-8 h-8 bg-amber-500/10 border border-amber-500/20 rounded flex items-center justify-center">
                                        <span className="text-[10px] font-black text-amber-400">#{idx + 1}</span>
                                    </div>

                                    {/* Entity Info */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider bg-cyan-500/10 px-1.5 py-0.5 rounded">{entry.entity_type}</span>
                                            <span className="text-[10px] text-white/30 font-mono truncate">{entry.entity_id.slice(0, 8)}...</span>
                                        </div>
                                    </div>

                                    {/* Hash Preview */}
                                    <div className="hidden md:flex items-center gap-1">
                                        <Hash className="w-3 h-3 text-white/20" />
                                        <span className="text-[10px] font-mono text-white/30">{entry.content_hash.slice(0, 16)}...</span>
                                    </div>

                                    {/* Verify Button */}
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleVerify(entry.content_hash); }}
                                        disabled={verifying === entry.content_hash}
                                        className={`flex-shrink-0 flex items-center gap-1 px-2 py-1 rounded text-[9px] font-bold uppercase tracking-wider transition-all ${verifiedHashes[entry.content_hash] === true ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                                            verifiedHashes[entry.content_hash] === false ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                                'bg-white/5 text-white/40 border border-white/10 hover:text-amber-400 hover:border-amber-500/30'
                                            }`}
                                    >
                                        {verifying === entry.content_hash ? <RefreshCw className="w-3 h-3 animate-spin" /> :
                                            verifiedHashes[entry.content_hash] === true ? <CheckCircle className="w-3 h-3" /> :
                                                verifiedHashes[entry.content_hash] === false ? <AlertTriangle className="w-3 h-3" /> :
                                                    <Shield className="w-3 h-3" />}
                                        {verifiedHashes[entry.content_hash] === true ? 'Verified' : verifiedHashes[entry.content_hash] === false ? 'Broken' : 'Verify'}
                                    </button>

                                    {/* Timestamp */}
                                    <div className="hidden sm:flex items-center gap-1 flex-shrink-0">
                                        <Clock className="w-3 h-3 text-white/15" />
                                        <span className="text-[10px] text-white/25 font-mono">{formatTime(entry.created_at)}</span>
                                    </div>

                                    <ChevronDown className={`w-3.5 h-3.5 text-white/20 transition-transform ${expandedEntry === entry.id ? 'rotate-180' : ''}`} />
                                </div>

                                {/* Expanded Details */}
                                {expandedEntry === entry.id && (
                                    <div className="px-4 pb-4 border-t border-white/5 pt-3 space-y-2">
                                        <div className="grid grid-cols-2 gap-3 text-[10px]">
                                            <div>
                                                <span className="text-white/20 uppercase tracking-wider font-bold block mb-1">Content Hash</span>
                                                <span className="text-amber-400 font-mono break-all">{entry.content_hash}</span>
                                            </div>
                                            <div>
                                                <span className="text-white/20 uppercase tracking-wider font-bold block mb-1">Previous Hash</span>
                                                <span className={`font-mono break-all ${entry.previous_hash === 'GENESIS' ? 'text-emerald-400' : 'text-cyan-400'}`}>
                                                    {entry.previous_hash === 'GENESIS' ? '🔗 GENESIS BLOCK' : entry.previous_hash}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-white/20 uppercase tracking-wider font-bold block mb-1">Recorded By</span>
                                                <span className="text-white/50 font-mono">{entry.recorded_by || 'SYSTEM'}</span>
                                            </div>
                                            <div>
                                                <span className="text-white/20 uppercase tracking-wider font-bold block mb-1">Entity ID</span>
                                                <span className="text-white/50 font-mono">{entry.entity_id}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
