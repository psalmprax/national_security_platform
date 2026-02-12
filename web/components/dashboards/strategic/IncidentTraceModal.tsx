import React from 'react';
import { Shield, ShieldAlert } from 'lucide-react';
import { Alert } from '../../../lib/api';

interface IncidentTraceModalProps {
    selectedAlert: Alert;
    onClose: () => void;
    isAlertRedacted: (alert: Alert | null) => boolean;
}

export default function IncidentTraceModal({
    selectedAlert,
    onClose,
    isAlertRedacted
}: IncidentTraceModalProps) {
    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
            <div className="glass-card-premium w-full max-w-2xl overflow-hidden animate-in zoom-in-95 duration-200 shadow-[0_0_50px_rgba(0,0,0,0.5)] border-white/20">
                <div className="p-8 border-b border-white/10 flex justify-between items-center bg-white/5 relative">
                    <div className="absolute top-0 left-0 w-full h-0.5 bg-blue-500" />
                    <div>
                        <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Intelligence Record Detail</h2>
                        <p className="text-[10px] text-slate-500 dark:text-white/30 font-black font-mono mt-1 uppercase tracking-widest">TRACE_ID: {selectedAlert.id}</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition-all border border-white/10"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-10 space-y-10">
                    <div className="grid grid-cols-2 gap-10">
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Classification</span>
                            <div className="flex items-center gap-3">
                                <div className={`w-2 h-2 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.3)] ${selectedAlert.severity > 0.8 ? 'bg-red-500 glow-red' : 'bg-blue-500 glow-blue'}`} />
                                <span className="font-black text-slate-900 dark:text-white uppercase tracking-wider text-xs">{selectedAlert.type || 'Standard'}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Temporal Data</span>
                            <p className="font-bold text-slate-900 dark:text-white text-xs font-mono">{new Date(selectedAlert.timestamp).toLocaleString()}</p>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Spatial Vector</span>
                            <p className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-widest">
                                {isAlertRedacted(selectedAlert) ? (
                                    <span className="text-red-500 font-black tracking-widest">[REDACTED_SECTOR]</span>
                                ) : (
                                    selectedAlert.location
                                )}
                            </p>
                        </div>
                        <div className="space-y-2">
                            <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Source_Trust</span>
                            <div className="flex items-center gap-2">
                                {selectedAlert.isTrusted ? (
                                    <span className="text-[9px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20 uppercase tracking-widest">VERIFIED_IDENTITY</span>
                                ) : (
                                    <span className="text-[9px] font-black text-amber-500 bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20 uppercase tracking-widest">PENDING_AUDIT</span>
                                )}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <span className="text-[9px] font-black text-slate-400 dark:text-white/20 uppercase tracking-[0.2em]">Intelligence Payload</span>
                        {isAlertRedacted(selectedAlert) ? (
                            <div className="bg-red-500/5 rounded-2xl p-6 border border-red-500/20">
                                <div className="flex items-center gap-2 mb-3">
                                    <ShieldAlert className="w-4 h-4 text-red-500" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-red-500">Encrypted Payload Locked</span>
                                </div>
                                <p className="text-xs text-red-900/60 dark:text-red-400/60 leading-relaxed font-bold italic">
                                    Payload is guarded by sovereign-level encryption or was submitted under duress conditions. Access requires Level 5 Strategic clearance and physical duress override keys.
                                </p>
                                <div className="mt-4 space-y-2 opacity-5 blur-[2px] select-none">
                                    <div className="h-2 bg-red-500 rounded w-full" />
                                    <div className="h-2 bg-red-500 rounded w-5/6" />
                                </div>
                            </div>
                        ) : (
                            <div className="bg-blue-500/5 rounded-2xl p-6 border border-blue-500/10 text-slate-700 dark:text-white/70 leading-relaxed font-bold italic text-sm font-mono">
                                "{selectedAlert.content}"
                            </div>
                        )}
                    </div>

                    <div className="space-y-4 pt-4 border-t border-white/10">
                        <div className="flex items-center gap-2 text-blue-500">
                            <Shield className="w-5 h-5 opacity-70" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Cryptographic Proof of Sovereignty</span>
                        </div>
                        <div className="bg-black/40 rounded-xl p-5 font-mono text-[9px] border border-white/5">
                            <p className="text-slate-400 dark:text-white/20 mb-2 uppercase font-black">CONTENT_SHA256_HASH:</p>
                            <p className="text-blue-500 dark:text-blue-400/80 break-all mb-4 leading-normal">e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855</p>
                            <p className="text-slate-400 dark:text-white/20 mb-2 uppercase font-black">BLOCK_COMMIT_REFERENCE:</p>
                            <p className="text-blue-500 dark:text-blue-400/80 uppercase font-black">NG-SOVEREIGN-TX-{selectedAlert.id.substring(0, 12)}</p>
                        </div>
                    </div>
                </div>
                <div className="p-8 bg-white/5 border-t border-white/10 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 py-3 bg-blue-600 text-white font-black rounded-xl hover:bg-blue-500 transition-all text-[10px] uppercase tracking-[0.3em] shadow-[0_10px_20px_rgba(37,99,235,0.2)] border border-blue-400/30"
                    >
                        Close Intelligence Record
                    </button>
                </div>
            </div>
        </div>
    );
}
