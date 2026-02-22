"use client";

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Radio, Share2, Wifi, Zap, Activity } from 'lucide-react';
import { fetchMeshNetworkStatus, MeshNetworkStatus as MeshNetworkStatusType } from '@/lib/api';

interface MeshNode {
    id: string;
    label: string;
    status: 'online' | 'offline' | 'relay';
    latency: number;
    connections: string[];
}

interface MeshNetworkStatusProps {
    className?: string;
    style?: React.CSSProperties;
    dockVariant?: boolean;
}

// Default fallback data in case API is unavailable
const DEFAULT_MESH_STATUS: MeshNetworkStatusType = {
    nodes: [
        { id: '1', label: 'HUB-ALPHA', status: 'online', latency: 42, connections: ['2', '3'], type: 'HUB', location: 'Command Center' },
        { id: '2', label: 'NODE-02', status: 'online', latency: 85, connections: ['1', '4'], type: 'NODE', location: 'Sector A' },
        { id: '3', label: 'NODE-03', status: 'relay', latency: 120, connections: ['1'], type: 'NODE', location: 'Sector B' },
        { id: '4', label: 'LORA-RELAY', status: 'online', latency: 450, connections: ['2'], type: 'LORA', location: 'Remote Outpost' },
    ],
    reliability_index: 98.4,
    last_updated: new Date().toISOString(),
    total_nodes: 4,
    online_nodes: 4,
    backhaul_type: 'SATELLITE',
    local_mesh_type: 'LORA/P2P'
};

export default function MeshNetworkStatus({ className, style, dockVariant = false }: MeshNetworkStatusProps) {
    const [meshStatus, setMeshStatus] = useState<MeshNetworkStatusType>(DEFAULT_MESH_STATUS);
    const [isLoading, setIsLoading] = useState(true);
    const [meshPulse, setMeshPulse] = useState(0);

    useEffect(() => {
        // Fetch mesh network status from API
        const loadMeshStatus = async () => {
            setIsLoading(true);
            const status = await fetchMeshNetworkStatus();
            if (status) {
                setMeshStatus(status);
            }
            setIsLoading(false);
        };

        loadMeshStatus();

        // Poll for updates every 3 seconds
        const interval = setInterval(loadMeshStatus, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setMeshPulse(prev => (prev + 1) % 100);
        }, 3000);
        return () => clearInterval(interval);
    }, []);

    // Convert API nodes to display format
    const nodes: MeshNode[] = meshStatus.nodes.map(n => ({
        id: n.id,
        label: n.label,
        status: n.status,
        latency: n.latency,
        connections: n.connections
    }));

    const content = (
        <div className="space-y-4">
            <div className="grid grid-cols-2 gap-2">
                <div className="bg-white/5 border border-white/5 p-2 text-center">
                    <div className="text-[8px] font-black text-zinc-500 uppercase">Backhaul</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                        <Wifi className="w-3 h-3 text-cyan-400" />
                        <span className="text-[10px] font-black text-white">SATELLITE</span>
                    </div>
                </div>
                <div className="bg-white/5 border border-white/5 p-2 text-center">
                    <div className="text-[8px] font-black text-zinc-500 uppercase">Local Mesh</div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                        <Radio className="w-3 h-3 text-orange-500" />
                        <span className="text-[10px] font-black text-white">LORA/P2P</span>
                    </div>
                </div>
            </div>

            <div className="space-y-2">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-2">Topology Nodes (Active)</p>
                {nodes.map((node) => (
                    <div key={node.id} className="flex items-center justify-between p-2 bg-white/5 border border-white/5 hover:border-orange-500/20 transition-all">
                        <div className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${node.status === 'relay' ? 'bg-cyan-400' : 'bg-orange-500'}`} />
                            <span className="text-[10px] font-black text-zinc-200">{node.label}</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="text-[8px] font-mono text-zinc-600">{node.latency.toFixed(0)}MS</span>
                            <Activity className="w-3 h-3 text-orange-500/30" />
                        </div>
                    </div>
                ))}
            </div>

            <div className="mt-4 pt-4 border-t border-orange-500/10">
                <div className="flex justify-between items-center text-[9px] font-black text-orange-500/60 uppercase">
                    <span>Reliability Index</span>
                    <span>{meshStatus.reliability_index.toFixed(1)}%</span>
                </div>
                <div className="h-1 bg-zinc-800 w-full mt-1.5 overflow-hidden">
                    <motion.div
                        className="h-full bg-orange-500"
                        initial={{ width: '0%' }}
                        animate={{ width: `${meshStatus.reliability_index}%` }}
                    />
                </div>
            </div>
        </div>
    );

    if (dockVariant) {
        return content;
    }

    return (
        <motion.div
            drag
            dragMomentum={false}
            className={`bg-black/90 p-4 border-2 border-orange-500/50 rounded-sm shadow-2xl backdrop-blur-md w-72 absolute z-50 cursor-move ${className || ''}`}
            style={style}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
        >
            <div className="flex items-center justify-between border-b border-orange-500/20 mb-4 pb-2">
                <h3 className="font-black text-[11px] uppercase tracking-widest text-orange-500 flex items-center gap-2">
                    <Share2 className="w-4 h-4" /> Tactical Mesh Status
                </h3>
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse" />
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40" />
                    <div className="w-1.5 h-1.5 rounded-full bg-orange-500/40" />
                </div>
            </div>
            {content}
        </motion.div>
    );
}
