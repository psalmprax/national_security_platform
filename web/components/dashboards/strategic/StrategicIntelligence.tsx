import React from 'react';
import { Mail, ShieldCheck, ShieldAlert, CheckCircle2, XCircle, Search, Filter } from 'lucide-react';
import { AnonymousTip, fetchAnonymousTips, verifyTip } from '../../../lib/api';

export default function StrategicIntelligence() {
    const [tips, setTips] = React.useState<AnonymousTip[]>([]);
    const [loading, setLoading] = React.useState(true);
    const [filter, setFilter] = React.useState<'all' | 'pending' | 'verified' | 'rejected'>('pending');
    const [searchQuery, setSearchQuery] = React.useState('');

    const loadTips = React.useCallback(async () => {
        try {
            setLoading(true);
            const data = await fetchAnonymousTips();
            setTips(data);
        } catch (error) {
            console.error('Failed to load tips:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    React.useEffect(() => {
        loadTips();
    }, [loadTips]);

    const handleVerify = async (id: string, status: 'verified' | 'rejected') => {
        const success = await verifyTip(id, status);
        if (success) {
            loadTips();
        }
    };

    const filteredTips = (tips || []).filter(tip => {
        const matchesFilter = filter === 'all' || tip.verification_status.toLowerCase() === filter.toLowerCase();
        const matchesSearch = tip.tip_content.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tip.threat_type.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesFilter && matchesSearch;
    });

    return (
        <div className="max-w-6xl mx-auto animate-in slide-in-from-bottom-4 duration-500 space-y-8">
            <div className="glass-card-premium overflow-hidden">
                <div className="px-8 py-6 border-b border-white/10 bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Intelligence Review Queue</h1>
                        <p className="text-[10px] text-slate-500 dark:text-white/30 font-black font-mono mt-1 uppercase tracking-widest">CIVILIAN_ANONYMOUS_INPUT_CHANNEL</p>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Search Intel..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-white/5 border border-white/10 rounded-lg pl-9 pr-4 py-2 text-[10px] font-black uppercase tracking-wider text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 transition-all"
                            />
                        </div>
                        <div className="flex bg-white/5 border border-white/10 rounded-lg p-1">
                            {['Pending', 'Verified', 'Rejected'].map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f.toLowerCase() as any)}
                                    className={`px-3 py-1.5 rounded-md text-[9px] font-black uppercase tracking-widest transition-all ${filter === f.toLowerCase() ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-500 dark:text-white/40 hover:text-white'}`}
                                >
                                    {f}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-white/5 border-b border-white/10">
                            <tr className="text-[10px] font-black text-slate-400 dark:text-white/30 uppercase tracking-[0.2em]">
                                <th className="px-8 py-5">Intel Content</th>
                                <th className="px-8 py-5">Classification</th>
                                <th className="px-8 py-5">Temporal Data</th>
                                <th className="px-8 py-5 text-right">Operational Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
                                    </td>
                                </tr>
                            ) : filteredTips.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-8 py-20 text-center">
                                        <div className="flex flex-col items-center gap-4 text-slate-400 dark:text-white/20">
                                            <Mail className="w-12 h-12 opacity-20" />
                                            <span className="text-xs font-black uppercase tracking-widest">No intelligence in current view</span>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredTips.map((tip) => (
                                    <tr key={tip.id} className="hover:bg-white/5 transition-colors group">
                                        <td className="px-8 py-6 max-w-md">
                                            <p className="text-xs font-bold text-slate-900 dark:text-white/80 leading-relaxed italic line-clamp-2">"{tip.tip_content}"</p>
                                        </td>
                                        <td className="px-8 py-6">
                                            <span className="inline-flex items-center gap-2 text-[9px] font-black px-3 py-1 rounded-lg border bg-blue-500/10 text-blue-500 border-blue-500/20 uppercase tracking-widest">
                                                {tip.threat_type}
                                            </span>
                                        </td>
                                        <td className="px-8 py-6 text-[10px] font-black font-mono text-slate-500 dark:text-white/40 uppercase">
                                            {new Date(tip.created_at).toLocaleString()}
                                        </td>
                                        <td className="px-8 py-6 text-right">
                                            {tip.verification_status.toLowerCase() === 'pending' ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => handleVerify(tip.id, 'verified')}
                                                        className="p-2 bg-emerald-500/10 text-emerald-500 hover:bg-emerald-500 hover:text-white rounded-lg border border-emerald-500/20 transition-all flex items-center gap-2 group/btn"
                                                    >
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest hidden group-hover/btn:block">Promote</span>
                                                    </button>
                                                    <button
                                                        onClick={() => handleVerify(tip.id, 'rejected')}
                                                        className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg border border-red-500/20 transition-all flex items-center gap-2 group/btn"
                                                    >
                                                        <XCircle className="w-4 h-4" />
                                                        <span className="text-[9px] font-black uppercase tracking-widest hidden group-hover/btn:block">Discard</span>
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className={`text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border ${tip.verification_status.toLowerCase() === 'verified' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                                    {tip.verification_status}
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-card-premium p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 border-l border-b border-white/10 bg-white/5 rounded-bl-2xl">
                        <ShieldCheck className="w-5 h-5 text-emerald-500" />
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-tighter text-lg mb-2">Promote to Operational</h3>
                    <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed font-bold italic mb-6">Verified intelligence tips are automatically correlated with active field reports and may trigger immediate asset triangulation.</p>
                    <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 w-[65%]" />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">Confidence Threshold</span>
                        <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">65% AI_VALIDATED</span>
                    </div>
                </div>

                <div className="glass-card-premium p-8 relative overflow-hidden group">
                    <div className="absolute top-0 right-0 p-4 border-l border-b border-white/10 bg-white/5 rounded-bl-2xl">
                        <ShieldAlert className="w-5 h-5 text-amber-500" />
                    </div>
                    <h3 className="text-slate-900 dark:text-white font-black uppercase tracking-tighter text-lg mb-2">Adversarial Detection</h3>
                    <p className="text-xs text-slate-500 dark:text-white/40 leading-relaxed font-bold italic mb-6">Rejected tips are analyzed for adversarial patterns, disinformation campaigns, and potential duress signatures.</p>
                    <div className="h-1 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[42%]" />
                    </div>
                    <div className="flex justify-between mt-2">
                        <span className="text-[8px] font-black text-slate-400 dark:text-white/20 uppercase tracking-widest">Threat Profile</span>
                        <span className="text-[8px] font-black text-amber-500 uppercase tracking-widest">42% ANOMALY_INDEX</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
