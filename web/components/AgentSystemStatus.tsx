"use client";
/**
 * AgentSystemStatus – Premium Tactical Intelligence HUD
 * Redesigned with military-grade aesthetics: angular geometry, scanlines,
 * real-time pulse animations, and a glassmorphic dark theme.
 */
import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence, useDragControls } from 'framer-motion';
import Portal from './Portal';

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

// ─── Hex Icon Ring ───────────────────────────────────────────────────
function HexIcon({ children, color, pulse = false }: { children: React.ReactNode; color: string; pulse?: boolean }) {
    return (
        <div className="relative flex items-center justify-center w-11 h-11">
            {/* Outer hexagonal glow */}
            {pulse && (
                <motion.div
                    animate={{ opacity: [0.15, 0.4, 0.15], scale: [1, 1.15, 1] }}
                    transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
                    className="absolute inset-0 rounded-lg"
                    style={{ background: `radial-gradient(circle, ${color}40, transparent 70%)` }}
                />
            )}
            {/* Core hex */}
            <div
                className="relative w-10 h-10 flex items-center justify-center rounded-lg border"
                style={{
                    background: `linear-gradient(135deg, ${color}18, ${color}08)`,
                    borderColor: `${color}40`,
                    boxShadow: `inset 0 1px 0 ${color}15, 0 0 20px ${color}10`,
                }}
            >
                {children}
            </div>
        </div>
    );
}

// ─── Micro Progress Bar ──────────────────────────────────────────────
function MicroBar({ value, max, color }: { value: number; max: number; color: string }) {
    const pct = max > 0 ? Math.min((value / max) * 100, 100) : 0;
    return (
        <div className="w-full h-[3px] bg-white/5 rounded-full overflow-hidden mt-1.5">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${pct}%` }}
                transition={{ duration: 1.2, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ background: `linear-gradient(90deg, ${color}90, ${color})` }}
            />
        </div>
    );
}

// ─── Metric Card ─────────────────────────────────────────────────────
function MetricCard({
    label,
    sublabel,
    value,
    icon,
    color,
    maxValue = 10,
}: {
    label: string;
    sublabel?: string;
    value: number;
    icon: React.ReactNode;
    color: string;
    maxValue?: number;
}) {
    return (
        <motion.div
            whileHover={{ scale: 1.04, y: -1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            className="relative group overflow-hidden"
        >
            {/* Card body */}
            <div
                className="relative p-3 rounded-lg border text-center"
                style={{
                    background: `linear-gradient(160deg, ${color}08, transparent)`,
                    borderColor: `${color}20`,
                }}
            >
                {/* Hover highlight line */}
                <div
                    className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
                />

                <HexIcon color={color} pulse={value > 0}>{icon}</HexIcon>

                <motion.div
                    className="text-2xl font-black tabular-nums mt-1"
                    style={{ color }}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2 }}
                >
                    {value}
                </motion.div>

                <div className="text-[10px] font-bold uppercase tracking-[0.15em] text-white/50 mt-0.5">{label}</div>
                {sublabel && <div className="text-[8px] text-white/25 uppercase tracking-wider">{sublabel}</div>}

                <MicroBar value={value} max={maxValue} color={color} />
            </div>
        </motion.div>
    );
}

// ─── Crew Badge ──────────────────────────────────────────────────────
function CrewBadge({ name, idx }: { name: string; idx: number }) {
    const colors = ['#22d3ee', '#a78bfa', '#f59e0b', '#10b981', '#f43f5e', '#6366f1'];
    const c = colors[idx % colors.length];

    return (
        <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.06 }}
            className="flex items-center gap-2 px-3 py-1.5 rounded border"
            style={{
                background: `${c}08`,
                borderColor: `${c}25`,
            }}
        >
            <motion.span
                animate={{ opacity: [0.4, 1, 0.4] }}
                transition={{ repeat: Infinity, duration: 2, delay: idx * 0.3 }}
                className="w-1.5 h-1.5 rounded-full"
                style={{ background: c }}
            />
            <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">{name}</span>
        </motion.div>
    );
}

// ─── Section Divider ─────────────────────────────────────────────────
function SectionDivider() {
    return (
        <div className="relative flex items-center my-4">
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="mx-3 flex items-center gap-1.5">
                <div className="w-1 h-1 bg-cyan-500/50 rotate-45" />
                <div className="w-1.5 h-1.5 bg-cyan-500/30 rotate-45" />
                <div className="w-1 h-1 bg-cyan-500/50 rotate-45" />
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
        </div>
    );
}

// ─── Section Header ──────────────────────────────────────────────────
function SectionHeader({ label, color }: { label: string; color: string }) {
    return (
        <div className="flex items-center gap-2 mb-3">
            <div className="w-0.5 h-3.5 rounded-full" style={{ background: color }} />
            <span
                className="text-[10px] font-black uppercase tracking-[0.25em]"
                style={{ color }}
            >
                {label}
            </span>
            <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${color}30, transparent)` }} />
        </div>
    );
}

// ═══════════════════════════════════════════════════════════════════════
// ─── Main Component ──────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════
export default function AgentSystemStatus() {
    const [status, setStatus] = useState<HybridSystemStatus | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expanded, setExpanded] = useState(true);
    const [position, setPosition] = useState({ x: 0, y: 0 });
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
    const dragControls = useDragControls();

    const fetchAgentStatus = useCallback(async () => {
        try {
            const response = await fetch('/api/hybrid-status');
            if (!response.ok) throw new Error('Failed to fetch agent status');
            const data = await response.json();
            setStatus(data);
            setError(null);
            setLastUpdated(new Date());
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Unknown error');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchAgentStatus();
        const interval = setInterval(fetchAgentStatus, 30000);
        return () => clearInterval(interval);
    }, [fetchAgentStatus]);

    // ─── Loading State ───────────────────────────────────────────────
    if (loading) {
        return (
            <Portal>
                <div className="fixed top-4 right-4 z-[9999] w-[310px]">
                    <div className="bg-[#0c0e14]/95 backdrop-blur-2xl rounded-none border border-cyan-500/10 overflow-hidden"
                        style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
                    >
                        <div className="animate-pulse p-5 space-y-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 bg-white/5 rounded-lg" />
                                <div className="space-y-2 flex-1">
                                    <div className="h-4 bg-white/5 rounded w-28" />
                                    <div className="h-2.5 bg-white/5 rounded w-20" />
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-white/5 rounded-lg" />)}
                            </div>
                        </div>
                    </div>
                </div>
            </Portal>
        );
    }

    // ─── Error State ─────────────────────────────────────────────────
    if (error) {
        return (
            <Portal>
                <div className="fixed top-4 right-4 z-[9999] w-[310px]">
                    <div className="bg-[#0c0e14]/95 backdrop-blur-2xl border border-red-500/20 overflow-hidden"
                        style={{ clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))' }}
                    >
                        <div className="p-5">
                            <div className="flex items-center gap-3 mb-4">
                                <HexIcon color="#ef4444">
                                    <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </HexIcon>
                                <div>
                                    <h3 className="text-red-400 font-black text-xs uppercase tracking-widest">System Offline</h3>
                                    <p className="text-white/20 text-[9px] mt-0.5 font-mono">{error}</p>
                                </div>
                            </div>
                            <button
                                onClick={fetchAgentStatus}
                                className="w-full py-2 bg-red-500/10 border border-red-500/30 text-red-400 text-[10px] font-black uppercase tracking-[0.2em] hover:bg-red-500/20 transition-all"
                            >
                                ↻ Retry Connection
                            </button>
                        </div>
                    </div>
                </div>
            </Portal>
        );
    }

    // ─── Main Panel ──────────────────────────────────────────────────
    return (
        <Portal>
            <motion.div
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, x: position.x, y: position.y }}
                drag
                dragControls={dragControls}
                dragListener={false}
                dragMomentum={false}
                onDragEnd={(_: any, info: any) => {
                    setPosition({ x: position.x + info.offset.x, y: position.y + info.offset.y });
                }}
                className="fixed top-4 right-4 z-[9999] w-[310px]"
            >
                {/* Outer Shell – Angular Cut Corners */}
                <div
                    className="relative bg-[#0a0c12]/95 backdrop-blur-2xl border border-cyan-400/10 overflow-hidden shadow-[0_0_60px_rgba(0,200,255,0.04)]"
                    style={{ clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 14px 100%, 0 calc(100% - 14px))' }}
                >
                    {/* Animated top scan line */}
                    <motion.div
                        animate={{ x: ['-100%', '200%'] }}
                        transition={{ repeat: Infinity, duration: 4, ease: 'linear' }}
                        className="absolute top-0 left-0 w-1/3 h-[1px]"
                        style={{ background: 'linear-gradient(90deg, transparent, #22d3ee, transparent)' }}
                    />

                    {/* ── Header / Drag Handle ── */}
                    <motion.div
                        onPointerDown={(e) => dragControls.start(e)}
                        onClick={() => setExpanded(!expanded)}
                        className="relative px-4 py-3 cursor-grab active:cursor-grabbing select-none border-b border-white/5"
                        style={{ background: 'linear-gradient(135deg, rgba(6,182,212,0.08), rgba(59,130,246,0.04), transparent)' }}
                    >
                        {/* Corner accents */}
                        <div className="absolute top-0 left-0 w-3 h-3 border-t border-l border-cyan-500/30" />
                        <div className="absolute top-0 right-0 w-3 h-3 border-t border-r border-cyan-500/10" />

                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                {/* Animated core icon */}
                                <div className="relative">
                                    <motion.div
                                        animate={{ rotate: 360 }}
                                        transition={{ repeat: Infinity, duration: 20, ease: 'linear' }}
                                        className="absolute inset-0 rounded-lg border border-cyan-500/20"
                                        style={{ background: 'conic-gradient(from 0deg, transparent, rgba(6,182,212,0.15), transparent)' }}
                                    />
                                    <div className="relative w-9 h-9 bg-gradient-to-br from-cyan-500/20 to-blue-600/20 rounded-lg flex items-center justify-center border border-cyan-500/20">
                                        <svg className="w-4.5 h-4.5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082h4.5m-4.5 0a15.154 15.154 0 014.5 0m0 0c.251.023.501.05.75.082M14.25 3.104v5.714c0 .597.237 1.17.659 1.591L19.5 14.5M14.25 3.104c.251.023.501.05.75.082m0 0a48.534 48.534 0 012.75.352M17.25 8.5v-5m0 0A48.536 48.536 0 0014.5 3.104m2.75 0v5" />
                                        </svg>
                                    </div>
                                </div>
                                <div>
                                    <h3 className="text-white/90 font-black text-[11px] uppercase tracking-[0.2em] flex items-center gap-2">
                                        Agent System
                                        <motion.span
                                            animate={{ opacity: [0.3, 1, 0.3], boxShadow: ['0 0 2px #22d3ee', '0 0 8px #22d3ee', '0 0 2px #22d3ee'] }}
                                            transition={{ repeat: Infinity, duration: 2 }}
                                            className="w-1.5 h-1.5 bg-cyan-400 rounded-full"
                                        />
                                    </h3>
                                    <p className="text-[8px] text-white/25 uppercase tracking-[0.3em] font-bold mt-0.5">
                                        Hybrid Intelligence Engine
                                    </p>
                                </div>
                            </div>

                            <motion.div
                                animate={{ rotate: expanded ? 0 : -90 }}
                                transition={{ type: 'spring', stiffness: 300 }}
                                className="text-white/20 text-[10px]"
                            >
                                ▾
                            </motion.div>
                        </div>
                    </motion.div>

                    {/* ── Expandable Content ── */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.35, ease: 'easeInOut' }}
                                className="overflow-hidden"
                            >
                                <div className="px-4 py-4 space-y-1">
                                    {/* ── Core Engine Section ── */}
                                    <SectionHeader label="Core Engine" color="#3b82f6" />
                                    <div className="grid grid-cols-3 gap-2">
                                        <MetricCard
                                            label="OpenClaw"
                                            sublabel="Orchestration"
                                            value={status?.basic_hybrid?.by_framework?.openclaw || 0}
                                            color="#3b82f6"
                                            maxValue={10}
                                            icon={
                                                <svg className="w-4 h-4 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12a7.5 7.5 0 0015 0m-15 0a7.5 7.5 0 1115 0m-15 0H3m16.5 0H21m-1.5 0H12m-8.457 3.077l1.41-.513m14.095-5.13l1.41-.513M5.106 17.785l1.15-.964m11.49-9.642l1.149-.964M7.501 19.795l.75-1.3m7.5-12.99l.75-1.3m-6.063 16.658l.26-1.477m2.605-14.772l.26-1.477m0 17.726l-.26-1.477M10.698 4.614l-.26-1.477M16.5 19.794l-.75-1.299M7.5 4.205L12 12" />
                                                </svg>
                                            }
                                        />
                                        <MetricCard
                                            label="Agent Zero"
                                            sublabel="Adaptive"
                                            value={status?.basic_hybrid?.by_framework?.agentzero || 0}
                                            color="#a855f7"
                                            maxValue={10}
                                            icon={
                                                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                                </svg>
                                            }
                                        />
                                        <MetricCard
                                            label="Native"
                                            sublabel="Domain"
                                            value={status?.basic_hybrid?.by_framework?.existing || 0}
                                            color="#64748b"
                                            maxValue={10}
                                            icon={
                                                <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                                                </svg>
                                            }
                                        />
                                    </div>

                                    <SectionDivider />

                                    {/* ── Intelligence Layer Section ── */}
                                    <SectionHeader label="Intelligence Layer" color="#10b981" />
                                    <div className="grid grid-cols-3 gap-2">
                                        <MetricCard
                                            label="RAG"
                                            sublabel="Memory"
                                            value={status?.ultimate_hybrid?.langchain?.documents || 0}
                                            color="#10b981"
                                            maxValue={50}
                                            icon={
                                                <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
                                                </svg>
                                            }
                                        />
                                        <MetricCard
                                            label="CrewAI"
                                            sublabel="Multi-Agent"
                                            value={status?.ultimate_hybrid?.crewai?.agents?.length || 0}
                                            color="#f59e0b"
                                            maxValue={15}
                                            icon={
                                                <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z" />
                                                </svg>
                                            }
                                        />
                                        <MetricCard
                                            label="Actions"
                                            sublabel="Executed"
                                            value={status?.ultimate_hybrid?.actions?.executions || 0}
                                            color="#06b6d4"
                                            maxValue={100}
                                            icon={
                                                <svg className="w-4 h-4 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                                                </svg>
                                            }
                                        />
                                    </div>

                                    {/* ── Active Crew ── */}
                                    {status?.ultimate_hybrid?.crewai?.agents && status.ultimate_hybrid.crewai.agents.length > 0 && (
                                        <>
                                            <SectionDivider />
                                            <SectionHeader label="Active Crew" color="#8b5cf6" />
                                            <div className="flex flex-wrap gap-1.5">
                                                {status.ultimate_hybrid.crewai.agents.map((agent, idx) => (
                                                    <CrewBadge key={agent} name={agent} idx={idx} />
                                                ))}
                                            </div>
                                        </>
                                    )}

                                    {/* ── Footer ── */}
                                    <div className="pt-3 mt-3 border-t border-white/5 flex items-center justify-between">
                                        <div className="flex items-center gap-1.5">
                                            <motion.span
                                                animate={{ opacity: [0.3, 1, 0.3] }}
                                                transition={{ repeat: Infinity, duration: 2 }}
                                                className="w-1 h-1 bg-emerald-400 rounded-full"
                                            />
                                            <span className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/20">
                                                All Systems Nominal
                                            </span>
                                        </div>
                                        <span className="text-[8px] font-mono text-white/15 tabular-nums">
                                            {lastUpdated.toLocaleTimeString('en-US', { hour12: false })}
                                        </span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Bottom scan line */}
                    <motion.div
                        animate={{ x: ['200%', '-100%'] }}
                        transition={{ repeat: Infinity, duration: 5, ease: 'linear' }}
                        className="absolute bottom-0 left-0 w-1/4 h-[1px]"
                        style={{ background: 'linear-gradient(90deg, transparent, #3b82f6, transparent)' }}
                    />

                    {/* Corner accent - bottom right */}
                    <div className="absolute bottom-0 right-0 w-3 h-3 border-b border-r border-cyan-500/10" />
                </div>
            </motion.div>
        </Portal>
    );
}
