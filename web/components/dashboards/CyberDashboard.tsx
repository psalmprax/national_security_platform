import React, { useState, useEffect } from 'react';
import {
    Shield,
    AlertTriangle,
    Database,
    Cpu,
    Map as MapIcon,
    Bell,
    User,
    Radio,
    Zap,
    Locate,
    Activity,
    Lock,
    Eye,
    TrendingUp,
    X,
    ShieldAlert
} from 'lucide-react';
import MapboxMap from '../MapboxMap';
import TriageSidebar from '../TriageSidebar';
import AnonymousTipFeed from '../cyber/AnonymousTipFeed';
import Portal from '../../components/Portal';
import CyberSidebar from './cyber/CyberSidebar';
import CyberHUD from './cyber/CyberHUD';
import CyberAlertTriage from './cyber/CyberAlertTriage';
import CyberAuditLog from './cyber/CyberAuditLog';
import CyberCompliance from './cyber/CyberCompliance';

import { Alert, SecurityScan, fetchSecurityScans, TriangulatedAsset, fetchTriangulatedAssets, dispatchAsset, verifyAlert, API_BASE_URL, SystemStatus, formatLabel } from '../../lib/api';
import { useAuth, User as UserType } from '../../lib/AuthContext';
import { motion } from 'framer-motion';



interface CyberDashboardProps {
    alerts: Alert[];
    currentTime: Date | null;
    securityStatus: SystemStatus;
    user: UserType | null;
    logout: () => void;
    displayMode: 'dark' | 'light' | 'contrast' | 'oled' | 'terminal';
    setDisplayMode: (mode: 'dark' | 'light' | 'contrast' | 'oled' | 'terminal') => void;
}

export default function CyberDashboard({ alerts, currentTime, securityStatus, user, logout, displayMode, setDisplayMode }: CyberDashboardProps) {
    // const { user, logout } = useAuth(); // Redundant, passed as props
    const [activeView, setActiveView] = useState<'map' | 'alerts' | 'data' | 'analytics' | 'profile' | 'registry' | 'compliance'>('map');
    const [filterMode, setFilterMode] = useState<'all' | 'secure' | 'active' | 'signal'>('all');
    const [operationMode, setOperationMode] = useState<'NOMINAL' | 'SURGICAL' | 'TACTICAL' | 'DARK_OPS'>('NOMINAL');
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [showSatellite, setShowSatellite] = useState(false);
    const [securityScans, setSecurityScans] = useState<SecurityScan[]>([]);
    const [triangulatedAssets, setTriangulatedAssets] = useState<TriangulatedAsset[]>([]);
    const [liveAlerts, setLiveAlerts] = useState<Alert[]>(alerts);
    const [showGrid, setShowGrid] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [sidebarMode, setSidebarMode] = useState<'triage' | 'tips'>('triage');
    const itemsPerPage = 10;

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
        const latDir = lat >= 0 ? 'N' : 'S';
        const lonDir = lon >= 0 ? 'E' : 'W';
        return `GRID: ${Math.floor(Math.abs(lat))}°${latDir} ${Math.floor(Math.abs(lon))}°${lonDir} [SECTOR CLASSIFIED]`;
    };

    interface Notification {
        message: string;
        timestamp: Date;
        type: 'info' | 'alert' | 'system';
    }
    const [notifications, setNotifications] = useState<Notification[]>([
        { message: "System initialized. Secure connection established.", timestamp: new Date(), type: 'system' }
    ]);

    // Sync with props
    useEffect(() => {
        setLiveAlerts(alerts);
    }, [alerts]);

    // Server-Sent Events (SSE) (NEW)
    useEffect(() => {
        const eventSource = new EventSource(`${API_BASE_URL}/api/v1/events/stream`);

        eventSource.onopen = () => {
            console.log("🟢 SSE Pipeline Connected: Listening for real-time intelligence...");
        };

        eventSource.onmessage = (event) => {
            try {
                // Assuming NATS sends raw JSON of Alert model
                const newData = JSON.parse(event.data);

                // Map raw data similarly to fetchAlerts
                const newAlert: Alert = {
                    ...newData,
                    id: newData.id || '',
                    latitude: Number(newData.latitude || 0),
                    longitude: Number(newData.longitude || 0),
                    type: formatLabel(newData.alert_type || newData.type || 'Unknown'),
                    content: newData.content_text || newData.content || 'No description available.',
                    location: `${Number(newData.latitude || 0).toFixed(4)}, ${Number(newData.longitude || 0).toFixed(4)}`,
                    timestamp: newData.created_at || newData.timestamp || new Date().toISOString(),
                    isTrusted: (newData.verification_count || 0) > 0,
                    severity: newData.severity || 0.5,
                };

                setLiveAlerts((prev: Alert[]) => {
                    // Avoid duplicates
                    if (prev.find((a: Alert) => a.id === newAlert.id)) return prev;

                    // Add Notification
                    setNotifications((prevNotifs: Notification[]) => [
                        { message: `New Alert Detected: ${newAlert.type} - ${newAlert.location || 'Unknown Location'}`, timestamp: new Date(), type: 'alert' },
                        ...prevNotifs
                    ]);
                    // Show notification badge/toast if panel is closed (optional enhancement later)
                    if (!showNotifications) setShowNotifications(true);

                    return [newAlert, ...prev];
                });
            } catch (e) {
                console.error("Failed to parse intelligence stream:", e);
            }
        };

        eventSource.onerror = (err) => {
            // console.error("SSE Connection Error", err);
            // Browser re-connects automatically
        };

        return () => {
            eventSource.close();
        };
    }, []);

    // Fetch Security Scans if Admin
    useEffect(() => {
        if (user?.role === 'ADMIN') {
            const loadScans = async () => {
                const scans = await fetchSecurityScans(currentPage, itemsPerPage);
                setSecurityScans(scans);
            };
            loadScans();
            const interval = setInterval(loadScans, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user, currentPage]);

    // Mode-specific behaviors
    useEffect(() => {
        if (operationMode === 'SURGICAL') {
            setFilterMode('secure');
        } else if (operationMode === 'DARK_OPS') {
            setFilterMode('active');
        } else {
            setFilterMode('all'); // Reset filter when not in specific modes
        }
    }, [operationMode]);

    // Display Mode Functional Logic
    useEffect(() => {
        if (displayMode === 'terminal') {
            setShowGrid(true);
            setShowSatellite(false);
        } else if (displayMode === 'oled') {
            setShowGrid(false);
            setShowSatellite(false);
        } else {
            setShowGrid(true);
        }
    }, [displayMode]);

    const handleAlertSelect = (alert: Alert) => {
        setSelectedAlert(alert);
        fetchTriangulatedAssets(alert.id).then(setTriangulatedAssets).catch(console.error);
    };

    // Auto-trigger triangulation when in Tactical mode and an alert is selected
    useEffect(() => {
        if (operationMode === 'TACTICAL' && selectedAlert) {
            handleAlertSelect(selectedAlert);
        }
    }, [operationMode, selectedAlert]);

    // Clear triangulation data when no alert is selected
    useEffect(() => {
        if (!selectedAlert) {
            setTriangulatedAssets([]);
        }
    }, [selectedAlert]);

    // Mode-specific themes
    const themes = {
        NOMINAL: { primary: '#00FF95', secondary: 'rgba(0, 255, 149, 0.1)', glow: 'rgba(0, 255, 149, 0.3)', text: 'text-[#00FF95]' },
        SURGICAL: { primary: '#60A5FA', secondary: 'rgba(96, 165, 250, 0.1)', glow: 'rgba(96, 165, 250, 0.4)', text: 'text-blue-400' },
        TACTICAL: { primary: '#FACC15', secondary: 'rgba(250, 204, 21, 0.1)', glow: 'rgba(250, 204, 21, 0.4)', text: 'text-yellow-400' },
        DARK_OPS: { primary: '#EF4444', secondary: 'rgba(239, 68, 68, 0.1)', glow: 'rgba(239, 68, 68, 0.4)', text: 'text-red-500' }
    };

    const currentTheme = themes[operationMode as keyof typeof themes] || themes.NOMINAL;

    // Filter Logic
    const filteredAlerts = liveAlerts.filter((alert: Alert) => {
        // Special Mode Behaviors
        if (operationMode === 'SURGICAL') return alert.isTrusted;
        if (operationMode === 'DARK_OPS') return alert.severity > 0.4;

        if (filterMode === 'all') return true;
        if (filterMode === 'secure') return alert.isTrusted;
        if (filterMode === 'active') return alert.severity > 0.6;
        if (filterMode === 'signal') return true;
        return true;
    });

    return (
        <div className="relative w-full h-full" data-theme={displayMode}>
            {/* Animated Background Grid - Specific to Cyber Theme */}
            {showGrid && (
                <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className="absolute inset-0 bg-transparent" />
                    <div className="absolute inset-0" style={{
                        backgroundImage: `
                        linear-gradient(${currentTheme.primary}08 1px, transparent 1px),
                        linear-gradient(90deg, ${currentTheme.primary}08 1px, transparent 1px)
                    `,
                        backgroundSize: '50px 50px',
                        animation: 'gridMove 20s linear infinite'
                    }} />
                    <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: `${currentTheme.primary}0d` }} />
                    <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s', backgroundColor: `${currentTheme.primary}0d` }} />
                </div>
            )}

            <style jsx global>{`
                @keyframes gridMove {
                    0% { background-position: 0 0; }
                    100% { background-position: 0 50px; }
                }
                @keyframes glow {
                    0%, 100% { box-shadow: 0 0 10px ${currentTheme.glow}, 0 0 20px ${currentTheme.secondary}; }
                    50% { box-shadow: 0 0 20px ${currentTheme.glow}, 0 0 40px ${currentTheme.secondary}; }
                }
                @keyframes slideInRight {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .glow-current {
                    box-shadow: 0 0 15px ${currentTheme.glow};
                }
            `}</style>

            <div className="flex h-full relative z-10">
                {/* Extracted Sidebar */}
                <CyberSidebar
                    activeView={activeView}
                    setActiveView={setActiveView}
                    showNotifications={showNotifications}
                    setShowNotifications={setShowNotifications}
                    user={user}
                    currentTheme={currentTheme}
                />

                <div className="flex-1 flex relative h-full overflow-hidden cyber-grid cyber-grid-animate" data-theme={displayMode}>
                    {/* Aesthetic Scanline Overlay */}
                    <div className="absolute inset-0 pointer-events-none cyber-scanline z-50 opacity-20" />

                    {/* Extracted HUD */}
                    <CyberHUD
                        operationMode={operationMode}
                        setOperationMode={setOperationMode}
                        securityStatus={securityStatus}
                        currentTime={currentTime}
                        userRole={user?.role}
                        currentTheme={currentTheme}
                        themes={themes}
                    />

                    <main className="flex-1 relative overflow-hidden flex flex-col pointer-events-none">
                        {/* VIEW: Map */}
                        {activeView === 'map' && (
                            <div className="absolute inset-0 z-0 pointer-events-auto">
                                <MapboxMap
                                    alerts={filteredAlerts}
                                    selectedAlert={selectedAlert}
                                    triangulatedAssets={triangulatedAssets}
                                    onSelect={handleAlertSelect}
                                    showSatellite={showSatellite}
                                    primaryColor={currentTheme.primary}
                                />
                            </div>
                        )}

                        <div className="flex-1 relative z-20 pointer-events-auto overflow-hidden">
                            {/* VIEW: Alert Triage */}
                            {activeView === 'alerts' && (
                                <CyberAlertTriage
                                    alerts={filteredAlerts}
                                    onSelect={handleAlertSelect}
                                    filterMode={filterMode}
                                    setActiveView={setActiveView}
                                    isAlertRedacted={isAlertRedacted}
                                />
                            )}

                            {/* VIEW: Audit Logs */}
                            {activeView === 'data' && (
                                <CyberAuditLog
                                    alerts={filteredAlerts}
                                    securityStatus={securityStatus}
                                    isAlertRedacted={isAlertRedacted}
                                />
                            )}

                            {/* VIEW: Compliance */}
                            {activeView === 'compliance' && (
                                <CyberCompliance
                                    securityScans={securityScans}
                                    currentTheme={currentTheme}
                                    currentPage={currentPage}
                                    setCurrentPage={setCurrentPage}
                                    itemsPerPage={itemsPerPage}
                                />
                            )}
                        </div>

                        {/* Floating Map Controls */}
                        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 glass-card px-8 py-4 flex gap-8 border-white/5 shadow-2xl pointer-events-auto" style={{ borderColor: currentTheme.primary + '1a' }}>
                            <div
                                onClick={() => setFilterMode(filterMode === 'secure' ? 'all' : 'secure')}
                                className={`flex flex-col items-center gap-1 group cursor-pointer transition-all ${filterMode === 'secure' ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <Shield className={`w-4 h-4 transition-transform ${filterMode === 'secure' ? 'drop-shadow-[0_0_8px_rgba(255,255,255,0.3)]' : 'text-zinc-500'}`} style={filterMode === 'secure' ? { color: currentTheme.primary } : {}} />
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${filterMode === 'secure' ? '' : 'text-white/40'}`} style={filterMode === 'secure' ? { color: currentTheme.primary } : {}}>Secure</span>
                            </div>
                            <div className="h-6 w-[1px] bg-white/5 my-auto" />
                            <div
                                onClick={() => setFilterMode(filterMode === 'active' ? 'all' : 'active')}
                                className={`flex flex-col items-center gap-1 group cursor-pointer transition-all ${filterMode === 'active' ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <AlertTriangle className={`w-4 h-4 transition-transform ${filterMode === 'active' ? 'text-orange-500 drop-shadow-[0_0_8px_rgba(249,115,22,0.5)]' : 'text-zinc-500'}`} />
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${filterMode === 'active' ? 'text-orange-500' : 'text-white/40'}`}>Active</span>
                            </div>
                            <div className="h-6 w-[1px] bg-white/5 my-auto" />
                            <div
                                onClick={() => setFilterMode(filterMode === 'signal' ? 'all' : 'signal')}
                                className={`flex flex-col items-center gap-1 group cursor-pointer transition-all ${filterMode === 'signal' ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                            >
                                <Radio className={`w-4 h-4 transition-transform ${filterMode === 'signal' ? 'text-blue-400 drop-shadow-[0_0_8px_rgba(96,165,250,0.5)]' : 'text-zinc-500'}`} />
                                <span className={`text-[9px] font-bold uppercase tracking-widest ${filterMode === 'signal' ? 'text-blue-400' : 'text-white/40'}`}>Signal</span>
                            </div>
                        </div>
                    </main>

                    {/* Intelligence Triage / Tips Sidebar */}
                    <div className="w-[400px] h-full flex flex-col border-l border-white/5 bg-black/20">
                        {/* Sidebar Mode Toggle */}
                        <div className="p-2 flex gap-1 bg-black/40 border-b border-white/5 shrink-0">
                            <button
                                onClick={() => setSidebarMode('triage')}
                                className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${sidebarMode === 'triage' ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                            >
                                Intelligence
                            </button>
                            <button
                                onClick={() => setSidebarMode('tips')}
                                className={`flex-1 py-1.5 text-[10px] font-black uppercase rounded-lg transition-all ${sidebarMode === 'tips' ? 'bg-purple-600 text-white shadow-[0_0_15px_rgba(168,85,247,0.3)]' : 'text-white/40 hover:text-white'}`}
                            >
                                Tips
                            </button>
                        </div>

                        <div className="flex-1 min-h-0 overflow-hidden">
                            {sidebarMode === 'triage' ? (
                                <TriageSidebar
                                    alerts={filteredAlerts}
                                    onSelect={handleAlertSelect}
                                    selectedId={selectedAlert?.id}
                                    themeColor={currentTheme.primary}
                                />
                            ) : (
                                <AnonymousTipFeed />
                            )}
                        </div>
                    </div>

                </div>
            </div>

            {/* Selection Detail Overlay Modal */}
            {selectedAlert && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 pointer-events-none">
                    <motion.div
                        drag
                        dragMomentum={false}
                        className="bg-black/80 backdrop-blur-xl border border-white/10 p-8 rounded-2xl w-full max-w-xl pointer-events-auto shadow-[0_0_50px_rgba(0,0,0,0.5)] cursor-grab active:cursor-grabbing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        style={{ borderColor: currentTheme.primary + '4d', boxShadow: `0 0 50px ${currentTheme.secondary}` }}
                    >
                        <div className="flex justify-between items-start mb-8">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentTheme.primary }} />
                                    <span className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: currentTheme.primary }}>Tactical Analysis Locked</span>
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                    {selectedAlert?.type?.replace(/_/g, ' ') || 'UNKNOWN'} // {selectedAlert?.id?.substring(0, 8).toUpperCase() || 'N/A'}
                                </h2>

                                {/* Classification Badge - Only shown for redacted alerts */}
                                {isAlertRedacted(selectedAlert) && (() => {
                                    const classification = getClassificationLevel(selectedAlert);
                                    return (
                                        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-lg border-2"
                                            style={{
                                                backgroundColor: classification.bgColor,
                                                borderColor: classification.borderColor,
                                                boxShadow: `0 0 20px ${classification.borderColor}40`
                                            }}>
                                            <Shield className="w-4 h-4" style={{ color: classification.color }} />
                                            <span className="text-xs font-black tracking-wider" style={{ color: classification.color }}>
                                                {classification.level}
                                            </span>
                                            <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: classification.color }} />
                                        </div>
                                    );
                                })()}
                            </div>
                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="text-white/20 hover:text-white transition-colors p-2"
                                style={{ '&:hover': { color: currentTheme.primary } } as any}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        {!isAlertRedacted(selectedAlert) && (
                            <div className="grid grid-cols-2 gap-8 mb-8">
                                <div className="space-y-1">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Incident Vector</span>
                                    <p className="text-sm font-mono" style={{ color: currentTheme.primary }}>{selectedAlert?.location || 'Unknown'}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Signal Latency</span>
                                    <p className="text-sm text-white/80 font-mono">14.2ms</p>
                                </div>
                            </div>
                        )}

                        {!isAlertRedacted(selectedAlert) && (
                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-2">
                                    <Cpu className="w-4 h-4" style={{ color: currentTheme.primary }} />
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Raw Telemetry Stream</span>
                                </div>
                                <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 font-mono text-[10px] h-32 overflow-auto scrollbar-cyber" style={{ color: currentTheme.primary + 'b3', borderColor: currentTheme.primary + '1a' }}>
                                    <pre>{JSON.stringify({
                                        event_id: selectedAlert?.id || 'N/A',
                                        payload_digest: "sha256:e3b0c442...",
                                        node_hops: ["GW-LAGOS-01", "CORE-ABUJA-PRIM"],
                                        signature: "secp256k1:..."
                                    }, null, 2)}</pre>
                                </div>
                            </div>
                        )}

                        {/* Response Team Triangulation (NEW) */}
                        <div className="space-y-4 mb-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Shield className="w-4 h-4" style={{ color: currentTheme.primary }} />
                                    <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Tactical Proximity Radar</span>
                                </div>
                                <span className="text-[9px] font-mono animate-pulse" style={{ color: currentTheme.primary + '80' }}>AUTO-TRIANGULATING...</span>
                            </div>

                            <div className="space-y-3">
                                {(triangulatedAssets || []).length > 0 ? (
                                    (triangulatedAssets || []).map((ta, i) => (
                                        <div key={ta.asset.id} className="relative group">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[10px] text-white/60 font-mono">0{i + 1}</span>
                                                    <span className="text-[11px] text-white font-bold uppercase tracking-tight">{ta.asset.name}</span>
                                                    <span className="px-1.5 py-0.5 rounded-sm bg-white/5 border border-white/10 text-[8px] text-white/40 font-bold uppercase">{ta.asset.type}</span>
                                                </div>
                                                <span className="text-[10px] font-mono" style={{ color: currentTheme.primary }}>{(ta.distance_meters / 1000).toFixed(1)}km</span>
                                            </div>
                                            <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full transition-all duration-1000"
                                                    style={{ width: `${ta.suitability_score}%`, background: `linear-gradient(to right, ${currentTheme.primary}66, ${currentTheme.primary})` }}
                                                />
                                            </div>
                                            <div className="flex justify-between mt-1 items-center">
                                                <span className="text-[8px] text-white/20 uppercase font-black">Suitability Rating</span>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-[8px] font-mono" style={{ color: currentTheme.primary + '99' }}>{ta.suitability_score.toFixed(1)}%</span>
                                                    {ta.asset.status !== 'DISPATCHED' ? (
                                                        <button
                                                            onClick={async (e) => {
                                                                e.stopPropagation();
                                                                const success = await dispatchAsset(ta.asset.id);
                                                                if (success) {
                                                                    // Optimistic Update
                                                                    setTriangulatedAssets(prev => prev.map(p =>
                                                                        p.asset.id === ta.asset.id ? { ...p, asset: { ...p.asset, status: 'DISPATCHED' } } : p
                                                                    ));
                                                                    alert(`UNIT [${ta.asset.name}] ACTIVATED AND DISPATCHED.`);
                                                                }
                                                            }}
                                                            className="text-[8px] border px-2 py-0.5 rounded transition-colors font-bold uppercase tracking-wider"
                                                            style={{ backgroundColor: currentTheme.primary + '1a', color: currentTheme.primary, borderColor: currentTheme.primary + '4d' }}
                                                        >
                                                            ACTIVATE
                                                        </button>
                                                    ) : (
                                                        <span className="text-[8px] text-orange-500 font-black uppercase tracking-wider px-2 border border-orange-500/20 bg-orange-500/10 rounded">DISPATCHED</span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="py-8 text-center border border-white/5 rounded-xl bg-white/[0.02]">
                                        <p className="text-[10px] text-white/20 uppercase font-bold tracking-[0.2em]">Searching local sector for assets...</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <button className="flex-1 h-12 rounded-xl border bg-white/5 text-[11px] font-black tracking-widest uppercase hover:bg-white/10 transition-all"
                                style={{ borderColor: currentTheme.primary + '33', color: currentTheme.primary }}>
                                Dispatch Response
                            </button>
                            <button
                                onClick={async () => {
                                    if (selectedAlert) {
                                        const success = await verifyAlert(selectedAlert?.id || '');
                                        if (success) {
                                            // Optimistic Update
                                            const updatedAlert = { ...selectedAlert, isTrusted: true, verification_count: (selectedAlert?.verification_count || 0) + 1 };
                                            setSelectedAlert(updatedAlert);
                                            setLiveAlerts(prev => prev.map(a => a.id === selectedAlert?.id ? updatedAlert : a));
                                            alert('ALERT INTEGRITY VERIFIED ON DATABASE.');
                                        } else {
                                            alert('Verification Failed. Check console.');
                                        }
                                    }
                                }}
                                className="flex-1 h-12 rounded-xl text-black text-[11px] font-black tracking-widest uppercase hover:scale-[1.02] transition-all"
                                style={{ backgroundColor: currentTheme.primary, boxShadow: `0 0 20px ${currentTheme.secondary}` }}>
                                Verify Integrity
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Notifications Panel */}
            {
                showNotifications && (
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="fixed top-20 left-20 z-[9000] w-96 max-h-[calc(100vh-8rem)] overflow-y-auto glass-card border border-white/10 p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-white font-bold uppercase tracking-wider flex items-center gap-2">
                                    <Bell className="w-4 h-4 text-[#00FF95]" />
                                    System Notifications
                                </h3>
                                <button onClick={() => setShowNotifications(false)} className="text-white/40 hover:text-white">
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                            <div className="space-y-4">
                                {notifications.map((note, idx) => (
                                    <div key={idx} className="bg-white/5 border border-white/5 p-3 rounded-lg flex gap-3">
                                        <div className={`mt-1 w-2 h-2 rounded-full shrink-0 ${note.type === 'alert' ? 'bg-red-500 animate-pulse' : 'bg-[#00FF95]'}`} />
                                        <div>
                                            <p className="text-xs text-white/80 font-mono">{note.message}</p>
                                            <p className="text-[10px] text-white/30 mt-1">{note.timestamp.toLocaleTimeString()}</p>
                                        </div>
                                    </div>
                                ))}
                                {notifications.length === 0 && (
                                    <p className="text-white/20 text-xs italic text-center py-4">No new notifications.</p>
                                )}
                            </div>
                        </motion.div>
                    </Portal>
                )
            }

        </div>
    );
}
