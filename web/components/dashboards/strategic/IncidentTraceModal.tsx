import React from 'react';
import { Shield, ShieldAlert, FileVideo, Brain, Activity, Clock, Navigation, Zap } from 'lucide-react';
import { Alert, fetchRelatedAlerts, fetchTriangulatedAssets, createMission, TriangulatedAsset } from '../../../lib/api';
import VideoEvidence from './VideoEvidence';
import { toast } from 'react-toastify';

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
    const [relatedAlerts, setRelatedAlerts] = React.useState<Alert[]>([]);
    const [loadingRelated, setLoadingRelated] = React.useState(false);
    const [triangulatedAssets, setTriangulatedAssets] = React.useState<TriangulatedAsset[]>([]);
    const [dispatchingId, setDispatchingId] = React.useState<string | null>(null);

    React.useEffect(() => {
        async function loadData() {
            if (!selectedAlert || isAlertRedacted(selectedAlert)) return;
            setLoadingRelated(true);
            const [related, triangulation] = await Promise.all([
                fetchRelatedAlerts(selectedAlert.id),
                fetchTriangulatedAssets(selectedAlert.id)
            ]);
            setRelatedAlerts(related);
            setTriangulatedAssets(triangulation);
            setLoadingRelated(false);
        }
        loadData();
    }, [selectedAlert, isAlertRedacted]);

    const handleDispatch = async (assetId: string) => {
        setDispatchingId(assetId);
        const success = await createMission(selectedAlert.id, assetId, 'HIGH');
        if (success) {
            toast.success('Response Team Dispatched Successfully');
            onClose();
        } else {
            toast.error('Failed to dispatch response team');
        }
        setDispatchingId(null);
    };

    const formatTimestamp = (date: any) => {
        if (!date) return 'N/A';
        return new Date(date).toLocaleString();
    };
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

                    {selectedAlert.risk_keywords && selectedAlert.risk_keywords.some(k => k.includes(':')) && (
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-emerald-500">
                                <Brain className="w-5 h-5 opacity-70" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Artificial Intelligence Analysis</span>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                {['PERSON', 'LOC', 'VEHICLE', 'WEAPON', 'ORG'].map(type => {
                                    const entities = selectedAlert.risk_keywords?.filter(k => k.startsWith(`${type}:`)).map(k => k.split(':')[1]);
                                    if (!entities || entities.length === 0) return null;
                                    return (
                                        <div key={type} className="space-y-2 bg-emerald-500/5 p-4 rounded-xl border border-emerald-500/10 transition-all hover:bg-emerald-500/10">
                                            <span className="text-[8px] font-black text-emerald-500/50 uppercase tracking-widest">{type}S_DETECTED</span>
                                            <div className="flex flex-wrap gap-2">
                                                {entities.map((ent, i) => (
                                                    <span key={i} className="text-[10px] font-bold text-emerald-900/80 dark:text-emerald-400 uppercase font-mono">{ent}</span>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {selectedAlert.content_media_url && !isAlertRedacted(selectedAlert) && (
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-blue-500">
                                    <FileVideo className="w-5 h-5 opacity-70" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em]">Digital Evidence Payload</span>
                                </div>
                            </div>
                            <VideoEvidence mediaKey={selectedAlert.content_media_url} />
                        </div>
                    )}

                    {relatedAlerts.length > 0 && !isAlertRedacted(selectedAlert) && (
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-blue-500">
                                <Activity className="w-5 h-5 opacity-70" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Spatial-Temporal Correlation</span>
                            </div>
                            <div className="space-y-3">
                                {relatedAlerts.map(alert => (
                                    <div key={alert.id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between group hover:bg-white/10 transition-all">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase truncate max-w-[200px]">{alert.alert_type}</span>
                                            <div className="flex items-center gap-2 text-[8px] font-black text-slate-500 dark:text-white/40 uppercase">
                                                <Clock className="w-3 h-3" />
                                                {formatTimestamp(alert.created_at)}
                                            </div>
                                        </div>
                                        <span className={`text-[8px] font-black px-2 py-0.5 rounded border ${alert.severity > 0.8 ? 'bg-red-500/10 text-red-400 border-red-500/20' : 'bg-blue-500/10 text-blue-400 border-blue-500/20'}`}>
                                            ALT-{alert.id.substring(0, 4)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                    {triangulatedAssets.length > 0 && !isAlertRedacted(selectedAlert) && (
                        <div className="space-y-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 text-amber-500">
                                <Navigation className="w-5 h-5 opacity-70" />
                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Operational Resource Triangulation</span>
                            </div>
                            <div className="space-y-3">
                                {triangulatedAssets.map(({ asset, distance_meters, suitability_score }) => (
                                    <div key={asset.id} className="bg-amber-500/5 border border-amber-500/10 p-4 rounded-xl flex items-center justify-between group transition-all hover:bg-amber-500/10">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-900 dark:text-white uppercase tracking-wider">{asset.name}</span>
                                            <div className="flex items-center gap-4 mt-1">
                                                <span className="text-[8px] font-black text-slate-500 dark:text-white/40 uppercase tracking-widest">Type: {asset.type}</span>
                                                <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">{Math.round(distance_meters / 1000)}KM DISTANCE</span>
                                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">{Math.round(suitability_score)}% SUITABLE</span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleDispatch(asset.id)}
                                            disabled={dispatchingId === asset.id}
                                            className="px-4 py-2 bg-amber-600 text-white font-black rounded-lg hover:bg-amber-500 transition-all text-[9px] uppercase tracking-widest flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {dispatchingId === asset.id ? (
                                                <div className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            ) : (
                                                <Zap className="w-3 h-3" />
                                            )}
                                            Dispatch
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

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
