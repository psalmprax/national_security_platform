import React, { useState, useEffect } from 'react';
import {
    Shield,
    AlertTriangle,
    Database,
    Cpu,
    Map as MapIcon,
    Bell,
    Settings,
    User,
    Radio,
    Zap,
    Locate,
    Activity,
    Lock,
    Eye,
    TrendingUp,
    X
} from 'lucide-react';
import MapboxMap from '../MapboxMap';
import TriageSidebar from '../TriageSidebar';
import { Alert, SecurityScan, fetchSecurityScans, TriangulatedAsset, fetchTriangulatedAssets, dispatchAsset, API_BASE_URL, SystemStatus } from '../../lib/api';
import { useAuth, User as UserType } from '../../lib/AuthContext';
import { motion } from 'framer-motion';



interface CyberDashboardProps {
    alerts: Alert[];
    currentTime: Date | null;
    securityStatus: SystemStatus;
    user: UserType | null;
    logout: () => void;
}

export default function CyberDashboard({ alerts, currentTime, securityStatus, user, logout }: CyberDashboardProps) {
    const { token } = useAuth();
    const [activeView, setActiveView] = useState<'map' | 'alerts' | 'data' | 'analytics' | 'profile' | 'registry' | 'compliance'>('map');
    const [filterMode, setFilterMode] = useState<'all' | 'secure' | 'active' | 'signal'>('all');
    const [operationMode, setOperationMode] = useState<'NOMINAL' | 'SURGICAL' | 'TACTICAL' | 'DARK_OPS'>('NOMINAL');
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [displayMode, setDisplayMode] = useState<'dark' | 'light' | 'contrast' | 'oled' | 'terminal'>('dark');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null);
    const [showSatellite, setShowSatellite] = useState(false);
    const [securityScans, setSecurityScans] = useState<SecurityScan[]>([]);
    const [triangulatedAssets, setTriangulatedAssets] = useState<TriangulatedAsset[]>([]);
    const [liveAlerts, setLiveAlerts] = useState<Alert[]>(alerts);
    const [showGrid, setShowGrid] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

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
                // Parse raw NATS message -> Alert
                // Assuming NATS sends raw JSON of Alert model
                const newData = JSON.parse(event.data);

                // Determine type of event? For now assuming it's an Alert
                // Ideally backend wraps it: { type: "alert", payload: ... }
                // But current backend sends raw `msg` from `alerts.new` which is `alert` JSON.
                const newAlert = newData as Alert;

                setLiveAlerts((prev: Alert[]) => {
                    // Avoid duplicates
                    if (prev.find((a: Alert) => a.id === newAlert.id)) return prev;

                    // Add Notification
                    setNotifications((prevNotifs: Notification[]) => [
                        { message: `New Alert Detected: ${newAlert.alert_type} - ${newAlert.location || 'Unknown Location'}`, timestamp: new Date(), type: 'alert' },
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
        if (user?.role === 'ADMIN' && token) {
            const loadScans = async () => {
                const scans = await fetchSecurityScans(token, currentPage, itemsPerPage);
                setSecurityScans(scans);
            };
            loadScans();
            const interval = setInterval(loadScans, 30000); // Poll every 30s
            return () => clearInterval(interval);
        }
    }, [user, token, currentPage]);

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
        if (token) {
            fetchTriangulatedAssets(alert.id, token).then(setTriangulatedAssets).catch(console.error);
        }
    };

    // Auto-trigger triangulation when in Tactical mode and an alert is selected
    useEffect(() => {
        if (operationMode === 'TACTICAL' && selectedAlert) {
            handleAlertSelect(selectedAlert);
        }
    }, [operationMode, selectedAlert, token]); // Added token to dependencies

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
                    <div className="absolute inset-0 bg-gradient-to-br from-black via-zinc-900 to-black" />
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
                    0% { transform: translateY(0); }
                    100% { transform: translateY(50px); }
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

            <div className="relative z-10 w-full h-full">
                <div className="flex h-screen bg-[#050505] text-white font-sans overflow-hidden selection:bg-[#00FF95]/30">
                    {/* Left Utility Bar */}
                    <aside className="w-16 border-r border-white/5 flex flex-col items-center py-8 gap-10 bg-black/40 backdrop-blur-md z-40">
                        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/10 relative group transition-all" style={{
                            borderColor: currentTheme.primary + '33',
                            backgroundColor: currentTheme.primary + '1a'
                        }}>
                            <Shield className="w-6 h-6" style={{ color: currentTheme.primary }} />
                            <div className="absolute left-full ml-3 px-3 py-2 bg-black/90 border border-white/10 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                Security Platform
                            </div>
                        </div>
                        <nav className="flex flex-col gap-8">
                            <div
                                onClick={() => setActiveView('map')}
                                className={`p-2 rounded-lg cursor-pointer transition-all relative group ${activeView === 'map'
                                    ? 'bg-white/10 border border-white/20'
                                    : 'bg-white/[0.03] text-zinc-600 hover:text-white'
                                    }`}
                                style={activeView === 'map' ? { color: currentTheme.primary, borderColor: currentTheme.primary + '4d', backgroundColor: currentTheme.primary + '1a' } : {}}
                            >
                                <MapIcon className="w-5 h-5" />
                                <div className="absolute left-full ml-3 px-3 py-2 bg-black/90 border border-[#00FF95]/20 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    Map View
                                </div>
                            </div>
                            <div className="relative group">
                                <AlertTriangle
                                    onClick={() => setActiveView('alerts')}
                                    className={`w-5 h-5 transition-colors cursor-pointer ${activeView === 'alerts' ? 'text-[#00FF95]' : 'text-zinc-600 hover:text-white'
                                        }`}
                                />
                                <div className="absolute left-full ml-3 px-3 py-2 bg-black/90 border border-[#00FF95]/20 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    Alert Triage
                                </div>
                            </div>
                            <div className="relative group">
                                <Database
                                    onClick={() => setActiveView('data')}
                                    className={`w-5 h-5 transition-colors cursor-pointer ${activeView === 'data' ? 'text-[#00FF95]' : 'text-zinc-600 hover:text-white'
                                        }`}
                                />
                                <div className="absolute left-full ml-3 px-3 py-2 bg-black/90 border border-[#00FF95]/20 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    Audit Logs
                                </div>
                            </div>
                            <div className="relative group">
                                <Cpu
                                    onClick={() => setActiveView('analytics')}
                                    className={`w-5 h-5 transition-colors cursor-pointer ${activeView === 'analytics' ? 'text-[#00FF95]' : 'text-zinc-600 hover:text-white'
                                        }`}
                                />
                                <div className="absolute left-full ml-3 px-3 py-2 bg-black/90 border border-[#00FF95]/20 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    Analytics
                                </div>
                            </div>
                            <div className="relative group">
                                <Activity
                                    onClick={() => setActiveView('compliance')}
                                    className={`w-5 h-5 transition-colors cursor-pointer ${activeView === 'compliance' ? 'text-[#00FF95]' : 'text-zinc-600 hover:text-white'
                                        }`}
                                />
                                <div className="absolute left-full ml-3 px-3 py-2 bg-black/90 border border-[#00FF95]/20 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    Security Compliance
                                </div>
                            </div>
                        </nav>
                        <div className="mt-auto flex flex-col gap-8 items-center pb-4">
                            <div className="relative group">
                                <Bell
                                    onClick={() => setShowNotifications(!showNotifications)}
                                    className={`w-5 h-5 transition-colors cursor-pointer ${showNotifications ? 'text-[#00FF95]' : 'text-zinc-600 hover:text-white'
                                        }`}
                                />
                                <div className="absolute left-full ml-3 px-3 py-2 bg-black/90 border border-[#00FF95]/20 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    Notifications
                                </div>
                            </div>
                            <div className="relative group">
                                <Settings
                                    onClick={() => setShowSettings(!showSettings)}
                                    className={`w-5 h-5 transition-colors cursor-pointer ${showSettings ? 'text-[#00FF95]' : 'text-zinc-600 hover:text-white'
                                        }`}
                                />
                                <div className="absolute left-full ml-3 px-3 py-2 bg-black/90 border border-[#00FF95]/20 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    Settings
                                </div>
                            </div>
                            <div className="relative group">
                                <div
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="w-8 h-8 rounded-full border border-white/10 flex items-center justify-center p-0.5 cursor-pointer hover:border-[#00FF95]/50 transition-colors"
                                >
                                    <User className={`w-4 h-4 transition-colors ${showUserMenu ? 'text-[#00FF95]' : 'text-zinc-500'
                                        }`} />
                                </div>
                                <div className="absolute left-full ml-3 px-3 py-2 bg-black/90 border border-[#00FF95]/20 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                                    User Menu
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Main Interactive Map Area */}
                    <main className="flex-1 relative overflow-hidden bg-black">
                        {/* HUD Overlays */}
                        <div className="absolute top-8 left-1/2 -translate-x-1/2 z-30 flex flex-col gap-3 pointer-events-none items-center">
                            <div className="flex items-center gap-3">
                                <Radio className="w-4 h-4 animate-pulse" style={{ color: currentTheme.primary }} />
                                <h1 className="text-sm font-black tracking-[0.4em] text-white uppercase">SITUATIONAL AWARENESS CENTER</h1>
                            </div>

                            {/* Mode Selector HUB (NEW) - System Admin Only */}
                            {user?.role === 'ADMIN' && (
                                <div className="flex items-center gap-1 p-1 bg-black/40 backdrop-blur-xl border border-white/5 rounded-full pointer-events-auto">
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
                                </div>
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

                        <div className="absolute top-8 right-8 z-30 pointer-events-none">
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

                        {/* Scanning Animation */}
                        <div className="scanning-line" />

                        {/* Conditional View Rendering */}
                        {activeView === 'map' && (
                            <div className="w-full h-full opacity-80 relative">
                                <MapboxMap
                                    alerts={filteredAlerts}
                                    selectedAlert={selectedAlert}
                                    triangulatedAssets={triangulatedAssets}
                                    onSelect={handleAlertSelect}
                                    showSatellite={showSatellite}
                                    token={token}
                                    primaryColor={currentTheme.primary}
                                />

                                {/* LAYER CONTROLS */}
                                <div className="absolute top-24 right-8 z-20 flex flex-col gap-2">
                                    <button
                                        onClick={() => setShowSatellite(!showSatellite)}
                                        className={`px-4 py-2 border backdrop-blur-md transition-all flex items-center gap-2 group ${showSatellite ? 'bg-white/10' : 'border-white/10 bg-black/40 text-white/40 hover:border-white/30'
                                            }`}
                                        style={showSatellite ? { borderColor: currentTheme.primary, color: currentTheme.primary } : {}}
                                    >
                                        <div className={`w-2 h-2 rounded-full ${showSatellite ? 'animate-pulse' : 'bg-white/20'}`} style={showSatellite ? { backgroundColor: currentTheme.primary } : {}} />
                                        <span className="text-[10px] font-black tracking-widest uppercase">
                                            {showSatellite ? 'Visual Stream: Satellite' : 'Visual Stream: Vector'}
                                        </span>
                                    </button>
                                </div>
                            </div>
                        )}

                        {activeView === 'alerts' && (
                            <div className="w-full h-full overflow-y-auto scrollbar-cyber">
                                <div className="w-full max-w-6xl mx-auto p-8">
                                    <h2 className="text-2xl font-black tracking-wider text-white mb-6 uppercase">Alert Triage {filterMode !== 'all' && <span className="text-[#00FF95] text-sm ml-2">[{filterMode.toUpperCase()}_FILTER]</span>}</h2>
                                    <div className="grid gap-4">
                                        {filteredAlerts.length === 0 ? (
                                            <div className="glass-card p-8 text-center border border-white/5">
                                                <p className="text-white/40 text-sm">No alerts match the current filter</p>
                                            </div>
                                        ) : (
                                            filteredAlerts.map((alert) => (
                                                <div
                                                    key={alert.id}
                                                    onClick={() => {
                                                        handleAlertSelect(alert);
                                                        setActiveView('map');
                                                    }}
                                                    className="glass-card p-6 border border-white/5 hover:border-[#00FF95]/20 hover:bg-white/5 transition-all cursor-pointer group"
                                                >
                                                    <div className="flex items-start justify-between mb-4">
                                                        <div className="flex items-center gap-3">
                                                            <div className={`w-3 h-3 rounded-full ${alert.severity > 0.8 ? 'bg-red-500 animate-pulse' : alert.severity > 0.6 ? 'bg-orange-500' : 'bg-yellow-500'}`} />
                                                            <h3 className="text-white font-bold text-lg uppercase tracking-wide group-hover:text-[#00FF95] transition-colors">{alert.type}</h3>
                                                        </div>
                                                        <span className="text-xs text-white/40 font-mono">{new Date(alert.timestamp).toLocaleString()}</span>
                                                    </div>
                                                    <p className="text-white/70 mb-3 line-clamp-2">{alert.content}</p>
                                                    <div className="flex items-center gap-4 text-xs text-white/40 font-mono">
                                                        <span className="group-hover:text-white transition-colors">
                                                            📍 {(alert.lga_name && alert.lga_name !== 'Unknown') ? `${alert.lga_name}, ${alert.state_name}` : alert.location}
                                                        </span>
                                                        {alert.isTrusted && <span className="text-[#00FF95]">✓ VERIFIED</span>}
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeView === 'data' && (
                            <div className="w-full h-full overflow-y-auto scrollbar-cyber">
                                <div className="w-full max-w-6xl mx-auto p-8">
                                    <h2 className="text-2xl font-black tracking-wider text-white mb-6 uppercase">Audit Logs & Data</h2>
                                    <div className="glass-card p-8 border border-white/5">
                                        <div className="flex items-center gap-3 mb-6">
                                            <Database className="w-6 h-6 text-[#00FF95]" />
                                            <h3 className="text-white font-bold text-lg">System Database Access</h3>
                                        </div>
                                        <div className="space-y-4">
                                            <div className="bg-white/5 p-4 rounded border border-white/10 font-mono text-sm">
                                                <p className="text-white/60">Total Alerts Logged: <span className="text-[#00FF95] font-bold">{alerts.length}</span></p>
                                                <p className="text-white/60">Trusted Devices: <span className="text-[#00FF95] font-bold">{securityStatus.trustedDevices}</span></p>
                                                <p className="text-white/60">Security Status: <span className="text-[#00FF95] font-bold">ENCRYPTED</span></p>
                                            </div>
                                            <div className="overflow-x-auto scrollbar-cyber rounded border border-white/10">
                                                <table className="w-full text-left text-sm text-white/70">
                                                    <thead className="bg-white/5 uppercase text-xs font-bold text-white/50">
                                                        <tr>
                                                            <th className="px-4 py-3">Timestamp</th>
                                                            <th className="px-4 py-3">Event ID</th>
                                                            <th className="px-4 py-3">Type</th>
                                                            <th className="px-4 py-3">Location</th>
                                                            <th className="px-4 py-3">Integrity</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-white/5 font-mono">
                                                        {alerts.map((alert) => (
                                                            <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                                                                <td className="px-4 py-2">{new Date(alert.timestamp).toISOString()}</td>
                                                                <td className="px-4 py-2 text-[#00FF95]">{alert.id.substring(0, 8)}...</td>
                                                                <td className="px-4 py-2">{alert.type}</td>
                                                                <td className="px-4 py-2">{alert.location}</td>
                                                                <td className="px-4 py-2">
                                                                    {alert.isTrusted ? (
                                                                        <span className="text-[#00FF95] text-xs px-2 py-0.5 rounded bg-[#00FF95]/10 border border-[#00FF95]/20">VERIFIED</span>
                                                                    ) : (
                                                                        <span className="text-orange-400 text-xs px-2 py-0.5 rounded bg-orange-400/10 border border-orange-400/20">UNVERIFIED</span>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {alerts.length === 0 && (
                                                    <div className="p-8 text-center text-white/30 italic">No audit records found.</div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeView === 'analytics' && (
                            <div className="w-full h-full overflow-y-auto scrollbar-cyber">
                                <div className="w-full max-w-6xl mx-auto p-8">
                                    <h2 className="text-2xl font-black tracking-wider text-white mb-6 uppercase">System Analytics</h2>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div className="glass-card p-6 border border-white/5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Cpu className="w-5 h-5 text-[#00FF95]" />
                                                <h3 className="text-white font-bold uppercase tracking-wide">Threat Analysis</h3>
                                            </div>
                                            <p className="text-white/60 text-sm mb-4">AI-powered threat classification and severity analysis</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/60">Critical Alerts</span>
                                                    <span className="text-red-500 font-bold">{alerts.filter(a => a.severity > 0.8).length}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/60">Urgent Alerts</span>
                                                    <span className="text-orange-500 font-bold">{alerts.filter(a => a.severity > 0.6 && a.severity <= 0.8).length}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/60">Medium Priority</span>
                                                    <span className="text-yellow-500 font-bold">{alerts.filter(a => a.severity <= 0.6).length}</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="glass-card p-6 border border-white/5">
                                            <div className="flex items-center gap-3 mb-4">
                                                <Radio className="w-5 h-5 text-[#00FF95]" />
                                                <h3 className="text-white font-bold uppercase tracking-wide">Real-Time Stats</h3>
                                            </div>
                                            <p className="text-white/60 text-sm mb-4">Live system performance metrics</p>
                                            <div className="space-y-2">
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/60">Active Connections</span>
                                                    <span className="text-[#00FF95] font-bold">{securityStatus.trustedDevices}</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/60">Avg Response Time</span>
                                                    <span className="text-[#00FF95] font-bold tabular-nums">14ms</span>
                                                </div>
                                                <div className="flex justify-between text-sm">
                                                    <span className="text-white/60">System Uptime</span>
                                                    <span className="text-[#00FF95] font-bold">99.99%</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeView === 'profile' && (
                            <div className="w-full h-full overflow-y-auto scrollbar-cyber">
                                <div className="w-full max-w-4xl mx-auto p-8">
                                    <h2 className="text-2xl font-black tracking-wider text-white mb-6 uppercase">Administrator Profile</h2>
                                    <div className="glass-card p-10 border border-white/5 bg-white/[0.02]">
                                        <div className="flex items-center gap-6 mb-10 pb-10 border-b border-white/10">
                                            <div className="w-24 h-24 rounded-2xl bg-[#00FF95]/10 border border-[#00FF95]/20 flex items-center justify-center">
                                                <User className="w-12 h-12 text-[#00FF95]" />
                                            </div>
                                            <div>
                                                <h3 className="text-3xl font-black text-white mb-1 uppercase tracking-tight">{user?.full_name || 'Anonymous Administrator'}</h3>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[#00FF95] text-xs font-bold tracking-widest uppercase bg-[#00FF95]/10 px-3 py-1 rounded-full border border-[#00FF95]/20">
                                                        Role: {user?.role || 'System Operator'}
                                                    </span>
                                                    <span className="text-white/40 text-[10px] font-mono">UUID: {user?.id || 'AUTH_ENTITY_000'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-6">
                                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em]">Access Permissions</h4>
                                                <div className="space-y-3">
                                                    {['SITUATIONAL_AWARENESS_FULL', 'GEOSPATIAL_INTEL_READ', 'THREAT_VECTOR_CONTROL', 'AUDIT_LEDGER_WRITE'].map((perm, idx) => (
                                                        <div key={idx} className="flex items-center gap-3 text-xs text-white/70">
                                                            <div className="w-1.5 h-1.5 rounded-full bg-[#00FF95]" />
                                                            <span className="font-mono">{perm}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                            <div className="bg-black/40 p-6 rounded-xl border border-white/5">
                                                <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.3em] mb-4">Session Entropy</h4>
                                                <div className="flex justify-between items-end gap-2 h-20 px-2">
                                                    {[40, 70, 45, 90, 65, 80, 50, 95].map((h, i) => (
                                                        <div key={i} className="flex-1 bg-[#00FF95]/20 rounded-t border-x border-t border-[#00FF95]/20" style={{ height: `${h}%` }} />
                                                    ))}
                                                </div>
                                                <p className="text-[10px] text-white/40 mt-4 text-center font-mono">SECURE_SESSION_STABILITY: OPTIMAL (98.2%)</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeView === 'compliance' && (
                            <div className="w-full h-full overflow-y-auto scrollbar-cyber">
                                <div className="w-full max-w-6xl mx-auto p-8">
                                    <div className="flex items-center justify-between mb-8">
                                        <div>
                                            <h2 className="text-3xl font-black tracking-wider text-white uppercase">Security Sentinel</h2>
                                            <p className="text-white/40 text-xs font-mono mt-1 uppercase tracking-widest">Continuous Compliance Monitoring</p>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="glass-card px-4 py-2 border border-[#00FF95]/20 bg-[#00FF95]/5">
                                                <span className="text-[10px] text-white/40 uppercase font-black block mb-0.5">Global Status</span>
                                                <span className="text-[#00FF95] text-sm font-black uppercase">Operationally Sound</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                        <div className="glass-card p-6 border border-white/5 bg-white/[0.01]">
                                            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Vulnerability Scan Pulse</h3>
                                            <div className="space-y-4">
                                                {securityScans.length === 0 ? (
                                                    <p className="text-white/30 italic text-sm py-4">Awaiting initial telemetry stream...</p>
                                                ) : (
                                                    securityScans.slice(0, 5).map((scan: SecurityScan) => (
                                                        <div key={scan.id} className="flex items-center justify-between p-3 rounded bg-black/40 border border-white/5">
                                                            <div>
                                                                <p className="text-xs text-white/80 font-bold uppercase">{scan.target_service}</p>
                                                                <p className="text-[10px] text-white/40 font-mono mt-0.5">{new Date(scan.scan_time).toLocaleString()}</p>
                                                            </div>
                                                            <span className={`text-[9px] font-black px-2 py-1 rounded`} style={{ backgroundColor: scan.status === 'PASSED' ? currentTheme.primary + '33' : 'rgba(239, 68, 68, 0.2)', color: scan.status === 'PASSED' ? currentTheme.primary : 'rgb(239, 68, 68)' }}>
                                                                {scan.status}
                                                            </span>
                                                        </div>
                                                    ))
                                                )}
                                            </div>
                                        </div>

                                        <div className="glass-card p-6 border border-white/5 bg-white/[0.01]">
                                            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Active Hardening (GuardDog)</h3>
                                            <div className="space-y-3">
                                                {[
                                                    { name: 'JWT Secret Hardening', status: 'Fail-Closed Active' },
                                                    { name: 'CORS Strict Mode', status: 'Authorized Origins Only' },
                                                    { name: 'RBAC Enforcement', status: 'Global Active' },
                                                    { name: 'HSTS/CSP Headers', status: 'Enforced' }
                                                ].map((item, i) => (
                                                    <div key={i} className="flex items-center justify-between text-xs py-1">
                                                        <span className="text-white/60">{item.name}</span>
                                                        <span className="font-mono font-bold tracking-tight" style={{ color: currentTheme.primary }}>{item.status}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="glass-card border border-white/5 overflow-hidden">
                                        <div className="bg-white/5 px-6 py-3 border-b border-white/5">
                                            <h3 className="text-white text-xs font-black uppercase tracking-widest">Sentinel Audit Ledger</h3>
                                        </div>
                                        <div className="overflow-x-auto scrollbar-cyber">
                                            <table className="w-full text-left font-mono text-xs">
                                                <thead>
                                                    <tr className="bg-white/[0.02] text-white/30 text-[10px] uppercase">
                                                        <th className="px-6 py-3">Scan ID</th>
                                                        <th className="px-6 py-3">Timestamp</th>
                                                        <th className="px-6 py-3">Findings</th>
                                                        <th className="px-6 py-3 text-right">Integrity Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-white/5 text-white/70">
                                                    {securityScans.map((scan) => (
                                                        <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors">
                                                            <td className="px-6 py-3" style={{ color: currentTheme.primary }}>{scan.id.substring(0, 8)}</td>
                                                            <td className="px-6 py-3">{new Date(scan.scan_time).toISOString()}</td>
                                                            <td className="px-6 py-3">
                                                                {scan.findings && scan.findings.length > 0 ? (
                                                                    <span className="text-red-400">{scan.findings.length} issue(s) detected</span>
                                                                ) : (
                                                                    <span style={{ color: currentTheme.primary + '99' }}>Nominal - No issues detected</span>
                                                                )}
                                                            </td>
                                                            <td className="px-6 py-3 text-right font-black">
                                                                <span className={scan.status === 'PASSED' ? '' : 'text-red-500'} style={scan.status === 'PASSED' ? { color: currentTheme.primary } : {}}>{scan.status}</span>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {securityScans.length === 0 && (
                                                        <tr>
                                                            <td colSpan={4} className="px-6 py-8 text-center text-white/20 italic">No audit records available in the secure buffer.</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                        <div className="bg-white/5 px-6 py-4 border-t border-white/5 flex items-center justify-between">
                                            <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
                                                Page {currentPage} • Ledger Buffer
                                            </div>
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                                    disabled={currentPage === 1}
                                                    className="px-4 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                                >
                                                    Previous
                                                </button>
                                                <button
                                                    onClick={() => setCurrentPage(currentPage + 1)}
                                                    disabled={securityScans.length < itemsPerPage}
                                                    className="px-4 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                                                    style={{ '&:hover': { backgroundColor: currentTheme.primary + '1a', borderColor: currentTheme.primary + '4d', color: currentTheme.primary } } as any}
                                                >
                                                    Next
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

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

                    {/* Intelligence Triage Sidebar - Kept in Cyber View */}
                    <TriageSidebar
                        alerts={filteredAlerts}
                        onSelect={handleAlertSelect}
                        selectedId={selectedAlert?.id}
                        themeColor={currentTheme.primary}
                    />
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
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: currentTheme.primary }} />
                                    <span className="text-[10px] font-black tracking-[0.3em] uppercase" style={{ color: currentTheme.primary }}>Tactical Analysis Locked</span>
                                </div>
                                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                                    {selectedAlert.type} // {selectedAlert.id.substring(0, 8).toUpperCase()}
                                </h2>
                            </div>
                            <button
                                onClick={() => setSelectedAlert(null)}
                                className="text-white/20 hover:text-white transition-colors p-2"
                                style={{ '&:hover': { color: currentTheme.primary } } as any}
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-8 mb-8">
                            <div className="space-y-1">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Incident Vector</span>
                                <p className="text-sm font-mono" style={{ color: currentTheme.primary }}>{selectedAlert.location}</p>
                            </div>
                            <div className="space-y-1 text-right">
                                <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Signal Latency</span>
                                <p className="text-sm text-white/80 font-mono">14.2ms</p>
                            </div>
                        </div>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-2">
                                <Cpu className="w-4 h-4" style={{ color: currentTheme.primary }} />
                                <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Raw Telemetry Stream</span>
                            </div>
                            <div className="bg-white/[0.03] border border-white/10 rounded-xl p-4 font-mono text-[10px] h-32 overflow-auto scrollbar-hide" style={{ color: currentTheme.primary + 'b3', borderColor: currentTheme.primary + '1a' }}>
                                <pre>{JSON.stringify({
                                    event_id: selectedAlert.id,
                                    payload_digest: "sha256:e3b0c442...",
                                    node_hops: ["GW-LAGOS-01", "CORE-ABUJA-PRIM"],
                                    signature: "secp256k1:..."
                                }, null, 2)}</pre>
                            </div>
                        </div>

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
                                {triangulatedAssets.length > 0 ? (
                                    triangulatedAssets.map((ta, i) => (
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
                                                                if (!token) return;
                                                                const success = await dispatchAsset(ta.asset.id, token);
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
                            <button className="flex-1 h-12 rounded-xl text-black text-[11px] font-black tracking-widest uppercase hover:scale-[1.02] transition-all"
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
                    <div className="fixed inset-0 z-50 flex items-end justify-start pointer-events-none">
                        <motion.div
                            drag
                            dragMomentum={false}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pointer-events-auto mb-48 ml-24 w-96 glass-card border border-white/10 p-6 cursor-move"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Bell className="w-5 h-5" style={{ color: currentTheme.primary }} />
                                    <h3 className="text-white font-bold uppercase tracking-wide">Notifications</h3>
                                </div>
                                <button onClick={() => setShowNotifications(false)} className="text-white/40 hover:text-white transition-colors">
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-3 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                                {notifications.length === 0 ? (
                                    <div className="bg-white/5 p-4 rounded border border-white/10">
                                        <p className="text-sm text-white/80">System operational - All services running</p>
                                        <span className="text-xs text-white/40">Now</span>
                                    </div>
                                ) : (
                                    notifications.map((notif, idx) => (
                                        <div key={idx} className="bg-white/5 p-3 rounded border border-white/10 animate-fade-in-up">
                                            <p className="text-sm text-white/90">{notif.message}</p>
                                            <span className="text-xs text-white/40">{notif.timestamp.toLocaleTimeString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* Settings Panel */}
            {
                showSettings && (
                    <div className="fixed inset-0 z-50 flex items-end justify-start pointer-events-none">
                        <motion.div
                            drag
                            dragMomentum={false}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="pointer-events-auto mb-24 ml-24 w-96 glass-card border border-white/10 p-6 cursor-move"
                        >
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <Settings className="w-5 h-5" style={{ color: currentTheme.primary }} />
                                    <h3 className="text-white font-bold uppercase tracking-wide">Settings</h3>
                                </div>
                                <button onClick={() => setShowSettings(false)} className="text-white/40 hover:text-white transition-colors">
                                    ✕
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-sm text-white/60 block mb-2">Display Mode</label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {[
                                            { id: 'dark', label: 'Dark', color: '#000000', border: '#333333' },
                                            { id: 'light', label: 'Light', color: '#ffffff', border: '#e5e7eb' },
                                            { id: 'contrast', label: 'Contrast', color: '#000000', border: '#FFFF00' },
                                            { id: 'oled', label: 'OLED', color: '#000000', border: '#1a1a1a' },
                                            { id: 'terminal', label: 'Terminal', color: '#0a0a0a', border: '#00ff00' }
                                        ].map(theme => (
                                            <button
                                                key={theme.id}
                                                onClick={() => setDisplayMode(theme.id as any)}
                                                className={`
                                                    relative p-3 rounded-lg border transition-all text-xs font-bold uppercase tracking-wider
                                                    ${displayMode === theme.id ? 'ring-2 ring-offset-2 ring-offset-black' : 'hover:scale-[1.02]'}
                                                `}
                                                style={{
                                                    backgroundColor: theme.color,
                                                    borderColor: theme.border,
                                                    color: theme.id === 'light' ? '#000' : theme.border
                                                }}
                                            >
                                                {theme.label}
                                                {displayMode === theme.id && (
                                                    <div className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-current" />
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )
            }

            {/* User Menu */}
            {
                showUserMenu && (
                    <div className="fixed bottom-24 left-20 z-50">
                        <div className="w-64 glass-card border border-white/10 p-4 shadow-2xl">
                            <div className="flex items-center gap-3 mb-4 pb-4 border-b border-white/10">
                                <div className="p-2 rounded-lg" style={{ backgroundColor: currentTheme.primary + '1a', color: currentTheme.primary }}>
                                    <User className="w-5 h-5" />
                                </div>
                                <div>
                                    <p className="text-white font-bold text-sm tracking-tight">{user?.full_name || 'Anonymous'}</p>
                                    <p className="text-white/40 text-[10px] uppercase font-bold">{user?.role || 'Guest'}</p>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <button
                                    onClick={() => {
                                        setActiveView('profile');
                                        setShowUserMenu(false);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 rounded transition-all cursor-pointer ${activeView === 'profile' ? 'bg-white/5' : 'text-white/60 hover:bg-white/5'}`}
                                    style={activeView === 'profile' ? { color: currentTheme.primary } : {}}
                                >
                                    Profile
                                </button>
                                <button
                                    onClick={() => {
                                        setActiveView('registry');
                                        setShowUserMenu(false);
                                    }}
                                    className={`w-full text-left text-xs px-3 py-2 rounded transition-all cursor-pointer ${activeView === 'registry' ? 'bg-white/5' : 'text-white/60 hover:bg-white/5'}`}
                                    style={activeView === 'registry' ? { color: currentTheme.primary } : {}}
                                >
                                    Identity Registry
                                </button>
                                <button
                                    onClick={logout}
                                    className="w-full text-left text-xs text-red-500 hover:bg-red-500/10 px-3 py-2 rounded transition-all cursor-pointer"
                                >
                                    Sign Out / Disconnect
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }
        </div >
    );
}
