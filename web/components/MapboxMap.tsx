"use client";

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Target, Activity, Plus, Minus, Move, Shield, Briefcase } from 'lucide-react';
import { Alert, TriangulatedAsset, API_BASE_URL } from '../lib/api';

const isValidCoordinate = (lng: number, lat: number) => {
    return !isNaN(lng) && !isNaN(lat) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
};

// Main Component

interface MapboxMapProps {
    alerts: Alert[];
    selectedAlert?: Alert | null;
    triangulatedAssets?: TriangulatedAsset[]; // NEW PROP
    mode?: 'cyber' | 'tactical';
    onSelect?: (alert: Alert) => void;
    showSatellite?: boolean;
    primaryColor?: string; // NEW PROP
}

export default function MapboxMap({
    alerts,
    selectedAlert,
    triangulatedAssets = [],
    mode = 'cyber',
    onSelect,
    showSatellite = false,
    primaryColor = '#00FF95' // Default to Cyber Green
}: MapboxMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<mapboxgl.Map | null>(null);
    const markersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const resourceMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});
    const [isMapSupported, setIsMapSupported] = useState(true);
    const [showResources, setShowResources] = useState(false);
    const [tokenError, setTokenError] = useState(false);
    const hasAttemptedInit = useRef(false);
    const isCyber = mode === 'cyber';

    // Initialize Map
    useEffect(() => {
        if (hasAttemptedInit.current || !mapContainerRef.current) return;
        hasAttemptedInit.current = true;

        const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN;
        if (!token) {
            console.error("Mapbox token missing");
            setTokenError(true);
            return;
        }

        mapboxgl.accessToken = token;

        try {
            const map = new mapboxgl.Map({
                container: mapContainerRef.current,
                style: showSatellite ? 'mapbox://styles/mapbox/satellite-v9' : (isCyber ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/outdoors-v12'),
                center: [8.6753, 9.0820], // Nigeria center
                zoom: 5.5,
                pitch: isCyber ? 45 : 0,
                antialias: true
            });

            map.on('load', () => {
                mapRef.current = map;
                setIsMapSupported(true);
                // Trigger a re-render to ensure other effects run
                setTokenError(false);
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

    // Handle Style and Pitch Changes smoothly
    useEffect(() => {
        if (!isMapSupported || !mapRef.current) return;
        const newStyle = showSatellite ? 'mapbox://styles/mapbox/satellite-v9' : (isCyber ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/outdoors-v12');
        try {
            // Check if style is loaded before setting, or handle events
            const currentStyle = mapRef.current.getStyle();
            if (currentStyle && currentStyle.sprite !== newStyle) { // Simple check, might need better logic
                mapRef.current.setStyle(newStyle);
            }
            mapRef.current.setPitch(isCyber ? 45 : 0);
        } catch (error) {
            // console.error("Failed to update map style/pitch:", error);
        }
    }, [showSatellite, isCyber, isMapSupported]);


    // Handle Triangulation Vector Lines (NEW)
    useEffect(() => {
        if (!isMapSupported || !mapRef.current || !selectedAlert) return;
        const map = mapRef.current;

        const sourceId = 'triangulation-lines';
        const layerId = 'triangulation-lines-layer';

        // Helper to safely remove layer/source
        const cleanUp = () => {
            if (map.getLayer(layerId)) map.removeLayer(layerId);
            if (map.getSource(sourceId)) map.removeSource(sourceId);
        };

        // If no assets or no alert selected, clean up
        if (!triangulatedAssets || triangulatedAssets.length === 0) {
            cleanUp();
            return;
        }

        // Build GeoJSON LineStrings
        const features = triangulatedAssets.map(ta => ({
            type: 'Feature',
            properties: {
                score: ta.suitability_score // For gradient coloring if desired
            },
            geometry: {
                type: 'LineString',
                coordinates: [
                    [selectedAlert.longitude, selectedAlert.latitude], // Start (Alert)
                    [ta.asset.longitude, ta.asset.latitude]            // End (Asset)
                ]
            }
        }));

        const geoJsonData: any = {
            type: 'FeatureCollection',
            features: features
        };

        // Add or Update Source
        const addLayer = () => {
            if (!map.getSource(sourceId)) {
                map.addSource(sourceId, {
                    type: 'geojson',
                    data: geoJsonData
                });

                // Find the first label layer to insert before it
                const layers = map.getStyle().layers;
                let firstLabelLayerId;
                if (layers) {
                    for (const layer of layers) {
                        if (layer.type === 'symbol' && (layer.layout as any)?.['text-field']) {
                            firstLabelLayerId = layer.id;
                            break;
                        }
                    }
                }

                map.addLayer({
                    id: layerId,
                    type: 'line',
                    source: sourceId,
                    layout: {
                        'line-join': 'round',
                        'line-cap': 'round'
                    },
                    paint: {
                        'line-color': primaryColor, // Controlled by dashboard mode
                        'line-width': 2,
                        'line-opacity': 0.6,
                        'line-dasharray': [2, 1] // Dashed tactical look
                    }
                }, firstLabelLayerId);
            } else {
                (map.getSource(sourceId) as mapboxgl.GeoJSONSource).setData(geoJsonData);
            }
        }

        if (map.isStyleLoaded()) {
            addLayer();
        } else {
            map.once('style.load', addLayer);
        }

        // Optional: Pulse/Animate lines logic could go here

        return () => {
            // Cleanup on unmount or change is handled by next render or manual cleanup if needed
            // We keep them if the alert is still selected, but if selectedAlert changes, we update.
        };

    }, [selectedAlert, triangulatedAssets, isMapSupported]);

    // NEW: Handle Triangulated Asset Markers (The missing piece!)
    const triangulatedAssetMarkersRef = useRef<{ [key: string]: mapboxgl.Marker }>({});

    useEffect(() => {
        if (!isMapSupported || !mapRef.current) return;

        // Cleanup old asset markers
        Object.values(triangulatedAssetMarkersRef.current).forEach(marker => marker.remove());
        triangulatedAssetMarkersRef.current = {};

        if (!triangulatedAssets || triangulatedAssets.length === 0) return;

        triangulatedAssets.forEach(ta => {
            const asset = ta.asset;
            const el = document.createElement('div');
            el.className = 'triangulated-asset-marker';

            // Cyan blinking style for "Active Response Unit"
            el.innerHTML = `
                <div style="position: relative; display: flex; align-items: center; justify-content: center;">
                    <div style="position: absolute; width: 24px; height: 24px; border: 2px solid #06b6d4; border-radius: 50%; opacity: 0; animation: ping 1s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
                    <div style="width: 10px; height: 10px; background: #06b6d4; border: 2px solid white; border-radius: 50%; box-shadow: 0 0 10px #06b6d4; animation: blink 1s ease-in-out infinite;"></div>
                    <div style="position: absolute; bottom: 120%; background: rgba(0,0,0,0.8); color: #06b6d4; padding: 2px 6px; border-radius: 4px; font-size: 8px; font-weight: 900; white-space: nowrap; border: 1px solid rgba(6,182,212,0.3);">
                        ETA: 4m
                    </div>
                </div>
            `;

            if (mapRef.current) {
                const marker = new mapboxgl.Marker(el)
                    .setLngLat([asset.longitude, asset.latitude])
                    .addTo(mapRef.current);

                triangulatedAssetMarkersRef.current[asset.id] = marker;
            }
        });

    }, [triangulatedAssets, isMapSupported]);



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
            } else {
                const el = document.createElement('div');
                el.className = 'custom-marker';

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
    }, [alerts, isCyber, onSelect, isMapSupported, primaryColor]);

    // Handle Resource Markers
    useEffect(() => {
        if (!isMapSupported || !mapRef.current) return;

        // Clear existing resource markers
        Object.values(resourceMarkersRef.current).forEach(marker => marker.remove());
        resourceMarkersRef.current = {};

        if (!showResources) return;

        const fetchResources = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/v1/assets`, {
                    headers: {},
                });
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
                                <p className="text-xs font-bold uppercase">{selectedAlert.type.replace(/_/g, ' ')}</p>
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
                @keyframes blink {
                    0%, 100% { opacity: 1; transform: scale(1); box-shadow: 0 0 10px #06b6d4; }
                    50% { opacity: 0.4; transform: scale(0.8); box-shadow: 0 0 20px #06b6d4; }
                }
                @keyframes blink-generic {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.6; transform: scale(0.92); }
                }
                .mapboxgl-ctrl-bottom-right, .mapboxgl-ctrl-bottom-left {
                    display: none !important;
                }
            `}</style>
        </div>
    );
}
