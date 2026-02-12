"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users,
    Target,
    Wifi,
    Shield,
    Navigation,
    Zap,
    Globe,
    Radio,
    Satellite,
    Clock,
    Crosshair
} from 'lucide-react';
import MissionSidebar from '../MissionSidebar';
import MeshNetworkStatus from '../MeshNetworkStatus';
import SatelliteDetails from '../SatelliteDetails';
import { Alert, TriangulatedAsset, Asset, Mission } from '../../lib/api';

type DockTab = 'UNITS' | 'INTEL' | 'COMMS';

interface TacticalCommandDockProps {
    assets: Asset[];
    activeMissions: Mission[];
    selectedMission: Mission | null;
    setSelectedMission: (mission: Mission | null) => void;
    loadMissions: () => void;
    selectedAlert: Alert | null;
    triangulatedAssets: TriangulatedAsset[];
    alerts: Alert[];
    handleEngageProtocols: () => void;
    isEngagingProtocols: boolean;
    securityStatus: any;
    createMission: (alertId: string, assetId: string, priority: string) => Promise<any>;
}

export default function TacticalCommandDock({
    assets,
    activeMissions,
    selectedMission,
    setSelectedMission,
    loadMissions,
    selectedAlert,
    triangulatedAssets,
    alerts,
    handleEngageProtocols,
    isEngagingProtocols,
    securityStatus,
    createMission
}: TacticalCommandDockProps) {
    const [activeTab, setActiveTab] = useState<DockTab>('UNITS');

    const tabs: { id: DockTab; label: string; icon: React.ElementType; color: string }[] = [
        { id: 'UNITS', label: 'Units', icon: Users, color: '#eab308' },
        { id: 'INTEL', label: 'Intel', icon: Shield, color: '#ef4444' },
        { id: 'COMMS', label: 'Comms', icon: Globe, color: '#3b82f6' }
    ];

    return (
        <motion.div
            initial={{ opacity: 0, x: 80 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 80 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="w-80 h-full bg-black/80 backdrop-blur-2xl border-l border-white/10 flex flex-col shadow-[-20px_0_50px_rgba(0,0,0,0.5)] z-50"
        >
            {/* Dock Header - Tab Selection */}
            <div className="flex border-b border-white/5 bg-white/[0.02]">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex-1 py-4 flex flex-col items-center gap-1 transition-all relative overflow-hidden group ${activeTab === tab.id ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                            }`}
                    >
                        <tab.icon className={`w-4 h-4 transition-transform group-hover:scale-110 ${activeTab === tab.id ? '' : 'opacity-50'
                            }`} style={activeTab === tab.id ? { color: tab.color } : {}} />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em]">{tab.label}</span>

                        {activeTab === tab.id && (
                            <motion.div
                                layoutId="activeTab"
                                className="absolute bottom-0 left-0 right-0 h-0.5"
                                style={{ backgroundColor: tab.color }}
                            />
                        )}
                    </button>
                ))}
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeTab}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.2 }}
                        className="h-full flex flex-col"
                    >
                        {activeTab === 'UNITS' && (
                            <div className="flex flex-col h-full">
                                {/* Compact Active Agents List */}
                                <div className="p-4 border-b border-white/5">
                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                                        <Users className="w-3 h-3 text-yellow-500" /> Active Personnel
                                    </h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto scrollbar-cyber">
                                        {(assets || []).slice(0, 5).map(agent => (
                                            <div key={agent.id} className="flex flex-col gap-1 p-2 bg-white/5 border border-white/5 rounded-sm">
                                                <div className="flex justify-between items-center text-[9px]">
                                                    <span className="font-black text-white">{agent.call_sign || agent.name}</span>
                                                    <span className={`text-[8px] font-black ${agent.status === 'ENGAGED' ? 'text-orange-500' : 'text-emerald-500'}`}>{agent.status}</span>
                                                </div>
                                                <div className="h-0.5 bg-zinc-800 w-full rounded-full overflow-hidden">
                                                    <div className="h-full bg-emerald-500" style={{ width: `${agent.capacity_level}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                {/* Full Mission Sidebar Integration */}
                                <div className="flex-1 overflow-hidden">
                                    <MissionSidebar
                                        missions={activeMissions}
                                        onSelect={setSelectedMission}
                                        selectedId={selectedMission?.id}
                                        onRefresh={loadMissions}
                                        hideHeader={true}
                                    />
                                </div>
                            </div>
                        )}

                        {activeTab === 'INTEL' && (
                            <div className="p-4 space-y-6 overflow-y-auto h-full scrollbar-cyber">
                                {/* Sector Threats */}
                                <div className="bg-black/40 p-4 border border-red-500/20 rounded-sm">
                                    <h3 className="font-black text-[10px] uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
                                        <Target className="w-4 h-4" /> Threat Matrix
                                    </h3>
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <div className="flex justify-between text-[9px] font-bold uppercase text-zinc-500">
                                                <span>Hostile Density</span>
                                                <span className="text-white">CRITICAL (x{(alerts || []).filter(a => a.severity > 0.8).length})</span>
                                            </div>
                                            <div className="h-1 bg-zinc-800 w-full rounded-full overflow-hidden">
                                                <div className="h-full bg-red-600 shadow-[0_0_10px_#ef4444]" style={{ width: '65%' }} />
                                            </div>
                                        </div>
                                        <button
                                            onClick={handleEngageProtocols}
                                            disabled={isEngagingProtocols}
                                            className="w-full bg-red-600/20 hover:bg-red-600/30 border border-red-600/40 text-red-500 py-3 text-[10px] font-black uppercase tracking-widest transition-all"
                                        >
                                            {isEngagingProtocols ? 'Executing...' : 'Engage Protocols'}
                                        </button>
                                    </div>
                                </div>

                                {/* Proximity Radar */}
                                {selectedAlert && (
                                    <div className="bg-black/40 p-4 border border-yellow-500/20 rounded-sm">
                                        <h3 className="font-black text-[10px] uppercase tracking-widest text-yellow-500 mb-4 flex items-center gap-2">
                                            <Crosshair className="w-4 h-4" /> Proximity Scan
                                        </h3>
                                        <div className="space-y-4">
                                            {(triangulatedAssets || []).map((ta, i) => (
                                                <div key={ta.asset.id} className="space-y-2 group">
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-black text-white">{ta.asset.name}</span>
                                                        <span className="text-yellow-500 font-mono">{(ta.distance_meters / 1000).toFixed(1)}KM</span>
                                                    </div>
                                                    <div className="h-1 bg-zinc-800 w-full rounded-full overflow-hidden">
                                                        <div className="h-full bg-yellow-500" style={{ width: `${ta.suitability_score}%` }} />
                                                    </div>
                                                    <button
                                                        disabled={ta.asset.status === 'DISPATCHED'}
                                                        onClick={() => createMission(selectedAlert.id, ta.asset.id, selectedAlert.severity > 0.8 ? 'HIGH' : 'MEDIUM')}
                                                        className="w-full h-6 bg-white/5 border border-white/10 hover:bg-yellow-500 hover:text-black hover:border-yellow-500 text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-30"
                                                    >
                                                        {ta.asset.status === 'DISPATCHED' ? 'Dispatched' : 'Activate Unit'}
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'COMMS' && (
                            <div className="flex flex-col h-full overflow-hidden">
                                <div className="p-4 flex-1 overflow-y-auto scrollbar-cyber space-y-6">
                                    {/* Mesh Status */}
                                    <div className="bg-black/40 p-4 border border-blue-500/20 rounded-sm">
                                        <h3 className="font-black text-[10px] uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2">
                                            <Wifi className="w-4 h-4" /> Mesh Topology
                                        </h3>
                                        <MeshNetworkStatus dockVariant={true} />
                                    </div>

                                    {/* Satellite Details */}
                                    <div className="bg-black/40 p-4 border border-cyan-500/20 rounded-sm">
                                        <h3 className="font-black text-[10px] uppercase tracking-widest text-cyan-500 mb-4 flex items-center gap-2">
                                            <Satellite className="w-4 h-4" /> Satcom Telemetry
                                        </h3>
                                        <SatelliteDetails dockVariant={true} />
                                    </div>
                                </div>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Footer / Status */}
            <div className="p-4 border-t border-white/5 bg-black/40 flex items-center justify-between">
                <div className="flex flex-col">
                    <span className="text-[7px] text-zinc-500 font-bold uppercase tracking-[0.2em]">Dock Status</span>
                    <span className="text-[9px] text-emerald-500 font-black uppercase">Link: Finalized</span>
                </div>
                <div className="flex gap-2 text-zinc-600">
                    <Radio className="w-3 h-3" />
                    <Zap className="w-3 h-3" />
                </div>
            </div>
        </motion.div>
    );
}
