"use client";

import React, { useState, useEffect } from 'react';
import { Wifi, Zap, Activity, Globe } from 'lucide-react';
import { motion } from 'framer-motion';
import { fetchSatcomTelemetry, SatcomTelemetry } from '../lib/api';

export default function SatelliteDetails({ dockVariant = false }: { dockVariant?: boolean }) {
    const [stats, setStats] = useState<SatcomTelemetry>({
        linkStatus: 'ACTIVE',
        downlink: '128.4 Mbps',
        uplink: '42.1 Mbps',
        latency: '18ms',
        satelliteId: 'NGR-SAT-1',
        signalStrength: 94,
        timestamp: Date.now() / 1000
    });

    useEffect(() => {
        const updateTelemetry = async () => {
            const data = await fetchSatcomTelemetry();
            if (data) {
                setStats(data);
            }
        };

        updateTelemetry();
        const interval = setInterval(updateTelemetry, 5000);
        return () => clearInterval(interval);
    }, []);

    const content = (
        <div className={`flex flex-col gap-3 ${dockVariant ? '' : 'p-4 bg-black/60 backdrop-blur-md border border-cyan-500/20 rounded-lg shadow-2xl'}`}>
            {!dockVariant && (
                <div className="flex items-center justify-between border-b border-cyan-500/10 pb-2">
                    <div className="flex items-center gap-2">
                        <Globe className="w-4 h-4 text-cyan-500" />
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Satcom Telemetry</span>
                    </div>
                    <div className="flex items-center gap-1">
                        <div className="w-1 h-1 rounded-full bg-cyan-500 animate-pulse" />
                        <span className="text-[8px] font-bold text-cyan-500 uppercase tracking-widest">{stats.linkStatus}</span>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Satellite ID</p>
                    <p className="text-xs font-mono text-zinc-200">{stats.satelliteId}</p>
                </div>
                <div className="space-y-1">
                    <p className="text-[8px] font-black text-zinc-500 uppercase tracking-widest">Signal Strength</p>
                    <div className="flex items-center gap-2">
                        <div className="flex-1 h-1 bg-zinc-800 rounded-full overflow-hidden">
                            <motion.div
                                className="h-full bg-cyan-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${stats.signalStrength}%` }}
                            />
                        </div>
                        <span className="text-[10px] font-mono text-cyan-500">{stats.signalStrength}%</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-500/5">
                <div className="text-center">
                    <p className="text-[7px] font-black text-zinc-600 uppercase mb-1">Downlink</p>
                    <div className="flex items-center justify-center gap-1">
                        <Zap className="w-2 h-2 text-cyan-400" />
                        <span className="text-[10px] font-black text-zinc-200 tabular-nums">{stats.downlink}</span>
                    </div>
                </div>
                <div className="text-center border-x border-cyan-500/5">
                    <p className="text-[7px] font-black text-zinc-600 uppercase mb-1">Uplink</p>
                    <div className="flex items-center justify-center gap-1">
                        <Zap className="w-2 h-2 text-blue-400 rotate-180" />
                        <span className="text-[10px] font-black text-zinc-200 tabular-nums">{stats.uplink}</span>
                    </div>
                </div>
                <div className="text-center">
                    <p className="text-[7px] font-black text-zinc-600 uppercase mb-1">Latency</p>
                    <div className="flex items-center justify-center gap-1">
                        <Activity className="w-2 h-2 text-emerald-400" />
                        <span className="text-[10px] font-black text-zinc-200 tabular-nums">{stats.latency}</span>
                    </div>
                </div>
            </div>
        </div>
    );

    return content;
}
