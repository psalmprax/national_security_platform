'use client';
import React, { useState, useCallback, useRef, useEffect } from 'react';
import { Search, X, Loader2, MapPin, Clock, AlertTriangle, ArrowRight, Zap } from 'lucide-react';
import { searchAlerts, SearchResult, formatLabel } from '../lib/api';

interface IntelligenceSearchProps {
    onSelectAlert?: (alertId: string) => void;
}

export default function IntelligenceSearch({ onSelectAlert }: IntelligenceSearchProps) {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [totalResults, setTotalResults] = useState(0);
    const inputRef = useRef<HTMLInputElement>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleSearch = useCallback(async (q: string) => {
        if (q.length < 2) { setResults([]); setTotalResults(0); return; }
        setLoading(true);
        const data = await searchAlerts(q);
        setResults(data);
        setTotalResults(data.length);
        setLoading(false);
    }, []);

    const handleInputChange = (value: string) => {
        setQuery(value);
        setIsOpen(true);
        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => handleSearch(value), 300);
    };

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getPriorityColor = (priority: string) => {
        const p = priority?.toUpperCase();
        if (p === 'CRITICAL') return 'text-red-400 bg-red-500/10 border-red-500/20';
        if (p === 'HIGH') return 'text-orange-400 bg-orange-500/10 border-orange-500/20';
        if (p === 'MEDIUM') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
        return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    };

    const formatTime = (iso: string) => {
        try { return new Date(iso).toLocaleString('en-GB', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); }
        catch { return iso; }
    };

    return (
        <div ref={containerRef} className="relative w-full max-w-xl">
            {/* Search Input */}
            <div className="relative group">
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/10 via-transparent to-amber-500/10 rounded-lg opacity-0 group-focus-within:opacity-100 transition-opacity -m-[1px]" />
                <div className="relative flex items-center bg-white/[0.03] border border-white/10 rounded-lg overflow-hidden group-focus-within:border-cyan-500/30 transition-all">
                    {loading ? (
                        <Loader2 className="w-4 h-4 text-cyan-400 animate-spin ml-3 flex-shrink-0" />
                    ) : (
                        <Search className="w-4 h-4 text-white/20 ml-3 flex-shrink-0 group-focus-within:text-cyan-400 transition-colors" />
                    )}
                    <input
                        ref={inputRef}
                        type="text"
                        value={query}
                        onChange={(e) => handleInputChange(e.target.value)}
                        onFocus={() => query.length >= 2 && setIsOpen(true)}
                        placeholder="INTELLIGENCE SEARCH — type keyword, location, or threat..."
                        className="w-full px-3 py-2.5 bg-transparent text-white text-xs placeholder:text-white/15 placeholder:uppercase placeholder:tracking-widest placeholder:font-bold focus:outline-none font-mono"
                    />
                    {query && (
                        <button onClick={() => { setQuery(''); setResults([]); setIsOpen(false); }} className="mr-2 p-1 hover:bg-white/10 rounded transition-colors">
                            <X className="w-3 h-3 text-white/30" />
                        </button>
                    )}
                    <div className="h-6 w-px bg-white/10 mr-2" />
                    <div className="flex items-center gap-1 mr-3 flex-shrink-0">
                        <Zap className="w-3 h-3 text-amber-400/50" />
                        <span className="text-[9px] text-white/20 font-bold uppercase tracking-wider">Semantic</span>
                    </div>
                </div>
            </div>

            {/* Results Dropdown */}
            {isOpen && query.length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-[#0c0e14]/98 border border-white/10 rounded-lg shadow-2xl shadow-black/50 overflow-hidden z-50 backdrop-blur-xl max-h-[400px] overflow-y-auto scrollbar-cyber">
                    {/* Results Header */}
                    <div className="px-4 py-2 border-b border-white/5 flex items-center justify-between">
                        <span className="text-[9px] text-white/30 uppercase tracking-[0.2em] font-bold">
                            {loading ? 'Searching...' : `${totalResults} Intel Matches`}
                        </span>
                        {!loading && totalResults > 0 && (
                            <span className="text-[9px] text-cyan-400/50 uppercase tracking-wider font-bold">Ranked by Relevance</span>
                        )}
                    </div>

                    {/* No Results */}
                    {!loading && results.length === 0 && (
                        <div className="text-center py-8">
                            <Search className="w-6 h-6 text-white/10 mx-auto mb-2" />
                            <p className="text-[10px] text-white/20 uppercase tracking-widest font-bold">No Intelligence Matches</p>
                            <p className="text-[9px] text-white/10 mt-1">Refine search parameters</p>
                        </div>
                    )}

                    {/* Results List */}
                    {results.map((result, idx) => (
                        <div
                            key={result.id}
                            onClick={() => { onSelectAlert?.(result.id); setIsOpen(false); }}
                            className="px-4 py-3 border-b border-white/[0.03] hover:bg-white/[0.04] cursor-pointer transition-colors group/item"
                        >
                            <div className="flex items-start gap-3">
                                {/* Rank */}
                                <div className="flex-shrink-0 w-6 h-6 bg-white/[0.05] rounded flex items-center justify-center mt-0.5">
                                    <span className="text-[9px] font-black text-white/30">{idx + 1}</span>
                                </div>

                                {/* Content */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${getPriorityColor(result.priority_class)}`}>
                                            {formatLabel(result.priority_class)}
                                        </span>
                                        <span className="text-[10px] font-bold text-white/60 uppercase">{formatLabel(result.alert_type)}</span>
                                        {result.severity_score && result.severity_score > 0.7 && (
                                            <AlertTriangle className="w-3 h-3 text-red-400" />
                                        )}
                                    </div>
                                    {result.content_text && (
                                        <p className="text-[11px] text-white/40 truncate leading-relaxed">{result.content_text}</p>
                                    )}
                                    <div className="flex items-center gap-3 mt-1.5">
                                        {result.lga_name && (
                                            <span className="flex items-center gap-1 text-[9px] text-white/20">
                                                <MapPin className="w-2.5 h-2.5" /> {result.lga_name}{result.state_name ? `, ${result.state_name}` : ''}
                                            </span>
                                        )}
                                        <span className="flex items-center gap-1 text-[9px] text-white/15">
                                            <Clock className="w-2.5 h-2.5" /> {formatTime(result.created_at)}
                                        </span>
                                    </div>
                                </div>

                                {/* Action Arrow */}
                                <ArrowRight className="w-3.5 h-3.5 text-white/10 group-hover/item:text-cyan-400 transition-colors flex-shrink-0 mt-1" />
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
