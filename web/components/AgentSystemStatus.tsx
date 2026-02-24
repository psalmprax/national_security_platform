/**
 * Enhanced Agent System Status Component
 * Displays status of OpenClaw, Agent Zero, LangChain, and CrewAI hybrid system
 * with premium visual styling
 */
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface HybridSystemStatus {
    basic_hybrid: {
        status: string;
        total_agents?: number;
        by_framework?: {
            openclaw: number;
            agentzero: number;
            existing: number;
        };
        agents?: Record<string, any>;
    };
    ultimate_hybrid: {
        status: string;
        langchain?: {
            documents: number;
            indexed_terms: number;
        };
        crewai?: {
            agents: string[];
        };
        actions?: {
            executions: number;
        };
    };
}

export default function AgentSystemStatus() {
    const [status, setStatus] = useState<HybridSystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);

    useEffect(() => {
        fetchAgentStatus();
        const interval = setInterval(fetchAgentStatus, 30000);
        return () => clearInterval(interval);
    }, []);

    const fetchAgentStatus = async () => {
        try {
            const response = await fetch('http://localhost:8000/hybrid-status');
            if (!response.ok) throw new Error('Failed to fetch agent status');
            const data = await response.json();
            setStatus(data);
            setError(null);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden">
                <div className="animate-pulse p-5 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-slate-800 rounded-xl"></div>
                        <div className="h-6 bg-slate-800 rounded w-32"></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="h-20 bg-slate-800/50 rounded-xl"></div>
                        <div className="h-20 bg-slate-800/50 rounded-xl"></div>
                        <div className="h-20 bg-slate-800/50 rounded-xl"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-red-500/20 shadow-2xl overflow-hidden">
                <div className="p-5">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                            <span className="text-red-400">⚠️</span>
                        </div>
                        <div>
                            <h3 className="text-red-400 font-bold">Agent System Offline</h3>
                            <p className="text-slate-500 text-xs">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={fetchAgentStatus}
                        className="w-full py-2.5 bg-gradient-to-r from-cyan-600 to-blue-600 text-white rounded-xl text-sm font-medium hover:from-cyan-500 hover:to-blue-500 transition-all"
                    >
                        Retry Connection
                    </button>
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-slate-900/95 backdrop-blur-xl rounded-2xl border border-cyan-500/20 shadow-2xl shadow-cyan-500/10 overflow-hidden"
        >
            {/* Header */}
            <motion.div
                onClick={() => setExpanded(!expanded)}
                className="bg-gradient-to-r from-cyan-900/60 via-blue-900/60 to-cyan-900/60 px-5 py-4 cursor-pointer border-b border-cyan-500/10"
                whileHover={{ backgroundColor: 'rgba(8, 145, 178, 0.3)' }}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <motion.div
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ repeat: Infinity, duration: 3 }}
                            className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-xl flex items-center justify-center shadow-lg shadow-cyan-500/30"
                        >
                            <span className="text-xl">🤖</span>
                        </motion.div>
                        <div>
                            <h3 className="text-white font-bold text-lg flex items-center gap-2">
                                AI Agent System
                                <motion.span
                                    animate={{ opacity: [0.5, 1, 0.5] }}
                                    transition={{ repeat: Infinity, duration: 2 }}
                                    className="w-2 h-2 bg-green-400 rounded-full inline-block"
                                ></motion.span>
                            </h3>
                            <p className="text-slate-400 text-xs">Hybrid Intelligence Engine</p>
                        </div>
                    </div>
                    <motion.div
                        animate={{ rotate: expanded ? 180 : 0 }}
                        className="text-slate-400"
                    >
                        ▼
                    </motion.div>
                </div>
            </motion.div>

            <AnimatePresence>
                {expanded && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="overflow-hidden"
                    >
                        <div className="p-5 space-y-5">
                            {/* Basic Hybrid System */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-blue-500 rounded-full"></div>
                                    <h4 className="text-xs font-bold text-blue-400 uppercase tracking-widest">
                                        Core Engine
                                    </h4>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <EnhancedStatusCard
                                        label="OpenClaw"
                                        sublabel="Orchestration"
                                        value={status?.basic_hybrid?.by_framework?.openclaw || 0}
                                        icon="⚙️"
                                        color="blue"
                                    />
                                    <EnhancedStatusCard
                                        label="Agent Zero"
                                        sublabel="Adaptive"
                                        value={status?.basic_hybrid?.by_framework?.agentzero || 0}
                                        icon="🔷"
                                        color="purple"
                                    />
                                    <EnhancedStatusCard
                                        label="Native"
                                        sublabel="Domain"
                                        value={status?.basic_hybrid?.by_framework?.existing || 0}
                                        icon="🛡️"
                                        color="slate"
                                    />
                                </div>
                            </div>

                            {/* Divider with glow */}
                            <div className="relative">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gradient-to-r from-transparent via-cyan-500/30 to-transparent"></div>
                                </div>
                                <div className="relative flex justify-center">
                                    <span className="bg-slate-900 px-3 text-cyan-500 text-xs">● ◕ ●</span>
                                </div>
                            </div>

                            {/* Ultimate Hybrid System */}
                            <div className="space-y-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-1 h-4 bg-emerald-500 rounded-full"></div>
                                    <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-widest">
                                        Intelligence Layer
                                    </h4>
                                </div>
                                <div className="grid grid-cols-3 gap-3">
                                    <EnhancedStatusCard
                                        label="RAG"
                                        sublabel="Memory"
                                        value={status?.ultimate_hybrid?.langchain?.documents || 0}
                                        icon="📚"
                                        color="green"
                                    />
                                    <EnhancedStatusCard
                                        label="CrewAI"
                                        sublabel="Multi-Agent"
                                        value={status?.ultimate_hybrid?.crewai?.agents?.length || 0}
                                        icon="👥"
                                        color="amber"
                                    />
                                    <EnhancedStatusCard
                                        label="Actions"
                                        sublabel="Executed"
                                        value={status?.ultimate_hybrid?.actions?.executions || 0}
                                        icon="⚡"
                                        color="cyan"
                                    />
                                </div>
                            </div>

                            {/* Crew Agents List */}
                            {status?.ultimate_hybrid?.crewai?.agents && status.ultimate_hybrid.crewai.agents.length > 0 && (
                                <div className="pt-3 border-t border-slate-800">
                                    <h4 className="text-xs font-medium text-slate-500 uppercase tracking-wider mb-3">
                                        Active Crew
                                    </h4>
                                    <div className="flex flex-wrap gap-2">
                                        {status.ultimate_hybrid.crewai.agents.map((agent: string, idx: number) => (
                                            <motion.div
                                                key={agent}
                                                initial={{ opacity: 0, scale: 0.8 }}
                                                animate={{ opacity: 1, scale: 1 }}
                                                transition={{ delay: idx * 0.1 }}
                                                className="px-3 py-2 bg-gradient-to-r from-slate-800/80 to-slate-800/40 border border-slate-600/30 text-slate-300 text-xs rounded-xl flex items-center gap-2"
                                            >
                                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></span>
                                                {agent}
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500">
                                <div className="flex items-center gap-2">
                                    <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                                    <span>All Systems Operational</span>
                                </div>
                                <span>Updated: {new Date().toLocaleTimeString()}</span>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </motion.div>
    );
}

function EnhancedStatusCard({
    label,
    sublabel,
    value,
    icon,
    color
}: {
    label: string;
    sublabel?: string;
    value: number;
    icon: string;
    color: string;
}) {
    const colorStyles: Record<string, { bg: string; border: string; text: string; glow: string; iconBg: string }> = {
        blue: { bg: 'bg-blue-900/20', border: 'border-blue-500/30', text: 'text-blue-300', glow: 'shadow-blue-500/10', iconBg: 'from-blue-500 to-cyan-400' },
        purple: { bg: 'bg-purple-900/20', border: 'border-purple-500/30', text: 'text-purple-300', glow: 'shadow-purple-500/10', iconBg: 'from-purple-500 to-pink-400' },
        slate: { bg: 'bg-slate-800/50', border: 'border-slate-600/30', text: 'text-slate-300', glow: 'shadow-slate-500/5', iconBg: 'from-slate-600 to-slate-400' },
        green: { bg: 'bg-green-900/20', border: 'border-green-500/30', text: 'text-green-300', glow: 'shadow-green-500/10', iconBg: 'from-green-500 to-emerald-400' },
        amber: { bg: 'bg-amber-900/20', border: 'border-amber-500/30', text: 'text-amber-300', glow: 'shadow-amber-500/10', iconBg: 'from-amber-500 to-orange-400' },
        cyan: { bg: 'bg-cyan-900/20', border: 'border-cyan-500/30', text: 'text-cyan-300', glow: 'shadow-cyan-500/10', iconBg: 'from-cyan-500 to-blue-400' },
    };

    const styles = colorStyles[color] || colorStyles.slate;

    return (
        <motion.div
            whileHover={{ scale: 1.03, y: -2 }}
            className={`p-4 rounded-xl border ${styles.bg} ${styles.border} ${styles.glow} shadow-lg text-center transition-all`}
        >
            <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                className={`text-2xl mb-2 w-10 h-10 mx-auto bg-gradient-to-br ${styles.iconBg} rounded-lg flex items-center justify-center shadow-md`}
            >
                {icon}
            </motion.div>
            <div className={`text-3xl font-bold ${styles.text} drop-shadow-lg`}>{value}</div>
            <div className="text-xs text-slate-400 mt-1 font-medium">{label}</div>
            {sublabel && <div className="text-[10px] text-slate-500">{sublabel}</div>}
        </motion.div>
    );
}
