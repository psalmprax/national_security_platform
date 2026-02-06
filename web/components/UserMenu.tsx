"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { User as UserIcon, LogOut } from 'lucide-react';
import { User } from '@/lib/AuthContext';

interface UserMenuProps {
    user: User | null;
    onLogout: () => void;
    showMenu: boolean;
}

const UserMenu: React.FC<UserMenuProps> = ({ user, onLogout, showMenu }) => {
    if (!showMenu) return null;

    return (
        <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-20 right-6 z-[110] w-64 bg-black/95 border border-white/10 rounded-xl p-4 shadow-2xl backdrop-blur-xl"
        >
            <div className="flex items-center gap-3 pb-3 border-b border-white/10">
                <div className="w-10 h-10 rounded-full bg-blue-600/20 flex items-center justify-center border border-blue-500/30">
                    <UserIcon className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                    <p className="text-[10px] font-black text-white uppercase tracking-wider">{user?.full_name || 'SYSTEM USER'}</p>
                    <p className="text-[8px] font-bold text-blue-400/80 uppercase tracking-widest">{user?.role.replace(/_/g, ' ')}</p>
                </div>
            </div>
            <div className="pt-3">
                <button
                    onClick={onLogout}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-white/60 hover:text-red-500 hover:bg-white/5 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    <span className="text-xs font-bold uppercase">Sign Out</span>
                </button>
            </div>
        </motion.div>
    );
};

export default UserMenu;
