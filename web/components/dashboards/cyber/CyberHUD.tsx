import React from 'react';
import { motion } from 'framer-motion';
import { Radio, Settings } from 'lucide-react';
import { SystemStatus } from '../../../lib/api';

interface CyberHUDProps {
    operationMode: 'NOMINAL' | 'SURGICAL' | 'TACTICAL' | 'DARK_OPS';
    setOperationMode: (mode: any) => void;
    securityStatus: SystemStatus;
    currentTime: Date | null;
    userRole: string | undefined;
    currentTheme: {
        primary: string;
        secondary: string;
        glow: string;
        text: string;
    };
    themes: any;
}

export default function CyberHUD({
    operationMode,
    setOperationMode,
    securityStatus,
    currentTime,
    userRole,
    currentTheme,
    themes
}: CyberHUDProps) {
    return (
        <>
            {/* HUD Overlays */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-2 pointer-events-none items-center">
                <div className="flex items-center gap-2">
                    <Radio className="w-4 h-4 animate-pulse" style={{ color: currentTheme.primary }} />
                    <h1 className="text-xs font-black tracking-[0.3em] text-white uppercase">SITUATIONAL AWARENESS CENTER</h1>
                </div>

                {/* Mode Selector HUB (NEW) - System Admin Only */}
                {userRole === 'ADMIN' && (
                    <motion.div
                        drag
                        dragMomentum={false}
                        className="flex items-center gap-1 p-1 bg-black/40 backdrop-blur-xl border border-white/5 rounded-full pointer-events-auto cursor-grab active:cursor-grabbing shadow-2xl z-50"
                    >
                        {(['NOMINAL', 'SURGICAL', 'TACTICAL', 'DARK_OPS'] as const).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => setOperationMode(mode)}
                                className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-300 ${operationMode === mode
                                    ? 'bg-white/10 shadow-[0_0_10px_rgba(255,255,255,0.1)]'
                                    : 'text-white/20 hover:text-white/40'
                                    }`}
                                style={operationMode === mode ? { color: themes[mode].primary } : {}}
                            >
                                {mode}
                            </button>
                        ))}
                    </motion.div>
                )}

                <div className="flex items-center gap-4 text-[10px] text-white/30 font-mono">
                    <span className="tracking-widest flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: currentTheme.primary }} />
                        SEC_STATUS: ENCRYPTED_CHANNEL
                    </span>
                    <span className="tracking-widest">GRID: NGR-01-DELTA</span>
                    <span className="tracking-widest" style={{ color: currentTheme.primary + 'cc' }}>TRUSTED_NODES: {securityStatus.trustedDevices}</span>
                </div>
            </div>

            <div className="absolute top-4 right-8 z-30 pointer-events-none">
                <div className="glass-card px-6 py-3 border border-white/5 bg-black/20 font-mono text-right min-w-[140px]" style={{ borderColor: currentTheme.primary + '1a' }}>
                    {currentTime ? (
                        <>
                            <div className="text-xs font-bold tabular-nums" style={{ color: currentTheme.primary }}>
                                {currentTime.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                            </div>
                            <div className="text-[9px] text-white/20 tracking-[0.2em] font-black uppercase">
                                {currentTime.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' }).replace(',', '')}
                            </div>
                        </>
                    ) : (
                        <div className="animate-pulse h-8 flex items-center justify-end">
                            <span className="text-[10px] text-white/10 uppercase tracking-widest">CALIBRATING...</span>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
