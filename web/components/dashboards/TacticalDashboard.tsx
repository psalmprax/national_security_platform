"use client";

import React, { useState, useEffect } from 'react';
import {
    Shield,
    Map as MapIcon,
    AlertTriangle,
    Radio,
    Target,
    Zap,
    ChevronRight,
    Wifi,
    Navigation,
    LocateFixed,
    Users
} from 'lucide-react';
import { motion } from 'framer-motion';
import MapboxMap from '../MapboxMap';
import { Alert, fetchTriangulatedAssets, TriangulatedAsset, dispatchAsset, SystemStatus, Asset, fetchAssets } from '../../lib/api';
import { useAuth, User } from '../../lib/AuthContext';

interface TacticalDashboardProps {
    alerts: Alert[];
    currentTime: Date | null;
    securityStatus: SystemStatus;
    user: User | null;
    logout: () => void;
}

export default function TacticalDashboard({ alerts, currentTime, securityStatus, user, logout }: TacticalDashboardProps) {
    // We no longer need token here as we use cookies
    // const { token } = useAuth();
    const [activeView, setActiveView] = useState<'map' | 'list'>('map');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [showSatellite, setShowSatellite] = useState(false);
    const [radarAngle, setRadarAngle] = useState(0);
    const [triangulatedAssets, setTriangulatedAssets] = useState<TriangulatedAsset[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);

    // Simulated Radar Sweep
    useEffect(() => {
        const interval = setInterval(() => {
            setRadarAngle(prev => (prev + 2) % 360);
        }, 30);
        return () => clearInterval(interval);
    }, []);

    // Fetch Live Assets
    useEffect(() => {
        const loadAssets = async () => {
            const results = await fetchAssets();
            setAssets(results);
        };
        loadAssets(); // Initial load
        const interval = setInterval(loadAssets, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Fetch Triangulation data when alert is selected (NEW)
    useEffect(() => {
        if (selectedAlert) {
            const loadTriangulation = async () => {
                const results = await fetchTriangulatedAssets(selectedAlert.id);
                setTriangulatedAssets(results);
            };
            loadTriangulation();
        } else {
            setTriangulatedAssets([]);
        }
    }, [selectedAlert]);

    return (
        <div className="relative w-full h-full bg-[#121212] text-zinc-100 font-mono overflow-hidden">
            {/* Header / Status Bar - Industrial Rugged */}
            <header className="h-14 bg-[#1a1a1a] border-b-2 border-yellow-500/50 flex items-center justify-between px-6 z-50 relative">
                <div className="flex items-center gap-4">
                    <div className="bg-yellow-500 p-1.5 rounded-sm">
                        <Shield className="w-6 h-6 text-black" />
                    </div>
                    <div>
                        <h1 className="text-lg font-black uppercase tracking-tighter leading-none text-white">
                            FIELD OPERATIONAL COMMAND <span className="text-yellow-500">[DANGER_ZONE]</span>
                        </h1>
                        <div className="text-[10px] font-bold text-zinc-500 flex items-center gap-3">
                            <span className="flex items-center gap-1"><Wifi className="w-3 h-3 text-yellow-500" /> SAT_LINK: STABLE</span>
                            <span className="flex items-center gap-1 text-green-500 font-black"><LocateFixed className="w-3 h-3" /> GPS_LOCK: TRUE</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex gap-4">
                        <div className="text-center px-4 border-l border-zinc-800">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">Bearing</div>
                            <div className="text-xs font-black text-white tabular-nums">284° N/NW</div>
                        </div>
                        <div className="text-center px-4 border-l border-zinc-800">
                            <div className="text-[10px] text-zinc-500 font-bold uppercase">GridRef</div>
                            <div className="text-xs font-black text-white tabular-nums">
                                {alerts.length > 0
                                    ? `14P.${alerts[0].latitude.toFixed(2)}-${alerts[0].longitude.toFixed(2)}`
                                    : 'Searching...'}
                            </div>
                        </div>
                    </div>
                    <div className="text-right bg-yellow-500/10 border-l border-r border-yellow-500/20 px-6 py-1">
                        <div className="text-xl font-black tabular-nums leading-none text-yellow-500">
                            {currentTime?.toLocaleTimeString('en-US', { hour12: false })}
                        </div>
                        <div className="text-[9px] font-black text-yellow-500/60 text-center uppercase tracking-widest">
                            Local Ops Time
                        </div>
                    </div>

                    <div className="relative">
                        <button
                            onClick={() => setShowUserMenu(!showUserMenu)}
                            className="flex items-center gap-3 pl-4 border-l border-zinc-800 hover:opacity-80 transition-opacity cursor-pointer"
                        >
                            <div className="text-right hidden sm:block">
                                <p className="text-[10px] font-black text-white uppercase leading-none">{user?.full_name || 'Operator'}</p>
                                <p className="text-[8px] font-bold text-yellow-500/60 uppercase">{user?.role || 'Guest'}</p>
                            </div>
                            <div className="w-8 h-8 bg-zinc-800 border-2 border-yellow-500/50 flex items-center justify-center text-yellow-500 font-black text-xs">
                                {user?.full_name?.charAt(0) || 'U'}
                            </div>
                        </button>

                        {showUserMenu && (
                            <div className="absolute top-12 right-0 w-48 bg-[#1a1a1a] border-2 border-yellow-500/50 shadow-2xl p-2 z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                                <button
                                    onClick={() => console.log('Profile Mapping')}
                                    className="w-full text-left text-[10px] font-black text-zinc-400 hover:text-white hover:bg-white/5 px-3 py-2 transition-all uppercase tracking-widest cursor-pointer"
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={() => console.log('Settings Mapping')}
                                    className="w-full text-left text-[10px] font-black text-zinc-400 hover:text-white hover:bg-white/5 px-3 py-2 transition-all uppercase tracking-widest cursor-pointer"
                                >
                                    Settings
                                </button>
                                <div className="h-px bg-yellow-500/20 my-1" />
                                <button
                                    onClick={logout}
                                    className="w-full text-left text-[10px] font-black text-red-500 hover:bg-red-500/10 px-3 py-2 transition-all uppercase tracking-widest cursor-pointer"
                                >
                                    Terminate Session
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </header>

            <div className="flex h-[calc(100vh-56px)]">
                {/* Sidebar Controls - Field Grade */}
                <aside className="w-20 bg-[#151515] border-r border-white/5 flex flex-col items-center py-6 gap-6 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.3)]">
                    <button
                        onClick={() => setActiveView('map')}
                        className={`w-12 h-12 flex items-center justify-center rounded transition-all relative group
                            ${activeView === 'map' ? 'bg-yellow-500 text-black' : 'bg-white/5 text-zinc-600 hover:bg-white/10'}
                        `}
                    >
                        <MapIcon className="w-6 h-6" />
                        <div className="absolute left-full ml-4 px-3 py-1 bg-black text-[10px] font-bold uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">Map View</div>
                    </button>
                    <button
                        onClick={() => setActiveView('list')}
                        className={`w-12 h-12 flex items-center justify-center rounded transition-all relative group
                            ${activeView === 'list' ? 'bg-yellow-500 text-black' : 'bg-white/5 text-zinc-600 hover:bg-white/10'}
                        `}
                    >
                        <AlertTriangle className="w-6 h-6" />
                        <div className="absolute left-full ml-4 px-3 py-1 bg-black text-[10px] font-bold uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">Alert List</div>
                    </button>

                    <div className="mt-auto flex flex-col gap-6 mb-4">
                        <button
                            onClick={() => console.log('Panic Signal Triggered')}
                            className="w-12 h-12 flex items-center justify-center rounded bg-red-600 text-white animate-pulse relative group cursor-pointer"
                        >
                            <Zap className="w-6 h-6 fill-current" />
                            <div className="absolute left-full ml-4 px-3 py-1 bg-red-900 text-[10px] font-bold uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none text-white">Panic Signal</div>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 relative flex">
                    {activeView === 'map' && (
                        <div className="flex-1 relative bg-black">
                            <MapboxMap
                                alerts={alerts}
                                selectedAlert={selectedAlert}
                                triangulatedAssets={triangulatedAssets}
                                mode="tactical"
                                onSelect={setSelectedAlert}
                                showSatellite={showSatellite}
                            />

                            {/* Style Toggle */}
                            <div className="absolute top-8 right-8 z-30 flex flex-col gap-2">
                                <button
                                    onClick={() => setShowSatellite(!showSatellite)}
                                    className={`px-4 py-2 border backdrop-blur-md transition-all flex items-center gap-2 group cursor-pointer ${showSatellite ? 'border-yellow-500 bg-yellow-500/10 text-yellow-500' : 'border-white/10 bg-black/40 text-white/40 hover:border-white/30'
                                        }`}
                                >
                                    <div className={`w-2 h-2 rounded-full ${showSatellite ? 'bg-yellow-500 animate-pulse' : 'bg-white/20'}`} />
                                    <span className="text-[10px] font-black tracking-widest uppercase">
                                        {showSatellite ? 'Feed: Satellite' : 'Feed: Tactical'}
                                    </span>
                                </button>
                            </div>

                            {/* RADAR OVERLAY EFFECT */}
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                <div className="w-[800px] h-[800px] border border-yellow-500/10 rounded-full relative">
                                    {/* Concentric circles */}
                                    <div className="absolute inset-[15%] border border-yellow-500/10 rounded-full" />
                                    <div className="absolute inset-[35%] border border-yellow-500/10 rounded-full" />
                                    <div className="absolute inset-[55%] border border-yellow-500/10 rounded-full" />

                                    {/* RADAR SWEEP LINE */}
                                    <div
                                        className="absolute top-1/2 left-1/2 w-full h-[2px] bg-gradient-to-r from-yellow-500/20 to-yellow-500/60 origin-left"
                                        style={{ transform: `rotate(${radarAngle}deg)` }}
                                    />

                                    {/* Tick marks */}
                                    {[0, 90, 180, 270].map(deg => (
                                        <div
                                            key={deg}
                                            className="absolute top-1/2 left-1/2 w-8 h-px bg-yellow-500/40"
                                            style={{ transform: `rotate(${deg}deg) translateX(360px)` }}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Tactical Overlays (Draggable) */}
                            <motion.div
                                drag
                                dragMomentum={false}
                                className="absolute bottom-6 left-6 flex flex-col gap-4 cursor-move"
                            >
                                <div className="bg-black/90 p-4 border-2 border-yellow-500/50 rounded-sm shadow-2xl backdrop-blur-md w-64 pointer-events-auto">
                                    <div className="flex items-center justify-between border-b border-yellow-500/20 mb-3 pb-2">
                                        <h3 className="font-black text-[11px] uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                                            <Target className="w-4 h-4" /> Sector Threats
                                        </h3>
                                        <span className="text-[10px] font-black bg-red-600 px-1.5 py-0.5 text-white animate-pulse">LIVE</span>
                                    </div>
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-[10px] font-bold uppercase text-zinc-500">
                                                <span>Hostile Activity</span>
                                                <span className="text-white">CRITICAL (x{alerts.filter(a => a.severity > 0.8).length})</span>
                                            </div>
                                            <div className="h-1 bg-zinc-800 w-full rounded-full overflow-hidden">
                                                <div className="h-full bg-red-600" style={{ width: '65%' }} />
                                            </div>
                                        </div>
                                        <button className="w-full bg-yellow-500 text-black py-2 text-[10px] font-black uppercase tracking-widest hover:bg-yellow-400 transition-colors">
                                            Engage Protocols
                                        </button>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Right Panel - Field Agents (Draggable) */}
                            <motion.div
                                drag
                                dragMomentum={false}
                                className="absolute top-6 right-6 w-64 flex flex-col gap-4 cursor-move"
                            >
                                <div className="bg-black/80 backdrop-blur-md border border-white/5 rounded-sm p-4 pointer-events-auto">
                                    <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-4 flex items-center gap-2">
                                        <Users className="w-3 h-3 text-yellow-500" /> Active Agents
                                    </h4>
                                    <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-cyber">
                                        {assets.length === 0 ? (
                                            <div className="text-[10px] text-zinc-600 italic text-center py-4">No active field units.</div>
                                        ) : (
                                            assets.map(agent => (
                                                <div key={agent.id} className="flex flex-col gap-1.5 p-2 bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                                                    <div className="flex justify-between items-center text-[10px]">
                                                        <span className="font-black text-white">{agent.call_sign || agent.name}</span>
                                                        <span className={`px-1 rounded-sm text-[8px] font-black ${agent.status === 'ENGAGED' ? 'bg-orange-600 text-white' : 'text-green-500'}`}>{agent.status}</span>
                                                    </div>
                                                    <div className="flex justify-between text-[8px] font-bold text-zinc-500 uppercase">
                                                        <div className="flex items-center gap-1">
                                                            <span>R:</span>
                                                            <div className="w-8 h-1 bg-zinc-800 rounded-full overflow-hidden">
                                                                <div
                                                                    className={`h-full ${agent.capacity_level < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                                                                    style={{ width: `${agent.capacity_level}%` }}
                                                                />
                                                            </div>
                                                            <span>{agent.capacity_level}%</span>
                                                        </div>
                                                        <span className="flex items-center gap-1"><Navigation className="w-2 h-2" /> LOC: {agent.latitude.toFixed(2)}, {agent.longitude.toFixed(2)}</span>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>

                                {/* Tactical Proximity Radar (NEW) */}
                                {selectedAlert && (
                                    <div className="bg-black/90 p-4 border-2 border-yellow-500/50 rounded-sm shadow-2xl backdrop-blur-md">
                                        <div className="flex items-center justify-between border-b border-yellow-500/20 mb-3 pb-2">
                                            <h3 className="font-black text-[11px] uppercase tracking-widest text-yellow-500 flex items-center gap-2">
                                                <Shield className="w-4 h-4" /> Tactical Proximity Radar
                                            </h3>
                                            <span className="text-[9px] font-mono text-yellow-500/50 animate-pulse uppercase">Scanning...</span>
                                        </div>
                                        <div className="space-y-4">
                                            {triangulatedAssets.length > 0 ? (
                                                triangulatedAssets.map((ta, i) => (
                                                    <div key={ta.asset.id} className="space-y-1.5">
                                                        <div className="flex justify-between items-center text-[10px]">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-zinc-500 font-bold">0{i + 1}</span>
                                                                <span className="font-black text-white uppercase tracking-tight">{ta.asset.name}</span>
                                                            </div>
                                                            <span className="font-black text-yellow-500">{(ta.distance_meters / 1000).toFixed(1)}KM</span>
                                                        </div>
                                                        <div className="h-1 bg-zinc-800 w-full rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-yellow-500"
                                                                style={{ width: `${ta.suitability_score}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-tighter">Suitability: {ta.suitability_score.toFixed(0)}%</span>
                                                            {ta.asset.status !== 'DISPATCHED' ? (
                                                                <button
                                                                    onClick={async (e) => {
                                                                        e.stopPropagation();
                                                                        const success = await dispatchAsset(ta.asset.id);
                                                                        if (success) {
                                                                            setTriangulatedAssets(prev => prev.map(p =>
                                                                                p.asset.id === ta.asset.id ? { ...p, asset: { ...p.asset, status: 'DISPATCHED' } } : p
                                                                            ));
                                                                            alert(`UNIT [${ta.asset.name}] DISPATCHED.`);
                                                                        }
                                                                    }}
                                                                    className="text-black bg-yellow-500 px-2 py-0.5 text-[8px] font-black uppercase hover:bg-yellow-400 transition-colors"
                                                                >
                                                                    Activate
                                                                </button>
                                                            ) : (
                                                                <span className="bg-orange-600/20 text-orange-500 border border-orange-500/30 px-2 py-0.5 text-[8px] font-black uppercase">Dispatched</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="text-[10px] text-zinc-500 italic py-2 text-center border border-dashed border-zinc-800">
                                                    No assets in immediate proximity.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                <div className="bg-orange-600/10 border border-orange-600/30 p-4 rounded-sm flex items-center gap-3">
                                    <div className="relative">
                                        <Radio className="w-6 h-6 text-orange-500" />
                                        <div className="absolute inset-0 bg-orange-500 animate-ping opacity-20 rounded-full" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-orange-500 uppercase leading-none mb-1">Incoming Comms</p>
                                        <p className="text-[9px] text-orange-500/60 font-medium">RE: Incident #{alerts[0]?.id.slice(0, 8) || 'NO-SIGNAL'}</p>
                                    </div>
                                </div>
                            </motion.div>
                        </div>
                    )}

                    {activeView === 'list' && (
                        <div className="p-8 bg-[#0a0a0a] h-full overflow-auto flex-1 border-l border-white/5">
                            <div className="max-w-4xl mx-auto">
                                <div className="flex items-center justify-between mb-8 border-b-2 border-yellow-500 pb-2">
                                    <h2 className="text-2xl font-black uppercase tracking-tighter">Tactical Manifest</h2>
                                    <span className="text-xs font-bold text-zinc-500 tabular-nums">RECORDS: {alerts.length}</span>
                                </div>
                                <div className="grid gap-4">
                                    {alerts.map((alert) => (
                                        <div
                                            key={alert.id}
                                            onClick={() => {
                                                setSelectedAlert(alert);
                                                setActiveView('map');
                                            }}
                                            className={`bg-zinc-900 border p-5 shadow-sm group transition-all cursor-pointer ${selectedAlert?.id === alert.id ? 'border-yellow-500 bg-yellow-500/5' : 'border-white/5 hover:border-yellow-500/50'
                                                }`}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={`w-1 self-stretch ${alert.severity > 0.8 ? 'bg-red-600' : 'bg-yellow-500'}`} />
                                                <div className="flex-1">
                                                    <div className="flex justify-between items-start mb-3">
                                                        <div>
                                                            <div className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.2em] mb-1">Classification: {alert.severity > 0.8 ? 'Priority-1' : 'Priority-2'}</div>
                                                            <h3 className="font-black text-xl uppercase tracking-tight text-white">{alert.type.replace(/_/g, ' ')}</h3>
                                                        </div>
                                                        <div className="text-right">
                                                            <div className="text-[10px] font-bold text-zinc-500 mb-1">{new Date(alert.timestamp).toLocaleTimeString()}</div>
                                                            <div className="text-[10px] font-bold text-zinc-500 uppercase">LOG_ID: {alert.id.slice(0, 8)}</div>
                                                        </div>
                                                    </div>
                                                    <p className="text-zinc-400 font-medium text-sm leading-relaxed mb-4">{alert.content}</p>
                                                    <div className="flex items-center gap-6 pt-4 border-t border-white/5">
                                                        <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase">
                                                            <MapIcon className="w-3 h-3" /> {alert.location}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-[10px] font-black text-green-500 uppercase">
                                                            <Lock className="w-3 h-3" /> {alert.isTrusted ? 'Source Verified' : 'Integrity Uncertain'}
                                                        </div>
                                                        <button className="ml-auto flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-[#00FF95] hover:text-white transition-colors">
                                                            View Details <ChevronRight className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>

            {/* Global Warning Banner - If Critical Alerts Exist */}
            {alerts.some(a => a.severity > 0.8) && (
                <div className="absolute top-14 left-0 right-0 h-1 bg-red-600 z-[100] animate-pulse">
                    <div className="absolute top-1 right-4 bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded-b-sm uppercase tracking-widest translate-y-[-1px]">
                        Alert: Critical Hostility Detected
                    </div>
                </div>
            )}
        </div>
    );
}

// Helper for detail icon
function Lock({ className }: { className?: string }) {
    return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>;
}
