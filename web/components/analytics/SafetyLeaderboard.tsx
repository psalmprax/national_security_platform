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

    const sortedScores = [...scores]
        .filter(s =>
            s.lga_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.state_name.toLowerCase().includes(searchTerm.toLowerCase())
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
        <div className="flex flex-col h-full bg-black/40 backdrop-blur-md rounded-2xl border border-white/5 overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center border border-cyan-500/30">
                        <Shield className="w-5 h-5 text-cyan-400" />
                    </div>
                    <div>
                        <h3 className="text-sm font-black text-white uppercase tracking-wider">Safety Leaderboard</h3>
                        <p className="text-[10px] text-white/40 font-mono uppercase">National Security Index</p>
                    </div>
                </div>

                <div className="relative">
                    <Search className="w-4 h-4 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                        type="text"
                        placeholder="SEARCH LOCAL GOV..."
                        className="bg-black/60 border border-white/10 rounded-lg pl-10 pr-4 py-2 text-[10px] text-white font-mono uppercase focus:border-cyan-500/50 outline-none w-48 transition-all"
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
                        <thead className="sticky top-0 bg-[#0A0A0A]/95 z-10">
                            <tr className="border-b border-white/5">
                                <th onClick={() => handleSort('lga_name')} className="p-4 text-[10px] font-bold text-white/40 uppercase cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center gap-2">LGA / State <ArrowUpDown className="w-3 h-3" /></div>
                                </th>
                                <th onClick={() => handleSort('safety_score')} className="p-4 text-[10px] font-bold text-white/40 uppercase text-center cursor-pointer hover:text-white transition-colors">
                                    <div className="flex items-center justify-center gap-2">Index <ArrowUpDown className="w-3 h-3" /></div>
                                </th>
                                <th className="p-4 text-[10px] font-bold text-white/40 uppercase text-right">Trend</th>
                            </tr>
                        </thead>
                        <tbody>
                            {sortedScores.map((s, idx) => (
                                <tr key={s.lga_code} className="border-b border-white/5 hover:bg-white/5 transition-colors group">
                                    <td className="p-4">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-white tracking-tight">{s.lga_name}</span>
                                            <span className="text-[10px] text-white/40 uppercase font-mono">{s.state_name}</span>
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <div className="flex flex-col items-center gap-1">
                                            <div className={`px-2 py-0.5 rounded text-[10px] font-black border uppercase ${getRiskStyles(s.risk_level)}`}>
                                                {s.safety_score}%
                                            </div>
                                            <span className="text-[8px] text-white/20 uppercase font-bold tracking-tighter truncate max-w-[80px]">
                                                {s.risk_level.replace('_', ' ')}
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
            <div className="p-4 bg-white/5 flex items-center justify-between text-[9px] font-mono text-white/40">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                        <span className="uppercase">Safe LGAs</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500" />
                        <span className="uppercase">Critical</span>
                    </div>
                </div>
                <div className="uppercase tracking-tighter">
                    Last Computed: {new Date().toLocaleTimeString()}
                </div>
            </div>
        </div>
    );
}
