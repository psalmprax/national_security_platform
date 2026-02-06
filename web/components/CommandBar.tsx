"use client";

import React from "react";
import {
    Shield,
    Settings,
    Maximize,
    Minimize,
    User,
    ChevronDown,
    List,
    Map as MapIcon,
} from "lucide-react";

interface CommandBarProps {
    agencyName: string;
    userRole: string;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    isFullscreen: boolean;
    toggleFullscreen: () => void;
    showUserMenu: boolean;
    setShowUserMenu: (show: boolean) => void;
}

const CommandBar: React.FC<CommandBarProps> = ({
    agencyName,
    userRole,
    showSettings,
    setShowSettings,
    isFullscreen,
    toggleFullscreen,
    showUserMenu,
    setShowUserMenu,
}) => {
    const navigateTo = (view: string) => {
        window.location.href = `/?view=${view}`;
    };

    const isPrivileged = ["ADMIN", "SYSTEM_ADMIN", "SECURITY_OFFICER"].includes(userRole);

    return (
        <div className="w-full h-14 px-4 flex items-center justify-between bg-black/40 backdrop-blur-sm border-b border-white/10">
            {/* Left: Agency */}
            <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-blue-400" />
                <span className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
                    {agencyName}
                </span>
            </div>

            {/* Center: Tabs + View Toggle */}
            <div className="flex items-center gap-2">
                {isPrivileged && (
                    <>
                        <button
                            onClick={() => navigateTo("portal")}
                            className="px-3 py-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            PORTAL
                        </button>
                        <button
                            onClick={() => navigateTo("cyber")}
                            className="px-3 py-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            CYBER
                        </button>
                        <button
                            onClick={() => navigateTo("tactical")}
                            className="px-3 py-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            TACTICAL
                        </button>
                        <button
                            onClick={() => navigateTo("strategic")}
                            className="px-3 py-1.5 rounded-full hover:bg-white/5 text-white/40 hover:text-white text-[10px] font-black uppercase tracking-widest transition-all"
                        >
                            STRATEGIC
                        </button>
                        <div className="w-px h-4 bg-white/20 mx-2" />
                    </>
                )}

            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={() => setShowSettings(!showSettings)}
                    className={`h-10 w-10 rounded-lg flex items-center justify-center transition-all ${showSettings ? 'bg-blue-600/20 text-blue-400' : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                    title="Environment Config"
                >
                    <Settings className="h-4 w-4" />
                </button>
                <button
                    onClick={toggleFullscreen}
                    className="h-10 w-10 rounded-lg flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all"
                >
                    {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
                </button>
                <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className={`h-10 px-3 rounded-lg flex items-center gap-2 transition-all ${showUserMenu ? 'bg-white/10 text-white' : 'text-white/60 hover:text-white hover:bg-white/10'
                        }`}
                >
                    <User className="h-4 w-4" />
                    <ChevronDown className="h-3 w-3" />
                </button>
            </div>
        </div>
    );
};

export default CommandBar;
