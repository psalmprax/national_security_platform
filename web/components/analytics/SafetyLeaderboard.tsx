"use client";

import React, { useState, useEffect } from 'react';
import { Shield, TrendingUp, TrendingDown, Search, ArrowUpDown } from 'lucide-react';
import { fetchSafetyScores, SafetyScore } from '../../lib/api';

export default function SafetyLeaderboard() {
    const [scores, setScores] = useState<SafetyScore[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortConfig, setSortConfig] = useState<{ key: keyof SafetyScore; direction: 'asc' | 'desc' }>({
        key: 'safety_score',
        direction: 'desc'
    });

    useEffect(() => {
        loadScores();
        const interval = setInterval(loadScores, 30000); // Update every 30s
        return () => clearInterval(interval);
    }, []);

    const loadScores = async () => {
        const data = await fetchSafetyScores();
        setScores(data);
        setLoading(false);
    };

    const handleSort = (key: keyof SafetyScore) => {
        let direction: 'asc' | 'desc' = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        }
        setSortConfig({ key, direction });
    };

    const sortedScores = [...(scores || [])]
        .filter(s =>
            (s.lga_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (s.state_name || '').toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            if (a[sortConfig.key] < b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? -1 : 1;
            }
            if (a[sortConfig.key] > b[sortConfig.key]) {
                return sortConfig.direction === 'asc' ? 1 : -1;
            }
            return 0;
        });

    const getRiskStyles = (risk: string) => {
        switch (risk) {
            case 'very_safe': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
            case 'safe': return 'bg-green-500/10 text-green-400 border-green-500/30';
            case 'moderate_risk': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/30';
            case 'high_risk': return 'bg-orange-500/10 text-orange-400 border-orange-500/30';
            case 'critical_risk': return 'bg-red-500/10 text-red-400 border-red-500/30';
            default: return 'bg-slate-500/10 text-slate-400 border-slate-500/30';
        }
    };

    return (
        <div className="flex flex-col h-full glass-card-premium overflow-hidden border-none shadow-2xl">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                        <Shield className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Safety Leaderboard</h3>
                        <p className="text-[10px] text-slate-500 dark:text-white/40 font-black uppercase tracking-widest font-mono">National Security Index</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 dark:text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="SEARCH_LGA..."
                        className="bg-white/5 dark:bg-black/60 border border-slate-200 dark:border-white/10 rounded-lg pl-10 pr-4 py-2 text-[10px] text-slate-900 dark:text-white font-black uppercase tracking-widest focus:border-blue-500/50 outline-none w-48 transition-all"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {loading ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                        <div className="w-8 h-8 border-2 border-white/10 border-t-cyan-500 rounded-full animate-spin" />
                        <span className="text-[10px] text-white/40 font-mono uppercase animate-pulse">Computing Scores...</span>
                    </div>
                ) : sortedScores.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center gap-4 py-20">
                        <span className="text-[10px] text-white/20 font-mono uppercase">No record matches search</span>
                    </div>
                ) : (
                    <table className="w-full text-left border-collapse">
                        <thead className="sticky top-0 bg-white/80 dark:bg-black/80 backdrop-blur-md z-10 border-b border-slate-200 dark:border-white/10">
                            <tr className="border-none">
                                <th onClick={() => handleSort('lga_name')} className="p-4 text-[10px] font-black text-slate-400 dark:text-white/30 uppercase cursor-pointer hover:text-blue-500 transition-colors tracking-widest">
                                    <div className="flex items-center gap-2">LGA / State <ArrowUpDown className="w-3 h-3" /></div>
                                </th>
                                <th onClick={() => handleSort('safety_score')} className="p-4 text-[10px] font-black text-slate-400 dark:text-white/30 uppercase text-center cursor-pointer hover:text-blue-500 transition-colors tracking-widest">
                                    <div className="flex items-center justify-center gap-2">Index <ArrowUpDown className="w-3 h-3" /></div>
                                </th>
                                <th className="p-4 text-[10px] font-black text-slate-400 dark:text-white/30 uppercase text-right tracking-widest">Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedScores.map((s, idx) => (
                                <tr key={s.lga_code} className="border-b border-slate-200/10 dark:border-white/5 hover:bg-blue-500/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 dark:text-white tracking-tight uppercase">{s.lga_name}</span>
                                            <span className="text-[10px] text-slate-500 dark:text-white/30 uppercase font-black tracking-widest opacity-60 font-mono">{s.state_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`px-3 py-1 rounded-lg text-[10px] font-black border uppercase transition-all group-hover:scale-110 ${getRiskStyles(s.risk_level)}`}>
                                                {s.safety_score}%
                                            </div>
                                            <span className="text-[8px] text-slate-400 dark:text-white/20 uppercase font-black tracking-widest truncate max-w-[80px]">
                                                {s.risk_level}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className={`flex items-center justify-end gap-1 text-[10px] font-bold ${s.trend_pct >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                            {s.trend_pct >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                            {Math.abs(s.trend_pct)}%
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Footer Statistics */}
            <div className="p-4 bg-white/5 border-t border-white/10 flex items-center justify-between text-[9px] font-black font-mono text-slate-500 dark:text-white/30">
                <div className="flex items-center gap-6">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                        <span className="uppercase tracking-widest">Safe Zones</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                        <span className="uppercase tracking-widest">Threat_Alert</span>
                    </div>
                </div>
                <div className="uppercase tracking-widest flex items-center gap-2 italic">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    Last_Refresh: {new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
}
