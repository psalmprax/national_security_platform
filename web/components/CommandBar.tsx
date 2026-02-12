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
    Key,
    Menu,
    X,
    LogOut,
} from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import Portal from "@/components/Portal";

interface CommandBarProps {
    agencyName: string;
    userRole: string;
    user?: {
        full_name?: string;
        role?: string;
    } | null;
    showSettings: boolean;
    setShowSettings: (show: boolean) => void;
    isFullscreen: boolean;
    toggleFullscreen: () => void;
    showUserMenu: boolean;
    setShowUserMenu: (show: boolean) => void;
    activeView?: string;
    onNavigate?: (view: string) => void;
    onLogout?: () => void;
}

const CommandBar: React.FC<CommandBarProps> = ({
    agencyName,
    userRole,
    user,
    showSettings,
    setShowSettings,
    isFullscreen,
    toggleFullscreen,
    showUserMenu,
    setShowUserMenu,
    activeView,
    onNavigate,
    onLogout,
}) => {
    const navigateTo = (view: string) => {
        if (onNavigate) {
            onNavigate(view);
        } else {
            window.location.href = `/?view=${view}`;
        }
    };

    const [showMobileMenu, setShowMobileMenu] = React.useState(false);

    const isPrivileged = ["ADMIN", "SYSTEM_ADMIN", "SECURITY_OFFICER"].includes(userRole);

    return (
        <div className="w-full h-14 px-4 flex items-center justify-between bg-black/40 backdrop-blur-sm border-b border-white/10">
            {/* Left: Agency + Mobile Menu Toggle */}
            <div className="flex items-center gap-4">
                {isPrivileged && (
                    <button
                        onClick={() => setShowMobileMenu(true)}
                        className="md:hidden text-white/60 hover:text-white"
                    >
                        <Menu className="h-5 w-5" />
                    </button>
                )}
                <div className="flex items-center gap-2">
                    <Shield className="h-5 w-5 text-blue-400" />
                    <span className="text-xs font-semibold tracking-[0.2em] text-white/60 uppercase">
                        {agencyName}
                    </span>
                </div>
            </div>

            {/* Mobile Navigation Drawer */}
            <AnimatePresence>
                {showMobileMenu && (
                    <Portal>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-xl flex flex-col p-6"
                        >
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-2">
                                    <Shield className="h-6 w-6 text-blue-400" />
                                    <span className="text-sm font-black tracking-[0.2em] text-white uppercase">
                                        SYSTEM NAVIGATION
                                    </span>
                                </div>
                                <button
                                    onClick={() => setShowMobileMenu(false)}
                                    className="p-2 bg-white/10 rounded-full text-white"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <div className="flex flex-col gap-4">
                                {[
                                    { id: 'portal', label: 'Agency Portal', icon: Shield },
                                    { id: 'cyber', label: 'Cyber Interface', icon: Key },
                                    { id: 'tactical', label: 'Tactical Map', icon: MapIcon },
                                    { id: 'strategic', label: 'Strategic Ops', icon: List },
                                    { id: 'access', label: 'Access Control', icon: User },
                                ].map((item) => (
                                    <button
                                        key={item.id}
                                        onClick={() => {
                                            navigateTo(item.id);
                                            setShowMobileMenu(false);
                                        }}
                                        className={`p-4 rounded-xl flex items-center gap-4 transition-all border ${activeView === item.id
                                            ? 'bg-blue-600/20 border-blue-500/50 text-white shadow-lg'
                                            : 'bg-white/5 border-white/5 text-slate-400 hover:bg-white/10'
                                            }`}
                                    >
                                        <item.icon className={`h-5 w-5 ${activeView === item.id ? 'text-blue-400' : 'text-slate-500'}`} />
                                        <div className="flex flex-col items-start">
                                            <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                                            <span className="text-[9px] text-white/40 uppercase tracking-wider">
                                                {activeView === item.id ? 'Active Session' : 'Switch Module'}
                                            </span>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            <div className="mt-auto pt-8 border-t border-white/10">
                                <p className="text-[9px] text-center text-white/20 uppercase tracking-widest">
                                    Restricted Access // Security Clearance Verified
                                </p>
                            </div>
                        </motion.div>
                    </Portal>
                )}
            </AnimatePresence>

            {/* Center: Tabs + View Toggle */}
            <div className="flex items-center gap-2">
                {isPrivileged && (
                    <>
                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-2">
                            <button
                                onClick={() => navigateTo("portal")}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'portal' ? 'bg-white text-black shadow-[0_0_15px_rgba(255,255,255,0.4)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                PORTAL
                            </button>
                            <button
                                onClick={() => navigateTo("cyber")}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'cyber' ? 'bg-[#00FF95]/20 text-[#00FF95] border border-[#00FF95]/30 shadow-[0_0_15px_rgba(0,255,149,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                CYBER
                            </button>
                            <div className="flex items-center gap-1 group relative">
                                <button
                                    onClick={() => navigateTo("tactical")}
                                    className={`px-3 py-1.5 rounded-l-full text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'tactical' ? 'bg-amber-500/20 text-amber-500 border-y border-l border-amber-500/30 shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                                >
                                    TACTICAL
                                </button>
                                {activeView === 'tactical' && (
                                    <div className="flex items-center gap-2 bg-amber-500/10 border-y border-r border-amber-500/30 px-3 py-1.5 rounded-r-full border-l border-l-amber-500/50">
                                        <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                        <span className="text-[9px] font-black tracking-[0.2em] text-white/80 uppercase">Tactical View</span>
                                    </div>
                                )}
                            </div>
                            <button
                                onClick={() => navigateTo("strategic")}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'strategic' ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                STRATEGIC
                            </button>
                            <button
                                onClick={() => navigateTo("access")}
                                className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeView === 'access' ? 'bg-[#00FF95]/20 text-[#00FF95] border border-[#00FF95]/30 shadow-[0_0_15px_rgba(0,255,149,0.2)]' : 'text-white/40 hover:text-white hover:bg-white/5'}`}
                            >
                                ACCESS
                            </button>
                            <div className="w-px h-4 bg-white/20 mx-2" />
                        </div>
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

                {/* User Menu Dropdown - Wrapped in Portal for foreground visibility */}
                <AnimatePresence>
                    {showUserMenu && onLogout && (
                        <Portal>
                            <motion.div
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="fixed top-14 right-4 w-64 bg-black/95 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl z-[9999]"
                            >
                                <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                                    <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                                        <User className="w-5 h-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-[10px] font-black text-white uppercase tracking-wider">{user?.full_name || 'SYSTEM USER'}</p>
                                        <p className="text-[8px] font-bold text-blue-400/80 uppercase tracking-widest">{user?.role || 'GUEST'}</p>
                                    </div>
                                </div>
                                <div className="pt-3">
                                    <button
                                        onClick={() => {
                                            onLogout();
                                            setShowUserMenu(false);
                                        }}
                                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-red-500 hover:bg-white/5 transition-all"
                                    >
                                        <LogOut className="w-4 h-4" />
                                        <span className="text-xs font-bold uppercase">Sign Out</span>
                                    </button>
                                </div>
                            </motion.div>
                        </Portal>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};;

export default CommandBar;
