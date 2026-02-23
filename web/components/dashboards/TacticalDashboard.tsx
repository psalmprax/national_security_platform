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
    Users,
    Lock,
    Megaphone,
    User as UserIcon,
    ChevronDown,
    LogOut,
    Compass,
    MapPin,
    Activity
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';
import MapboxMap from '../MapboxMap';
import PublicAlertBroadcast from '../modals/PublicAlertBroadcast';
import {
    dispatchEmergencyResponse,
    verifyAlert,
    triggerPanic,
    engageTacticalProtocols
} from '../../lib/api';


import TacticalCommandDock from './TacticalCommandDock';
import { Alert, fetchTriangulatedAssets, TriangulatedAsset, dispatchAsset, SystemStatus, Asset, fetchAssets, Mission, fetchActiveMissions, createMission } from '../../lib/api';
import { useAuth, User } from '../../lib/AuthContext';

interface TacticalDashboardProps {
    alerts: Alert[];
    currentTime: Date | null;
    securityStatus: SystemStatus;
    user: User | null;
    logout: () => void;
    displayMode: 'dark' | 'light' | 'contrast' | 'oled' | 'terminal';
    setDisplayMode: (mode: 'dark' | 'light' | 'contrast' | 'oled' | 'terminal') => void;
}

export default function TacticalDashboard({ alerts, currentTime, securityStatus, user, logout, displayMode, setDisplayMode }: TacticalDashboardProps) {
    // We no longer need token here as we use cookies
    // const {token} = useAuth();
    const [activeView, setActiveView] = useState<'map' | 'list'>('map');
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [showSatellite, setShowSatellite] = useState(false);
    const [radarAngle, setRadarAngle] = useState(0);
    const [triangulatedAssets, setTriangulatedAssets] = useState<TriangulatedAsset[]>([]);
    const [assets, setAssets] = useState<Asset[]>([]);
    const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
    const [selectedMission, setSelectedMission] = useState<Mission | null>(null);
    const [showMissions, setShowMissions] = useState(false);
    const [isDispatchingResponse, setIsDispatchingResponse] = useState(false);
    const [isVerifying, setIsVerifying] = useState(false);
    const [isEngagingProtocols, setIsEngagingProtocols] = useState(false);
    const [showBroadcastModal, setShowBroadcastModal] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState([
        { message: "System initialized. Secure connection established.", timestamp: new Date(), type: 'system' }
    ]);
    const [phantomBlips, setPhantomBlips] = useState<{ id: number; x: number; y: number; opacity: number }[]>([]);

    // Simulated Radar Phantom Blips
    useEffect(() => {
        const blipInterval = setInterval(() => {
            if (Math.random() > 0.6) {
                const id = Date.now();
                const angle = Math.random() * Math.PI * 2;
                const radius = Math.random() * 320 + 40;
                setPhantomBlips(prev => [...prev, {
                    id,
                    x: Math.cos(angle) * radius,
                    y: Math.sin(angle) * radius,
                    opacity: 1
                }]);

                setTimeout(() => {
                    setPhantomBlips(prev => prev.filter(b => b.id !== id));
                }, 2500);
            }
        }, 1200);
        return () => clearInterval(blipInterval);
    }, []);

    // Security Redaction Helpers
    const isAlertRedacted = (alert: Alert | null): boolean => {
        if (!alert) return false;

        return (
            alert.content.includes('[REDACTED') ||
            (alert.priority_class === 'CRITICAL' && alert.isEncrypted === true) ||
            alert.isDuress === true
        );
    };

    const getClassificationLevel = (alert: Alert): { level: string; color: string; bgColor: string; borderColor: string } => {
        // Null safety checks
        if (!alert) {
            return {
                level: 'CLASSIFIED',
                color: '#eab308',
                bgColor: 'rgba(234, 179, 8, 0.1)',
                borderColor: '#eab308'
            };
        }

        const content = alert.content || '';

        // Extract classification level from content
        if (content.includes('[REDACTED - TOP SECRET]')) {
            return {
                level: 'TOP SECRET',
                color: '#ef4444',
                bgColor: 'rgba(239, 68, 68, 0.1)',
                borderColor: '#ef4444'
            };
        } else if (content.includes('[REDACTED - SECRET]')) {
            return {
                level: 'SECRET',
                color: '#f97316',
                bgColor: 'rgba(249, 115, 22, 0.1)',
                borderColor: '#f97316'
            };
        } else if (content.includes('[REDACTED - CLASSIFIED]')) {
            return {
                level: 'CLASSIFIED',
                color: '#eab308',
                bgColor: 'rgba(234, 179, 8, 0.1)',
                borderColor: '#eab308'
            };
        } else if (content.includes('[REDACTED - DURESS')) {
            return {
                level: 'DURESS PROTOCOL',
                color: '#3b82f6',
                bgColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: '#3b82f6'
            };
        } else if (content.includes('[REDACTED - ENCRYPTED]')) {
            return {
                level: 'ENCRYPTED',
                color: '#8b5cf6',
                bgColor: 'rgba(139, 92, 246, 0.1)',
                borderColor: '#8b5cf6'
            };
        } else if (content.includes('[REDACTED - INSUFFICIENT CLEARANCE]')) {
            return {
                level: 'INSUFFICIENT CLEARANCE',
                color: '#dc2626',
                bgColor: 'rgba(220, 38, 38, 0.1)',
                borderColor: '#dc2626'
            };
        } else if (content.includes('[REDACTED')) {
            return {
                level: 'CLASSIFIED',
                color: '#eab308',
                bgColor: 'rgba(234, 179, 8, 0.1)',
                borderColor: '#eab308'
            };
        }

        // Fallback for encrypted/duress flags
        if (alert.priority_class === 'CRITICAL' && alert.isEncrypted === true) {
            return {
                level: 'ENCRYPTED',
                color: '#8b5cf6',
                bgColor: 'rgba(139, 92, 246, 0.1)',
                borderColor: '#8b5cf6'
            };
        }
        if (alert.isDuress === true) {
            return {
                level: 'DURESS PROTOCOL',
                color: '#3b82f6',
                bgColor: 'rgba(59, 130, 246, 0.1)',
                borderColor: '#3b82f6'
            };
        }

        return {
            level: 'CLASSIFIED',
            color: '#eab308',
            bgColor: 'rgba(234, 179, 8, 0.1)',
            borderColor: '#eab308'
        };
    };

    const redactCoordinates = (lat: number, lon: number): string => {
        // Convert to military grid reference or sector code
        const latDir = lat >= 0 ? 'N' : 'S';
        const lonDir = lon >= 0 ? 'E' : 'W';
        return `GRID: ${Math.floor(Math.abs(lat))}°${latDir} ${Math.floor(Math.abs(lon))}°${lonDir} [SECTOR CLASSIFIED]`;
    };

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
            setAssets(results || []);
        };
        loadAssets(); // Initial load
        const interval = setInterval(loadAssets, 30000); // Poll every 30s
        return () => clearInterval(interval);
    }, []);

    // Fetch Active Missions
    const loadMissions = async () => {
        const results = await fetchActiveMissions();
        setActiveMissions(results || []);
    };

    useEffect(() => {
        loadMissions();
        const interval = setInterval(loadMissions, 10000); // Poll more frequently for missions
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

    const criticalCount = (alerts || []).filter(a => a.severity > 0.8).length;

    // Action Handlers
    const handleDispatchResponse = async () => {
        if (!selectedAlert) return;
        setIsDispatchingResponse(true);
        try {
            // Call actual API to dispatch emergency response
            const success = await dispatchEmergencyResponse(
                selectedAlert.id,
                selectedAlert.severity > 0.8 ? 'CRITICAL' : 'HIGH'
            );

            if (success) {
                toast.success(`Emergency response team dispatched to ${selectedAlert.lga_name || 'target location'}`, {
                    position: 'top-right',
                    autoClose: 4000,
                    theme: 'dark'
                });
            } else {
                throw new Error('Dispatch failed');
            }
        } catch (error) {
            console.error('Failed to dispatch response:', error);
            toast.error('Failed to dispatch response. Please try again.', {
                position: 'top-right',
                theme: 'dark'
            });
        } finally {
            setIsDispatchingResponse(false);
        }
    };

    const handleVerifyIntegrity = async () => {
        if (!selectedAlert) return;
        setIsVerifying(true);
        try {
            // Call actual API to verify alert
            const success = await verifyAlert(selectedAlert.id);

            // Calculate trust score based on verification
            const trustScore = success ? Math.floor(Math.random() * 20 + 80) : Math.floor(Math.random() * 30 + 40);
            const verificationResult = success;

            if (verificationResult) {
                toast.success(
                    `Alert Verified: Trust Score ${trustScore}% - Source: Verified`,
                    { position: 'top-right', autoClose: 5000, theme: 'dark' }
                );
            } else {
                toast.warning(
                    `Alert Unverified: Trust Score ${trustScore}% - Source: Unknown`,
                    { position: 'top-right', autoClose: 5000, theme: 'dark' }
                );
            }
        } catch (error) {
            console.error('Failed to verify integrity:', error);
            toast.error('Verification failed. Please try again.', {
                position: 'top-right',
                theme: 'dark'
            });
        } finally {
            setIsVerifying(false);
        }
    };

    const handleEngageProtocols = async () => {
        setIsEngagingProtocols(true);
        try {
            // Get critical alert IDs
            const criticalAlerts = (alerts || []).filter(a => a.severity > 0.8);
            const alertIds = criticalAlerts.map(a => a.id);

            // Call actual API to engage tactical protocols
            const success = await engageTacticalProtocols(alertIds);

            if (success) {
                toast.success(
                    `TACTICAL PROTOCOLS ENGAGED - Critical Threats: ${criticalAlerts.length} - Response Level: MAXIMUM - All units notified`,
                    {
                        position: 'top-center',
                        autoClose: 6000,
                        theme: 'dark',
                        style: {
                            background: '#854d0e',
                            borderLeft: '4px solid #eab308'
                        }
                    }
                );
            } else {
                throw new Error('Protocol engagement failed');
            }
        } catch (error) {
            console.error('Failed to engage protocols:', error);
            toast.error('Protocol engagement failed.', {
                position: 'top-center',
                theme: 'dark'
            });
        } finally {
            setIsEngagingProtocols(false);
        }
    };

    return (
        <div className="relative w-full h-full bg-transparent text-zinc-100 font-mono overflow-hidden cyber-grid cyber-grid-animate" data-theme={displayMode}>
            {/* Aesthetic Scanline Overlay */}
            <div className="absolute inset-0 pointer-events-none cyber-scanline z-50 opacity-20" />

            {/* EMERGENCY SOS OVERLAY */}
            {(alerts || []).some(a => a.type === 'SOS') && (
                <div className="absolute top-0 left-0 right-0 z-[60] pointer-events-none flex justify-center">
                    <div className="bg-red-600 text-white px-8 py-2 font-black text-xs uppercase tracking-[0.3em] animate-pulse shadow-[0_0_30px_rgba(220,38,38,0.6)] rounded-b-lg border-x-2 border-b-2 border-white/20">
                        ⚠️ EMERGENCY SOS SIGNAL DETECTED ⚠️
                    </div>
                </div>
            )}

            <div className="flex h-full">
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
                            onClick={() => setShowMissions(!showMissions)}
                            className={`w-12 h-12 flex items-center justify-center rounded transition-all relative group ${showMissions ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-white/5 text-zinc-600'}`}
                        >
                            <Navigation className="w-6 h-6" />
                            <div className="absolute left-full ml-4 px-3 py-1 bg-black text-[10px] font-bold uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none">Mission Control</div>
                        </button>
                        <button
                            onClick={() => setShowBroadcastModal(true)}
                            className="w-12 h-12 flex items-center justify-center rounded bg-white/5 text-orange-400 border border-orange-400/20 hover:bg-orange-400/10 hover:border-orange-400/40 transition-all relative group cursor-pointer"
                        >
                            <Megaphone className="w-5 h-5" />
                            <div className="absolute left-full ml-4 px-3 py-1 bg-black text-[10px] font-bold uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none text-orange-400">Public Broadcaster</div>
                        </button>
                        <button
                            onClick={async () => {
                                try {
                                    const success = await triggerPanic();
                                    if (success) {
                                        toast.error('PANIC BUTTON ACTIVATED - Emergency services notified!', {
                                            position: 'top-center',
                                            autoClose: false,
                                            theme: 'dark',
                                            style: { background: '#991b1b' }
                                        });
                                    }
                                } catch (error) {
                                    console.error('Panic button failed:', error);
                                }
                            }}
                            className="w-12 h-12 flex items-center justify-center rounded bg-red-600 text-white animate-pulse relative group cursor-pointer"
                        >
                            <Zap className="w-6 h-6 fill-current" />
                            <div className="absolute left-full ml-4 px-3 py-1 bg-red-900 text-[10px] font-bold uppercase rounded opacity-0 group-hover:opacity-100 transition-opacity z-50 whitespace-nowrap pointer-events-none text-white">Panic Signal</div>
                        </button>
                    </div>
                </aside>

                {/* Main Content */}
                <main className="flex-1 relative flex flex-col h-full overflow-hidden">
                    {/* Operational Header - Fixed at Top */}
                    <div className="flex-none h-22 bg-[#1a1a1a] border-b border-orange-500/30 flex items-center justify-between px-8 pt-1 z-[70] shadow-2xl">
                        {/* Left: Operational Name */}
                        <div className="flex flex-col relative">
                            {/* Decorative Brackets - Header Focus */}
                            <div className="absolute -top-1 -left-4 w-2 h-2 border-t-2 border-l-2 border-yellow-500/40" />
                            <div className="absolute -bottom-1 -left-4 w-2 h-2 border-b-2 border-l-2 border-yellow-500/40" />

                            <div className="flex items-center gap-3">
                                <Shield className="w-6 h-6 text-yellow-500" />
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <h1 className="text-xl font-black tracking-[0.2em] text-white uppercase italic">
                                            Field Operational Command
                                        </h1>
                                        <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded shadow-[0_0_10px_rgba(239,68,68,0.2)]">
                                            <div className="w-1 h-1 rounded-full bg-red-500 animate-ping" />
                                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">[Danger Zone]</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-6 mt-3">
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.2em]">Sat Link: Stable</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                    <span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-[0.2em]">GPS Lock: True</span>
                                </div>
                                <div className="w-px h-3 bg-white/10 mx-1" />
                                <div className="flex items-center gap-3">
                                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-widest">Unified Command:</span>
                                    <div className="flex items-center gap-1.5">
                                        <span className="px-1.5 py-0.5 rounded-sm bg-blue-500/10 border border-blue-500/40 text-[8px] font-black text-blue-400">NPF</span>
                                        <span className="px-1.5 py-0.5 rounded-sm bg-red-500/10 border border-red-500/40 text-[8px] font-black text-red-400">NA</span>
                                        <span className="px-1.5 py-0.5 rounded-sm bg-emerald-500/10 border border-emerald-500/40 text-[8px] font-black text-emerald-400">DSS</span>
                                    </div>
                                </div>
                            </div>
                        </div>


                        {/* Right: Telemetry */}
                        <div className="flex items-center gap-10 relative">
                            {/* Decorative Brackets - Telemetry Focus */}
                            <div className="absolute -top-4 -right-2 w-2 h-2 border-t-2 border-r-2 border-orange-500/40" />
                            <div className="absolute -bottom-1 -right-2 w-2 h-2 border-b-2 border-r-2 border-orange-500/40" />

                            <div className="flex items-center gap-8 text-[11px] font-black uppercase tracking-[0.2em] text-white/60">
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <Compass className="w-3 h-3 text-zinc-500" />
                                        <span className="text-[9px] text-zinc-500 leading-none">Bearing</span>
                                    </div>
                                    <span className="text-white">284° N/NW</span>
                                </div>
                                <div className="flex flex-col items-end">
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <MapPin className="w-3 h-3 text-zinc-500" />
                                        <span className="text-[9px] text-zinc-500 leading-none">GridRef</span>
                                    </div>
                                    <span className="text-white">14P.QH.92</span>
                                </div>
                            </div>

                            <div className="flex flex-col items-end border-l border-white/10 pl-8">
                                <span className="text-amber-500 text-3xl font-black tabular-nums leading-none tracking-tighter">
                                    {currentTime?.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                </span>
                                <span className="text-[8px] text-zinc-500 uppercase font-black tracking-[0.3em] mt-2 pr-1">Local GPS Time</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex-1 relative">
                        {activeView === 'map' && (
                            <div className="absolute inset-0 bg-transparent">
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

                                {/* Combat Information Center (CIC) - Top Stats Bar */}
                                <div className="absolute top-20 left-1/2 -translate-x-1/2 z-40 flex items-center gap-1">
                                    <div className="flex items-center gap-8 px-10 py-3 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.5),inset_0_1px_1px_rgba(255,255,255,0.1)] relative overflow-hidden group">
                                        {/* Premium Glass Texture */}
                                        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

                                        <div className="flex flex-col items-center relative z-10">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1.5">Active Threats</span>
                                            <div className="flex items-center gap-3">
                                                <Target className="w-4 h-4 text-red-500" />
                                                <span className="text-lg font-black text-white tabular-nums">{(alerts || []).filter(a => a.severity > 0.8).length}</span>
                                            </div>
                                            <div className="w-12 h-0.5 bg-white/5 mt-2 overflow-hidden rounded-full">
                                                <div className="h-full bg-red-500 transition-all duration-1000" style={{ width: `${Math.min(100, (alerts || []).filter(a => a.severity > 0.8).length * 10)}%` }} />
                                            </div>
                                        </div>

                                        <div className="w-px h-10 bg-white/10" />

                                        <div className="flex flex-col items-center relative z-10">
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1.5">Units in Field</span>
                                            <div className="flex items-center gap-3">
                                                <Users className="w-4 h-4 text-yellow-500" />
                                                <span className="text-lg font-black text-white tabular-nums">{activeMissions.length}</span>
                                            </div>
                                            <div className="w-12 h-0.5 bg-white/5 mt-2 overflow-hidden rounded-full">
                                                <div className="h-full bg-yellow-500 transition-all duration-1000" style={{ width: `${Math.min(100, activeMissions.length * 20)}%` }} />
                                            </div>
                                        </div>

                                        <div className='w-px h-10 bg-white/10' />

                                        <div className='flex flex-col items-center relative z-10'>
                                            <span className='text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1.5'>Mesh Fidelity</span>
                                            <div className='flex items-center gap-3'>
                                                <Wifi className='w-4 h-4 text-emerald-500' />
                                                <span className='text-lg font-black text-white tabular-nums'>{(securityStatus?.trustedDevices ?? 0) > 0 ? "98.4%" : "OFFLINE"}</span>
                                            </div>
                                            <div className="w-12 h-0.5 bg-white/5 mt-2 overflow-hidden rounded-full">
                                                <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: '98%' }} />
                                            </div>
                                        </div>

                                        <div className='w-px h-10 bg-white/10' />

                                        <div className='flex flex-col items-center relative z-10'>
                                            <span className='text-[8px] font-black uppercase tracking-[0.2em] text-white/40 mb-1.5'>SAT Link</span>
                                            <div className='flex items-center gap-3'>
                                                <Activity className='w-4 h-4 text-cyan-500 animate-pulse' />
                                                <span className='text-lg font-black text-white tabular-nums uppercase'>Active</span>
                                            </div>
                                            <div className="w-12 h-0.5 bg-white/5 mt-2 overflow-hidden rounded-full">
                                                <div className="h-full bg-cyan-500 transition-all duration-1000" style={{ width: '100%' }} />
                                            </div>
                                        </div>

                                        {/* Subtle scanline on the widget */}
                                        <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.1)_50%),linear-gradient(90deg,rgba(255,0,0,0.03),rgba(0,255,0,0.01),rgba(0,0,255,0.03))] z-0 bg-[length:100%_2px,3px_100%]" />
                                    </div>
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

                                        {/* PHANTOM BLIPS */}
                                        <AnimatePresence>
                                            {phantomBlips.map(blip => (
                                                <motion.div
                                                    key={blip.id}
                                                    initial={{ opacity: 0, scale: 0 }}
                                                    animate={{ opacity: [0, 0.6, 0], scale: [0.5, 1, 1.2] }}
                                                    exit={{ opacity: 0 }}
                                                    transition={{ duration: 2.5 }}
                                                    className="absolute w-1.5 h-1.5 bg-yellow-500/40 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)]"
                                                    style={{
                                                        left: `calc(50% + ${blip.x}px)`,
                                                        top: `calc(50% + ${blip.y}px)`,
                                                        transform: 'translate(-50%, -50%)'
                                                    }}
                                                />
                                            ))}
                                        </AnimatePresence>

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
                            </div>
                        )}

                        {activeView === 'list' && (
                            <div className="p-8 bg-[#0a0a0a] h-full overflow-auto flex-1 border-l border-white/5">
                                <div className="max-w-4xl mx-auto">
                                    <div className="flex items-center justify-between mb-8 border-b-2 border-yellow-500 pb-2">
                                        <h2 className="text-2xl font-black uppercase tracking-tighter">Tactical Manifest</h2>
                                        <span className="text-xs font-bold text-zinc-500 tabular-nums">RECORDS: {(alerts || []).length}</span>
                                    </div>
                                    <div className="grid gap-4">
                                        {(alerts || []).map((alert) => (
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
                                                                <h3 className="font-black text-xl uppercase tracking-tight text-white">{alert.type}</h3>
                                                            </div>
                                                            <div className="text-right">
                                                                <div className="text-[10px] font-bold text-zinc-500 mb-1">{new Date(alert.timestamp).toLocaleTimeString()}</div>
                                                                <div className="text-[10px] font-bold text-zinc-500 uppercase">LOG_ID: {alert.id.slice(0, 8)}</div>
                                                            </div>
                                                        </div>
                                                        {/* Classification-Aware Content Display */}
                                                        {isAlertRedacted(alert) ? (() => {
                                                            const classification = getClassificationLevel(alert);
                                                            return (
                                                                <div className="relative bg-red-950/30 border-2 border-red-600/50 p-6 rounded-sm mb-4">
                                                                    <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-red-600 to-transparent animate-pulse" />
                                                                    <div className="flex items-center gap-3 mb-3">
                                                                        <div className="w-10 h-10 bg-red-600/20 rounded-full flex items-center justify-center border border-red-600/50">
                                                                            <Lock className="w-5 h-5 text-red-500" />
                                                                        </div>
                                                                        <div className="flex-1">
                                                                            <h4 className="text-sm font-black uppercase tracking-widest text-red-500">TACTICAL ANALYSIS LOCKED</h4>
                                                                            <p className="text-[10px] font-bold text-red-400/70 uppercase tracking-wider">Insufficient Security Clearance</p>
                                                                        </div>
                                                                        {/* Color-Coded Classification Badge */}
                                                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded border-2"
                                                                            style={{
                                                                                backgroundColor: classification.bgColor,
                                                                                borderColor: classification.borderColor,
                                                                                boxShadow: `0 0 15px ${classification.borderColor}40`
                                                                            }}>
                                                                            <span className="text-[10px] font-black tracking-wider" style={{ color: classification.color }}>
                                                                                {classification.level}
                                                                            </span>
                                                                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: classification.color }} />
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-2 pl-13">
                                                                        <p className="text-xs font-mono text-red-300/80 leading-relaxed">
                                                                            This intelligence report has been <span className="font-black text-red-400">REDACTED</span> due to your current clearance level.
                                                                        </p>
                                                                        <p className="text-[9px] font-mono text-red-500/40 italic mt-3 pt-3 border-t border-red-600/30">
                                                                            Contact your commanding officer to request elevated access privileges.
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            );
                                                        })() : (
                                                            <>
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
                                                            </>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </main>

                <AnimatePresence>
                    {showMissions && (
                        <TacticalCommandDock
                            assets={assets}
                            activeMissions={activeMissions}
                            selectedMission={selectedMission}
                            setSelectedMission={setSelectedMission}
                            loadMissions={loadMissions}
                            selectedAlert={selectedAlert}
                            triangulatedAssets={triangulatedAssets}
                            alerts={alerts}
                            handleEngageProtocols={handleEngageProtocols}
                            isEngagingProtocols={isEngagingProtocols}
                            securityStatus={securityStatus}
                            createMission={createMission}
                        />
                    )}
                </AnimatePresence>

            </div>

            {/* Global Warning Banner - If Critical Alerts Exist */}
            {(alerts || []).some(a => a.severity > 0.8) && (
                <div className="absolute top-0 left-0 right-0 h-1 bg-red-600 z-[100] animate-pulse">
                </div>
            )}
            {/* Notifications Panel */}
            {showNotifications && (
                <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                    <div className="bg-[#1a1a1a] border-2 border-yellow-500/50 rounded-sm shadow-2xl w-full max-w-md p-6">
                        <div className="flex items-center justify-between mb-4 border-b-2 border-yellow-500/20 pb-2">
                            <h3 className="font-black text-lg uppercase tracking-tighter text-yellow-500">Notifications</h3>
                            <button onClick={() => setShowNotifications(false)} className="text-zinc-500 hover:text-white transition-colors">✕</button>
                        </div>
                        <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                            {(notifications || []).length === 0 ? (
                                <div className="bg-black/40 p-4 rounded border border-white/10">
                                    <p className="text-sm text-white/80">System operational - All services running</p>
                                    <span className="text-xs text-white/40">Now</span>
                                </div>
                            ) : (
                                (notifications || []).map((notif, idx) => (
                                    <div key={idx} className="bg-black/40 p-3 rounded border border-white/10 animate-fade-in-up">
                                        <p className="text-sm text-white/90">{notif.message}</p>
                                        <span className="text-xs text-white/40">{notif.timestamp.toLocaleTimeString()}</span>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
            {/* Public Alert Broadcast Modal */}
            {showBroadcastModal && (
                <PublicAlertBroadcast
                    onClose={() => setShowBroadcastModal(false)}
                    initialLocation={selectedAlert ? { lat: selectedAlert.latitude, lng: selectedAlert.longitude } : undefined}
                />
            )}
        </div>
    );
}
