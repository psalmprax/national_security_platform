import React from 'react';
import { Shield } from 'lucide-react';
import { User } from '../../../lib/AuthContext';

interface StrategicProfileProps {
    user: User | null;
}

export default function StrategicProfile({ user }: StrategicProfileProps) {
    return (
        <div className="max-w-4xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
            <div className="glass-card-premium p-12 overflow-hidden relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-cyan-400 to-blue-600" />
                <div className="flex flex-col md:flex-row items-center gap-8 mb-12 pb-12 border-b border-white/10">
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-white text-4xl font-black shadow-[0_0_30px_rgba(37,99,235,0.4)] shrink-0">
                        {user?.full_name?.charAt(0) || 'A'}
                    </div>
                    <div className="text-center md:text-left">
                        <h1 className="text-4xl font-black text-slate-900 dark:text-white mb-2 uppercase tracking-tight">{user?.full_name || 'Administrator'}</h1>
                        <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                            <span className="bg-blue-500/10 text-blue-500 text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-lg border border-blue-500/20">
                                Primary Authority
                            </span>
                            <span className="text-slate-400 dark:text-white/20 text-[10px] font-black uppercase tracking-widest font-mono">NODE_IDENTITY: {user?.id || 'AUTH_GATEWAY_03'}</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                    <div className="space-y-8">
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em] mb-4">Functional Role</h3>
                            <p className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">{user?.role || 'Strategic Intelligence Officer'}</p>
                            <p className="text-xs text-slate-500 dark:text-white/40 mt-2 font-medium italic">Overseeing national security metrics and cross-agency intelligence coordination.</p>
                        </div>
                        <div>
                            <h3 className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-[0.2em] mb-4">Authorized Clearance</h3>
                            <div className="grid grid-cols-2 gap-3">
                                {['STRAT_VIEW', 'AGENCY_MGMT', 'BIO_AUTH', 'LEGAL_AUDIT'].map((p, i) => (
                                    <div key={i} className="flex items-center gap-2 text-[10px] font-bold text-slate-600 dark:text-white/60 bg-white/5 p-3 rounded-lg border border-white/10 group hover:border-blue-500/30 transition-all">
                                        <div className="w-1.5 h-1.5 bg-blue-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.6)]" />
                                        {p}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="bg-blue-500/5 p-8 rounded-2xl border border-blue-500/10 relative">
                        <Shield className="w-8 h-8 text-blue-500 mb-4 opacity-50" />
                        <h3 className="font-black text-slate-900 dark:text-white mb-2 uppercase text-xs tracking-widest">Account Security</h3>
                        <p className="text-xs text-slate-500 dark:text-white/40 mb-8 leading-relaxed font-medium">Your account is protected by hardware-bound PKI and multi-factor biometric authentication.</p>
                        <div className="space-y-4">
                            <p className="text-slate-400 dark:text-white/20 text-[9px] font-black mb-2 uppercase tracking-[0.2em] font-mono">Platform Integrity Score</p>
                            <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter mb-1">
                                <span className="text-slate-500 dark:text-white/40">Auth Level</span>
                                <span className="text-blue-500">98% SECURE</span>
                            </div>
                            <div className="w-full h-2 bg-black/20 dark:bg-white/5 rounded-full overflow-hidden border border-white/5">
                                <div className="h-full bg-gradient-to-r from-blue-600 to-blue-400 w-[98%] shadow-[0_0_15px_rgba(37,99,235,0.3)]" />
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
