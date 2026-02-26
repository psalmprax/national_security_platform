"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Target, Activity, Plus, Minus, Move, Shield, Briefcase, Globe } from 'lucide-react';
import { Alert, TriangulatedAsset, Asset, API_BASE_URL, apiFetch } from '../lib/api';

const isValidCoordinate = (lng: number, lat: number) => {
    return !isNaN(lng) && !isNaN(lat) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

// Main Component

interface MapboxMapProps {
    alerts: Alert[];
    selectedAlert?: Alert | null;
    triangulatedAssets?: TriangulatedAsset[];
    resources?: Asset[];
    mode?: 'cyber' | 'tactical';
    onSelect?: (alert: Alert) => void;
    mapLayer?: 'street' | 'satellite' | 'terrain';
    primaryColor?: string;
    showSatellite?: boolean;
    onToggleSatellite?: (show: boolean) => void;
}

export default function MapboxMap({
    alerts,
    selectedAlert,
    triangulatedAssets = [],
    resources = [],
    mode = 'cyber',
    onSelect,
    mapLayer = 'street',
    primaryColor = '#00FF95',
    showSatellite = false,
    onToggleSatellite
}: MapboxMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const resourceMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const triangulationLayersRef = useRef<string[]>([]);
    const [isMapSupported, setIsMapSupported] = useState(true);
    // If resources are passed via props, show them by default, otherwise wait for toggle
    const [showResources, setShowResources] = useState((resources || []).length > 0);
    const [isSwitching, setIsSwitching] = useState(false);
    const [tokenError, setTokenError] = useState(false);
    const [isStyleLoaded, setIsStyleLoaded] = useState(false);
    const hasAttemptedInit = useRef(false);
    const currentStyleRef = useRef<string | null>(null);
    const isCyber = mode === 'cyber';

    // Map Initialization
    useEffect(() => {
        if (!mapContainerRef.current || hasAttemptedInit.current) return;
        hasAttemptedInit.current = true;

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
            console.error("Mapbox token missing");
            setTokenError(true);
            return;
        }

        mapboxgl.accessToken = token;

        const getMapStyle = (layer: string, useSatellite: boolean) => {
            if (useSatellite) return 'mapbox://styles/mapbox/satellite-v9';
            switch (layer) {
                case 'satellite': return 'mapbox://styles/mapbox/satellite-v9';
                case 'terrain': return 'mapbox://styles/mapbox/outdoors-v12';
                default: return (isCyber || mode === 'tactical') ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
            }
        };

        try {
            const styleUrl = getMapStyle(mapLayer, showSatellite);
            currentStyleRef.current = styleUrl;

            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: styleUrl,
                center: [8.6753, 9.0820], // Nigeria center
                zoom: 5.5,
                pitch: isCyber ? 45 : ((showSatellite || mapLayer === 'satellite') ? 60 : 0),
                antialias: true
            });

            map.on('load', () => {
                mapRef.current = map;
                setIsMapSupported(true);
                setTokenError(false);
                setIsStyleLoaded(true);

                // Add Terrain support
                if (!map.getSource('mapbox-dem')) {
                    map.addSource('mapbox-dem', {
                        'type': 'raster-dem',
                        'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                        'tileSize': 512
                    });
                }
                if (mapLayer === 'satellite' || mapLayer === 'terrain') {
                    map.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
                }
            });

            map.on('error', (e) => {
                if (e.error && ((e.error as any).status === 401 || e.error.message?.includes('Unauthorized'))) {
                    setTokenError(true);
                }
            });

        } catch (err) {
            console.error("Mapbox init error:", err);
            setIsMapSupported(false);
        }

        return () => {
            mapRef.current?.remove();
        };
    }, []);

    // Handle Auto-Resize on container size change
    useEffect(() => {
        if (!mapContainerRef.current) return;

        const resizeObserver = new ResizeObserver(() => {
            if (mapRef.current) {
                mapRef.current.resize();
            }
        });

        resizeObserver.observe(mapContainerRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    // Handle Style and Pitch Changes
    useEffect(() => {
        if (!isMapSupported || !mapRef.current) return;

        const getMapStyle = (layer: string, useSatellite: boolean) => {
            if (useSatellite) return 'mapbox://styles/mapbox/satellite-v9';
            switch (layer) {
                case 'satellite': return 'mapbox://styles/mapbox/satellite-v9';
                case 'terrain': return 'mapbox://styles/mapbox/outdoors-v12';
                default: return (isCyber || mode === 'tactical') ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11';
            }
        };

        const newStyle = getMapStyle(mapLayer, showSatellite);
        const effectiveLayer = showSatellite ? 'satellite' : mapLayer;

        try {
            if (currentStyleRef.current !== newStyle) {
                setIsSwitching(true);
                setIsStyleLoaded(false);
                currentStyleRef.current = newStyle;
                mapRef.current.setStyle(newStyle);

                // Re-add terrain after style load if in satellite or terrain mode
                mapRef.current.once('style.load', () => {
                    setIsStyleLoaded(true);
                    if (mapRef.current) {
                        if (!mapRef.current.getSource('mapbox-dem')) {
                            mapRef.current.addSource('mapbox-dem', {
                                'type': 'raster-dem',
                                'url': 'mapbox://mapbox.mapbox-terrain-dem-v1',
                                'tileSize': 512
                            });
                        }
                        if (effectiveLayer === 'satellite' || effectiveLayer === 'terrain') {
                            mapRef.current.setTerrain({ 'source': 'mapbox-dem', 'exaggeration': 1.5 });
                        } else {
                            mapRef.current.setTerrain(null);
                        }
                    }
                    setTimeout(() => setIsSwitching(false), 800);
                });
            }
            mapRef.current.setPitch(effectiveLayer === 'satellite' || effectiveLayer === 'terrain' ? 60 : (isCyber ? 45 : 0));
        } catch (error) {
            setIsSwitching(false);
        }
    }, [mapLayer, showSatellite, isCyber, isMapSupported]);

    // Handle Alert Markers
    useEffect(() => {
        if (!isMapSupported || !mapRef.current) return;

        // Remove markers for alerts that no longer exist
        const currentIds = new Set((alerts || []).map(a => a.id));
        Object.keys(markersRef.current).forEach(id => {
            if (!currentIds.has(id)) {
                markersRef.current[id].remove();
                delete markersRef.current[id];
            }
        });

        // Add or update markers
        (alerts || []).forEach(alert => {
            const lng = Number(alert.longitude);
            const lat = Number(alert.latitude);

            if (!isValidCoordinate(lng, lat)) return;

            // Determine base color: High severity is always red, others follow primaryColor
            const color = alert.severity > 0.8 ? '#EF4444' : primaryColor;

            if (markersRef.current[alert.id]) {
                const marker = markersRef.current[alert.id];
                marker.setLngLat([lng, lat]);
                // Update marker element color if it changed
                const el = marker.getElement();
                const innerCircle = el.querySelector('div > div:last-child') as HTMLDivElement;
                const pulseCircle = el.querySelector('div > div:first-child') as HTMLDivElement;
                if (innerCircle) {
                    innerCircle.style.background = color;
                    innerCircle.style.boxShadow = `0 0 10px ${color}`;
                }
                if (pulseCircle) {
                    pulseCircle.style.borderColor = color;
                }

                // Update SOS class if needed
                if (alert.type === 'SOS') {
                    el.classList.add('sos-marker');
                } else {
                    el.classList.remove('sos-marker');
                }
            } else {
                const el = document.createElement('div');
                el.className = 'custom-marker';

                if (alert.type === 'SOS') {
                    el.classList.add('sos-marker');
                    el.innerHTML = `
                        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                            <div style="position: absolute; width: 60px; height: 60px; border: 4px solid #FFFFFF; border-radius: 50%; opacity: 0; animation: sos-ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                            <div style="position: absolute; width: 40px; height: 40px; background: #FF0000; border-radius: 50%; opacity: 0.5; animation: sos-flash 0.5s ease-in-out infinite alternate;"></div>
                            <div style="width: 20px; height: 20px; background: #FFFFFF; border: 3px solid #FF0000; border-radius: 50%; box-shadow: 0 0 20px #FF0000; z-index: 10;"></div>
                            <div style="position: absolute; top: -25px; background: #FF0000; color: white; font-weight: 900; font-size: 10px; padding: 2px 6px; border-radius: 4px; white-space: nowrap; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">SOS</div>
                        </div>
                    `;
                } else {
                    el.innerHTML = `
                        <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                            <div style="position: absolute; width: 30px; height: 30px; border: 2px solid ${color}; border-radius: 50%; opacity: 0.4; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                            <div style="width: 12px; height: 12px; background: ${color}; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px ${color};"></div>
                        </div>
                    `;
                }

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
    }, [alerts, isCyber, onSelect, isMapSupported, primaryColor]);

    // Handle Resource Markers
    useEffect(() => {
        if (!isMapSupported || !mapRef.current) return;

        // Clear existing resource markers
        Object.values(resourceMarkersRef.current).forEach(marker => marker.remove());
        resourceMarkersRef.current = {};

        // Use props if available, otherwise check toggle
        if (resources.length > 0) {
            // Use provided resources (Agency Portal Mode)
            resources.forEach((res: Asset) => {
                const el = document.createElement('div');
                el.className = 'resource-marker';

                // Resource Style: Blue Shield (Police) vs Red Briefcase (Medical) using pure CSS/SVG
                const color = res.type === 'POLICE' || res.type === 'PATROL_VEHICLE' || res.type === 'STATION' || res.type === 'CHECKPOINT' ? '#3B82F6' : '#EF4444';
                // Simplified Icon logic or reuse SVG
                const iconSvg = (res.type === 'POLICE' || res.type === 'PATROL_VEHICLE' || res.type === 'STATION' || res.type === 'CHECKPOINT')
                    ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' // Shield
                    : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'; // Briefcase

                el.innerHTML = `
                        <div style="background: ${color}; padding: 6px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; transform-origin: bottom center; transition: all 0.2s; animation: blink-generic 2s ease-in-out infinite;">
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
            return;
        }

        if (!showResources) return;

        const fetchResources = async () => {
            try {
                const response = await apiFetch(`/api/v1/assets`);
                if (!response.ok) return;
                const fetchedResources = await response.json();

                fetchedResources.forEach((res: any) => {
                    const el = document.createElement('div');
                    el.className = 'resource-marker';

                    // Resource Style: Blue Shield (Police) vs Red Briefcase (Medical) using pure CSS/SVG
                    const color = res.type === 'POLICE' ? '#3B82F6' : '#EF4444';
                    const iconSvg = res.type === 'POLICE'
                        ? '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>' // Shield
                        : '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="7" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>'; // Briefcase

                    el.innerHTML = `
                         <div style="background: ${color}; padding: 6px; border-radius: 6px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.3); display: flex; align-items: center; justify-content: center; transform-origin: bottom center; transition: all 0.2s; animation: blink-generic 2s ease-in-out infinite;">
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

    }, [showResources, isMapSupported, resources]);

    // Handle Triangulated Assets (ETA Lines)
    useEffect(() => {
        if (!isStyleLoaded || !mapRef.current) return;

        // Cleanup previous layers/markers
        triangulationLayersRef.current.forEach(id => {
            if (mapRef.current?.getLayer(id)) mapRef.current.removeLayer(id);
            if (mapRef.current?.getSource(id)) mapRef.current.removeSource(id);
            const el = document.getElementById(`marker-${id}`);
            if (el) el.remove();
        });
        triangulationLayersRef.current = [];

        if (!(triangulatedAssets || []).length || !selectedAlert) return;

        (triangulatedAssets || []).forEach((ta, i) => {
            // 1. Create Line Source
            const lineId = `triangulation-line-${i}`;
            const sourceData: GeoJSON.Feature<GeoJSON.LineString> = {
                type: 'Feature',
                properties: {},
                geometry: {
                    type: 'LineString',
                    coordinates: [
                        [selectedAlert.longitude, selectedAlert.latitude],
                        [ta.asset.longitude, ta.asset.latitude]
                    ]
                }
            };

            mapRef.current?.addSource(lineId, {
                type: 'geojson',
                data: sourceData
            });

            mapRef.current?.addLayer({
                id: lineId,
                type: 'line',
                source: lineId,
                layout: {
                    'line-join': 'round',
                    'line-cap': 'round'
                },
                paint: {
                    'line-color': '#00FF95',
                    'line-width': 2,
                    'line-opacity': 0.6,
                    'line-dasharray': [2, 2]
                }
            });

            // 2. Create Marker & ETA Label
            const el = document.createElement('div');
            el.id = `marker-${lineId}`;
            el.className = 'triangulation-marker';

            // ETA Calculation (Assumption: 60km/h => 1km/min)
            // Distance is in meters. 4000m => 4 mins
            const etaMinutes = Math.ceil(ta.distance_meters / 1000);

            el.innerHTML = `
                <div style="position: absolute; top: -24px; left: 50%; transform: translateX(-50%); background: rgba(0,0,0,0.8); border: 1px solid rgba(0, 255, 149, 0.3); padding: 2px 6px; border-radius: 4px; display: flex; align-items: center; gap: 4px; white-space: nowrap; pointer-events: none;">
                    <span style="font-size: 8px; font-weight: 800; color: #00FF95; letter-spacing: 0.05em;">ETA: ${etaMinutes}m</span>
                </div>
                <div style="width: 24px; height: 24px; background: rgba(0, 255, 149, 0.1); border: 1px solid #00FF95; border-radius: 50%; display: flex; align-items: center; justify-content: center; animation: pulse 2s infinite;">
                    <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#00FF95" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>
                </div>
            `;

            new mapboxgl.Marker(el)
                .setLngLat([ta.asset.longitude, ta.asset.latitude])
                .addTo(mapRef.current!);

            triangulationLayersRef.current.push(lineId);
        });

    }, [triangulatedAssets, selectedAlert, isStyleLoaded]);

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
    }, [selectedAlert, isMapSupported, isStyleLoaded]);

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

            {/* Scanning Overlay Effect */}
            {isSwitching && (
                <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/40 backdrop-blur-sm pointer-events-none">
                    <div className="flex flex-col items-center gap-4">
                        <div className="w-64 h-[1px] bg-cyan-500 animate-scanline-h" />
                        <div className="text-[10px] font-black text-cyan-500 tracking-[0.5em] animate-pulse uppercase">Satellite Uplink Established</div>
                        <div className="w-64 h-[1px] bg-cyan-500 animate-scanline-h-rev" />
                    </div>
                </div>
            )}

            {/* Overlay Grid/Effects for Cyber Mode */}
            {isCyber && mapLayer !== 'satellite' && (
                <div className="absolute inset-0 pointer-events-none opacity-[0.05]" style={{
                    backgroundImage: `
                        linear-gradient(to right, ${primaryColor} 1px, transparent 1px),
                        linear-gradient(to bottom, ${primaryColor} 1px, transparent 1px)
                    `,
                    backgroundSize: '100px 100px'
                }} />
            )}

            {/* ZOOM CONTROLS */}
            <div className="absolute bottom-8 right-8 z-30 flex flex-col gap-2">
                <button
                    onClick={handleZoomIn}
                    className={`p-3 border backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer ${isCyber ? 'bg-black/60' : 'border-slate-300 bg-white/90 text-slate-700 shadow-sm'
                        }`}
                    style={isCyber ? { borderColor: primaryColor + '66', color: primaryColor } : {}}
                >
                    <Plus className="w-5 h-5" />
                </button>
                <button
                    onClick={handleZoomOut}
                    className={`p-3 border backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer ${isCyber ? 'bg-black/60' : 'border-slate-300 bg-white/90 text-slate-700 shadow-sm'
                        }`}
                    style={isCyber ? { borderColor: primaryColor + '66', color: primaryColor } : {}}
                >
                    <Minus className="w-5 h-5" />
                </button>
                <button
                    onClick={resetView}
                    className={`p-3 border backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer ${isCyber ? 'bg-black/40' : 'border-slate-300 bg-white/90 text-slate-700 shadow-sm'
                        }`}
                    style={isCyber ? { borderColor: primaryColor + '33', color: primaryColor + '99' } : {}}
                >
                    <Move className="w-5 h-5" />
                </button>
                <div className="h-4"></div> {/* Spacer */}
                <button
                    onClick={() => onToggleSatellite?.(!showSatellite)}
                    title="Toggle Map Layers"
                    className={`p-3 border backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer ${mapLayer === 'satellite' || mapLayer === 'terrain'
                        ? (isCyber ? '' : 'border-cyan-500 bg-cyan-500 text-white shadow-lg')
                        : (isCyber ? 'bg-black/60' : 'border-slate-300 bg-white/90 text-slate-700 shadow-sm')
                        }`}
                    style={isCyber ? (mapLayer === 'satellite' || mapLayer === 'terrain' ? { borderColor: '#06b6d4', backgroundColor: 'rgba(6, 182, 212, 0.2)', color: '#06b6d4', boxShadow: '0 0 15px rgba(6, 182, 212, 0.3)' } : { borderColor: primaryColor + '66', color: primaryColor }) : {}}
                >
                    <Globe className="w-5 h-5" />
                </button>
                <button
                    onClick={() => setShowResources(!showResources)}
                    title="Toggle Critical Resources"
                    className={`p-3 border backdrop-blur-md transition-all hover:scale-110 active:scale-95 cursor-pointer ${showResources
                        ? (isCyber ? '' : 'border-blue-500 bg-blue-500 text-white shadow-lg')
                        : (isCyber ? 'bg-black/60' : 'border-slate-300 bg-white/90 text-slate-700 shadow-sm')
                        }`}
                    style={isCyber ? (showResources ? { borderColor: primaryColor, backgroundColor: primaryColor + '33', color: primaryColor, boxShadow: `0 0 15px ${primaryColor}4d` } : { borderColor: primaryColor + '66', color: primaryColor }) : {}}
                >
                    {showResources ? <Shield className="w-5 h-5 fill-current" /> : <Shield className="w-5 h-5" />}
                </button>
            </div>

            {/* Selection HUD Panel */}
            {selectedAlert && (
                <div className="absolute top-24 left-8 z-30 animate-in slide-in-from-left-4 fade-in duration-500 pointer-events-none">
                    <div className={`glass-card p-4 border backdrop-blur-xl flex flex-col gap-2 ${isCyber ? 'bg-white/[0.05]' : 'border-slate-200 bg-white/90'}`} style={isCyber ? { borderColor: primaryColor + '33' } : {}}>
                        <div className="flex items-center gap-2 mb-2">
                            {isCyber ? <Target className="w-4 h-4" style={{ color: primaryColor }} /> : <Activity className="w-4 h-4 text-slate-600" />}
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isCyber ? '' : 'text-slate-900'}`} style={isCyber ? { color: primaryColor } : {}}>
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
                @keyframes sos-ping {
                    0% { transform: scale(0.5); opacity: 0.8; border-width: 4px; }
                    100% { transform: scale(3.5); opacity: 0; border-width: 0px; }
                }
                @keyframes sos-flash {
                    0% { opacity: 0.3; transform: scale(0.9); }
                    100% { opacity: 0.8; transform: scale(1.1); }
                }
                @keyframes blink {
                    0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 10px #06b6d4; }
                    50% { opacity: 0.4; transform: scale(0.8); box-shadow: 0 0 20px #06b6d4; }
                }
                @keyframes blink-generic {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.92); }
                }
                @keyframes scanline-h {
                    0% { transform: scaleX(0); opacity: 0; }
                    50% { transform: scaleX(1.2); opacity: 1; }
                    100% { transform: scaleX(0); opacity: 0; }
                }
                @keyframes scanline-h-rev {
                    0% { transform: scaleX(1.2); opacity: 0; }
                    50% { transform: scaleX(0); opacity: 1; }
                    100% { transform: scaleX(1.2); opacity: 0; }
                }
                .animate-scanline-h {
                    animation: scanline-h 1.5s ease-in-out infinite;
                }
                .animate-scanline-h-rev {
                    animation: scanline-h-rev 1.5s ease-in-out infinite;
                }
                .mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
