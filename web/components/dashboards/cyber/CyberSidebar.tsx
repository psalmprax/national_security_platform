import React from 'react';
import {
    Shield,
    Map as MapIcon,
    AlertTriangle,
    Database,
    Cpu,
    Activity,
    Bell,
    Link2
} from 'lucide-react';
import { User as UserType } from '../../../lib/AuthContext';

interface CyberSidebarProps {
    activeView: string;
    setActiveView: (view: any) => void;
    showNotifications: boolean;
    setShowNotifications: (show: boolean) => void;
    user: UserType | null;
    currentTheme: {
        primary: string;
        secondary: string;
        glow: string;
        text: string;
    };
}

export default function CyberSidebar({
    activeView,
    setActiveView,
    showNotifications,
    setShowNotifications,
    user,
    currentTheme
}: CyberSidebarProps) {
    return (
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
                {(user?.role === 'ADMIN' || user?.role === 'CYBER_ANALYST') && (
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
                )}
                {(user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN') && (
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
                )}
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
                {(user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN' || user?.role === 'SECURITY_OFFICER') && (
                    <div className="relative group">
                        <Link2
                            onClick={() => setActiveView('evidence')}
                            className={`w-5 h-5 transition-colors cursor-pointer ${activeView === 'evidence' ? 'text-amber-400' : 'text-zinc-600 hover:text-white'
                                }`}
                        />
                        <div className="absolute left-full ml-3 px-3 py-2 bg-black/90 border border-amber-500/20 rounded-lg text-xs text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                            Evidence Ledger
                        </div>
                    </div>
                )}
                {(user?.role === 'ADMIN' || user?.role === 'SYSTEM_ADMIN') && (
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
                )}
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
            </div>
        </aside>
    );
}
