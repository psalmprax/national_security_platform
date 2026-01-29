"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Target, Activity, Plus, Minus, Move, Shield, Briefcase } from 'lucide-react';
import { Alert } from '../lib/api';

// IMPORTANT: A Mapbox public access token is required.
// Replace this with your token or ensure it is set in process.env.NEXT_PUBLIC_MAPBOX_TOKEN
const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN || 'pk.eyJ1IjoicHNhbG1wcmF4IiwiYSI6ImNta3lsdnNtajA4M2ozZXM2Mnd0cWF0OHMifQ.mI66qXgyqyh6kRVSoJYLhQ';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

mapboxgl.accessToken = MAPBOX_TOKEN;

const isValidCoordinate = (lng: number, lat: number) => {
    return typeof lng === 'number' && !isNaN(lng) && Math.abs(lng) <= 180 &&
        typeof lat === 'number' && !isNaN(lat) && Math.abs(lat) <= 90;
};



interface MapboxMapProps {
    alerts: Alert[];
    selectedAlert?: Alert | null;
    mode?: 'cyber' | 'tactical';
    onSelect?: (alert: Alert) => void;
    showSatellite?: boolean;
}

export default function MapboxMap({ alerts, selectedAlert, mode = 'cyber', onSelect, showSatellite = false }: MapboxMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const resourceMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const [isMapSupported, setIsMapSupported] = useState(true);
    const [showResources, setShowResources] = useState(false);
    const [tokenError, setTokenError] = useState(false);
    const hasAttemptedInit = useRef(false);
    const isCyber = mode === 'cyber';

    // Initialize Map and Check Support
    useEffect(() => {
        if (!isMapSupported || !mapContainerRef.current || mapRef.current || hasAttemptedInit.current) return;

        hasAttemptedInit.current = true;

        if (!mapboxgl.supported()) {
            console.error("WebGL is not supported by this browser.");
            setIsMapSupported(false);
            return;
        }

        try {
            const initialStyle = showSatellite
                ? 'mapbox://styles/mapbox/satellite-v9'
                : (isCyber ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/outdoors-v12');

            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: initialStyle,
                center: [8.6753, 9.0820], // Center of Nigeria
                zoom: 5.5,
                pitch: isCyber ? 45 : 0,
                failIfMajorPerformanceCaveat: false,
                preserveDrawingBuffer: true, // Help with some rendering issues in Chrome
            });

            mapRef.current = map;

            map.on('error', (e: any) => {
                if (e.error?.status === 401 || e.error?.message?.includes('Unauthorized')) {
                    setTokenError(true);
                }
                console.error("Mapbox error:", e);
            });

            map.on('load', () => {
                // Map ready
            });
        } catch (error) {
            console.error("Map initialization failed:", error);
            setIsMapSupported(false);
        }

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
            hasAttemptedInit.current = false;
        };
    }, [isMapSupported, isCyber]);

    // Handle Style and Pitch Changes smoothly
    useEffect(() => {
        if (!isMapSupported || !mapRef.current) return;
        const newStyle = showSatellite ? 'mapbox://styles/mapbox/satellite-v9' : (isCyber ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/outdoors-v12');
        try {
            mapRef.current.setStyle(newStyle);
            mapRef.current.setPitch(isCyber ? 45 : 0);
        } catch (error) {
            console.error("Failed to update map style/pitch:", error);
        }
    }, [showSatellite, isCyber, isMapSupported]);

    // Handle Alert Markers
    useEffect(() => {
        if (!isMapSupported || !mapRef.current) return;

        // Remove markers for alerts that no longer exist
        const currentIds = new Set(alerts.map(a => a.id));
        Object.keys(markersRef.current).forEach(id => {
            if (!currentIds.has(id)) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });

        // Add or update markers
        alerts.forEach(alert => {
            const lng = Number(alert.longitude);
            const lat = Number(alert.latitude);

            if (!isValidCoordinate(lng, lat)) {
                console.warn(`Skipping alert ${alert.id} due to invalid coordinates: [${lng}, ${lat}]`);
                return;
            }

            if (markersRef.current[alert.id]) {
                markersRef.current[alert.id].setLngLat([lng, lat]);
            } else {
                const el = document.createElement('div');
                el.className = 'custom-marker';

                // Set marker color/style based on severity
                const color = alert.severity > 0.8 ? '#EF4444' : (alert.severity > 0.5 ? '#F59E0B' : (isCyber ? '#00FF95' : '#3B82F6'));

                el.innerHTML = `
                    <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                        <div style="position: absolute; width: 30px; height: 30px; border: 2px solid ${color}; border-radius: 50%; opacity: 0.4; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                        <div style="width: 12px; height: 12px; background: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px ${color};"></div>
                    </div>
                `;

                el.addEventListener('click', () => {
                    onSelect?.(alert);
                });

                if (mapRef.current) {
                    const marker = new mapboxgl.Marker(el)
                        .setLngLat([lng, lat])
                        .addTo(mapRef.current);

                    markersRef.current[alert.id] = marker;
                }
            }
        });
    }, [alerts, isCyber, onSelect, isMapSupported]);

    // Handle Resource Markers
    useEffect(() => {
        if (!isMapSupported || !mapRef.current) return;

        // Clear existing resource markers
        Object.values(resourceMarkersRef.current).forEach(marker => marker.remove());
        resourceMarkersRef.current = {};

        if (!showResources) return;

        const fetchResources = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/assets`);
                if (!res.ok) return;
                const resources = await res.json();

                resources.forEach((res: any) => {
                    const el = document.createElement('div');
                    el.className = 'resource-marker';

                    // Resource Style: Blue Shield (Police) vs Red Briefcase (Medical) using pure CSS/SVG
                    const color = res.type === 'POLICE' ? '#3B82F6' : '#EF4444';
                    const iconSvg = res.type === 'POLICE'
                        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' // Shield
                        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'; // Briefcase

                    el.innerHTML = `
                         <div style="background: ${color}; padding: 6px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; transform-origin: bottom center; transition: all 0.2s;">
                             ${iconSvg}
                             <div style="position: absolute; bottom: -4px; left: 50%; transform: translateX(-50%); width: 0; height: 0; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 4px solid ${color};"></div>
                         </div>
                     `;

                    // Simple tooltip on hover
                    el.title = `${res.name} (${res.description || 'No Details'})`;

                    if (mapRef.current) {
                        const marker = new mapboxgl.Marker(el)
                            .setLngLat([res.longitude, res.latitude])
                            .addTo(mapRef.current);

                        resourceMarkersRef.current[res.id] = marker;
                    }
                });

            } catch (err) {
                console.error("Failed to fetch resources", err);
            }
        };

        fetchResources();

    }, [showResources, isMapSupported]);

    // Handle Selection Fly-To
    useEffect(() => {
        if (!isMapSupported || !mapRef.current || !selectedAlert) return;

        const lng = Number(selectedAlert.longitude);
        const lat = Number(selectedAlert.latitude);

        if (!isValidCoordinate(lng, lat)) return;

        mapRef.current.flyTo({
            center: [lng, lat],
            zoom: 12,
            duration: 2000,
            essential: true,
            pitch: 60,
        });
    }, [selectedAlert, isMapSupported]);

    const handleZoomIn = () => mapRef.current?.zoomIn();
    const handleZoomOut = () => mapRef.current?.zoomOut();
    const resetView = () => {
        mapRef.current?.flyTo({
            center: [8.6753, 9.0820],
            zoom: 5.5,
            pitch: isCyber ? 45 : 0,
            bearing: 0,
        });
    };

    if (tokenError) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] border border-orange-500/20 rounded-2xl p-8 text-center transition-all duration-700">
                <div className="w-16 h-16 rounded-full bg-orange-500/10 flex items-center justify-center mb-6 animate-pulse">
                    <Target className="w-8 h-8 text-orange-500" />
                </div>
                <h3 className="text-xl font-black text-white/90 tracking-tighter mb-2 uppercase">Interface Auth Failure</h3>
                <p className="text-sm text-white/40 max-w-sm leading-relaxed mb-6">
                    Mapbox authentication failed (401). This usually means the Public Access Token has expired or is invalid.
                </p>
                <div className="flex flex-col gap-3 items-center">
                    <a
                        href="https://www.mapbox.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-6 py-2 bg-orange-500/20 border border-orange-500/40 text-orange-500 text-xs font-bold uppercase rounded-lg hover:bg-orange-500/30 transition-all pointer-events-auto"
                    >
                        Get Free Token
                    </a>
                    <p className="text-[10px] text-white/20 font-mono italic">
                        Add variable: NEXT_PUBLIC_MAPBOX_TOKEN to your .env or docker-compose
                    </p>
                </div>
            </div>
        );
    }

    if (!isMapSupported) {
        return (
            <div className="w-full h-full flex flex-col items-center justify-center bg-[#050505] border border-red-500/20 rounded-2xl p-8 text-center transition-all duration-700">
                <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mb-6 animate-pulse">
                    <Plus className="w-8 h-8 text-red-500" />
                </div>
                <h3 className="text-xl font-black text-white/90 tracking-tighter mb-2 uppercase">Hardware Acceleration Required</h3>
                <p className="text-sm text-white/40 max-w-sm leading-relaxed">
                    WebGL acceleration is required for the 3D Situational Awareness View.
                    Please enable hardware acceleration or use a compatible browser.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full h-full relative group">
            <div ref={mapContainerRef} className="w-full h-full" />

            {/* Overlay Grid/Effects for Cyber Mode */}
            {isCyber && !showSatellite && (
                <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{
                    backgroundImage: `
                        linear-gradient(to right, #00FF95 1px, transparent 1px),
                        linear-gradient(to bottom, #00FF95 1px, transparent 1px)
                    `,
                    backgroundSize: '100px 100px'
                }} />
            )}

            {/* ZOOM CONTROLS */}
            <div className="absolute bottom-8 right-8 z-30 flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    className={`p-3 border backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer ${isCyber ? 'border-[#00FF95]/40 bg-black/60 text-[#00FF95]' : 'border-slate-300 bg-white/90 text-slate-700 shadow-sm'
                        }`}
                >
                    <Plus className="w-5 h-5" />
                </button>
                <button
                    onClick={handleZoomOut}
                    className={`p-3 border backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer ${isCyber ? 'border-[#00FF95]/40 bg-black/60 text-[#00FF95]' : 'border-slate-300 bg-white/90 text-slate-700 shadow-sm'
                        }`}
                >
                    <Minus className="w-5 h-5" />
                </button>
                <button
                    onClick={resetView}
                    className={`p-3 border backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer ${isCyber ? 'border-[#00FF95]/20 bg-black/40 text-[#00FF95]/60' : 'border-slate-300 bg-white/90 text-slate-700 shadow-sm'
                        }`}
                >
                    <Move className="w-5 h-5" />
                </button>
                <div className="h-4"></div> {/* Spacer */}
                <button
                    onClick={() => setShowResources(!showResources)}
                    title="Toggle Critical Resources"
                    className={`p-3 border backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer ${showResources
                        ? (isCyber ? 'border-[#00FF95] bg-[#00FF95]/20 text-[#00FF95] shadow-[0_0_15px_rgba(0,255,149,0.3)]' : 'border-blue-500 bg-blue-500 text-white shadow-lg')
                        : (isCyber ? 'border-[#00FF95]/40 bg-black/60 text-[#00FF95]' : 'border-slate-300 bg-white/90 text-slate-700 shadow-sm')
                        }`}
                >
                    {showResources ? <Shield className="w-5 h-5 fill-current" /> : <Shield className="w-5 h-5" />}
                </button>
            </div>

            {/* Selection HUD Panel */}
            {selectedAlert && (
                <div className="absolute top-24 left-8 z-30 animate-in slide-in-from-left-4 fade-in duration-500 pointer-events-none">
                    <div className={`glass-card p-4 border backdrop-blur-xl flex flex-col gap-2 ${isCyber ? 'border-[#00FF95]/20 bg-[#00FF95]/5' : 'border-slate-200 bg-white/90'}`}>
                        <div className="flex items-center gap-2 mb-2">
                            {isCyber ? <Target className="w-4 h-4 text-[#00FF95]" /> : <Activity className="w-4 h-4 text-slate-600" />}
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isCyber ? 'text-[#00FF95]' : 'text-slate-900'}`}>
                                Target Lock: {selectedAlert.id.slice(0, 8)}
                            </span>
                        </div>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-2">
                            <div>
                                <p className="text-[8px] opacity-40 uppercase font-black">Latitude</p>
                                <p className="text-xs font-mono tabular-nums">{selectedAlert.latitude.toFixed(4)}</p>
                            </div>
                            <div>
                                <p className="text-[8px] opacity-40 uppercase font-black">Longitude</p>
                                <p className="text-xs font-mono tabular-nums">{selectedAlert.longitude.toFixed(4)}</p>
                            </div>
                            <div className="col-span-2 pt-2 border-t border-white/5">
                                <p className="text-[8px] opacity-40 uppercase font-black">Classification</p>
                                <p className="text-xs font-bold uppercase">{selectedAlert.type}</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <style jsx global>{`
                @keyframes ping {
                    0% { transform: scale(1); opacity: 0.8; }
                    100% { transform: scale(2.5); opacity: 0; }
                }
                .mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
