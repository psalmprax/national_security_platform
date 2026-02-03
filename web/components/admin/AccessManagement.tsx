"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Shield, Lock, Search, Filter,
    ArrowUpRight, AlertCircle, RefreshCw,
    UserCircle, Mail, Phone, Clock
} from 'lucide-react';
import { fetchAllUsers, updateUserClearance, Alert, fetchAlerts, updateAlertClassification } from '../../lib/api';
import { useAuth, User } from '../../lib/AuthContext';
import { hasAccess } from '../../lib/auth';

const CLEARANCE_LEVELS = [
    'UNCLASSIFIED',
    'RESTRICTED',
    'CONFIDENTIAL',
    'SECRET',
    'TOP_SECRET'
];

export default function AccessManagement() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'alerts'>('users');
    const [searchTerm, setSearchTerm] = useState('');
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const isSecurityAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SECURITY_OFFICER';

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, alertsData] = await Promise.all([
                fetchAllUsers(),
                fetchAlerts()
            ]);
            setUsers(usersData);
            setAlerts(alertsData);
        } catch (error) {
            console.error('Failed to load access management data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const handleClearanceUpdate = async (userId: string, level: string) => {
        if (!isSecurityAdmin) return;
        setUpdatingId(userId);
        const success = await updateUserClearance(userId, level);
        if (success) {
            setUsers(prev => prev.map(u => u.id === userId ? { ...u, clearance_level: level } : u));
        }
        setUpdatingId(null);
    };

    const handleClassificationUpdate = async (alertId: string, level: string) => {
        if (!isSecurityAdmin) return;
        setUpdatingId(alertId);
        const success = await updateAlertClassification(alertId, level);
        if (success) {
            setAlerts(prev => prev.map(a => a.id === alertId ? { ...a, classification_level: level } : a));
        }
        setUpdatingId(null);
    };

    const filteredUsers = users.filter(u =>
        u.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.phone_number.includes(searchTerm)
    );

    const filteredAlerts = alerts.filter(a =>
        a.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
        a.content.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="flex-1 flex flex-col h-full bg-[#050505] p-8 overflow-hidden font-sans">
            <header className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Lock className="w-5 h-5 text-[#00FF95]" />
                        <h1 className="text-2xl font-black text-white uppercase tracking-wider">Access & Identity Registry</h1>
                    </div>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Global Clearance & Classification Control</p>
                </div>

                <div className="flex items-center gap-4 bg-white/5 p-1 rounded-2xl border border-white/10">
                    <button
                        onClick={() => setActiveTab('users')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'users' ? 'bg-[#00FF95] text-black shadow-[0_0_20px_rgba(0,255,149,0.3)]' : 'text-white/40 hover:text-white'}`}
                    >
                        Personnel Registry
                    </button>
                    <button
                        onClick={() => setActiveTab('alerts')}
                        className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'alerts' ? 'bg-[#00FF95] text-black shadow-[0_0_20px_rgba(0,255,149,0.3)]' : 'text-white/40 hover:text-white'}`}
                    >
                        Intelligence Assets
                    </button>
                </div>
            </header>

            {!isSecurityAdmin && (
                <div className="mb-6 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-2xl flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-yellow-500" />
                    <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest">Read-Only Mode: Insufficient permissions to modify security protocols.</p>
                </div>
            )}

            <div className="flex items-center gap-4 mb-6">
                <div className="flex-1 relative group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 transition-colors group-focus-within:text-[#00FF95]" />
                    <input
                        type="text"
                        placeholder={activeTab === 'users' ? "Search peronnel by name or NIN..." : "Search alerts by type or content..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-3 pl-12 pr-4 text-sm text-white focus:outline-none focus:border-[#00FF95]/50 focus:bg-white/[0.05] transition-all"
                    />
                </div>
                <button
                    onClick={loadData}
                    className="p-3 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/10 transition-colors group"
                >
                    <RefreshCw className={`w-4 h-4 text-white/40 group-hover:text-white ${loading ? 'animate-spin' : ''}`} />
                </button>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-cyber pr-4 -mr-4">
                <AnimatePresence mode="wait">
                    {activeTab === 'users' ? (
                        <motion.div
                            key="users"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            {filteredUsers.map((user, idx) => (
                                <UserRow
                                    key={user.id}
                                    user={user}
                                    index={idx}
                                    updating={updatingId === user.id}
                                    readOnly={!isSecurityAdmin}
                                    onUpdate={(level) => handleClearanceUpdate(user.id, level)}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="alerts"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            {filteredAlerts.map((alert, idx) => (
                                <AlertRow
                                    key={alert.id}
                                    alert={alert}
                                    index={idx}
                                    updating={updatingId === alert.id}
                                    readOnly={!isSecurityAdmin}
                                    onUpdate={(level) => handleClassificationUpdate(alert.id, level)}
                                />
                            ))}
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

function UserRow({ user, index, updating, readOnly, onUpdate }: { user: User, index: number, updating: boolean, readOnly: boolean, onUpdate: (l: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group grid grid-cols-[1fr_200px_250px] items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border transition-all ${readOnly ? 'opacity-80' : 'hover:border-white/20'}`}
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <UserCircle className="w-5 h-5 text-white/40" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-white tracking-tight">{user.full_name || 'IDENT_PENDING'}</h3>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-white/30 font-mono">
                            <Phone className="w-3 h-3" /> {user.phone_number}
                        </span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-widest leading-none">
                            {user.role}
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Clearance Level</span>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${user.clearance_level === 'TOP_SECRET' ? 'bg-[#FF003C] animate-pulse' : 'bg-[#00FF95]'}`} />
                    <span className="text-xs font-black text-white tracking-tighter uppercase">{user.clearance_level}</span>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <select
                    disabled={updating || readOnly}
                    className="bg-black border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-black text-white/70 uppercase tracking-widest focus:outline-none focus:border-[#00FF95] transition-colors disabled:opacity-50"
                    value={user.clearance_level}
                    onChange={(e) => onUpdate(e.target.value)}
                >
                    {CLEARANCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                {!readOnly && (
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-4 h-4 text-white/20" />
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function AlertRow({ alert, index, updating, readOnly, onUpdate }: { alert: Alert, index: number, updating: boolean, readOnly: boolean, onUpdate: (l: string) => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group grid grid-cols-[1fr_200px_250px] items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border transition-all ${readOnly ? 'opacity-80' : 'hover:border-white/20'}`}
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <AlertCircle className={`w-5 h-5 ${alert.severity > 0.8 ? 'text-[#FF003C]' : 'text-white/40'}`} />
                </div>
                <div className="min-w-0">
                    <h3 className="text-sm font-black text-white tracking-tight uppercase truncate">{alert.type.replace(/_/g, ' ')}</h3>
                    <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-white/30 font-mono italic truncate">
                            {alert.content.substring(0, 60)}...
                        </span>
                    </div>
                </div>
            </div>

            <div className="flex flex-col items-end">
                <span className="text-[9px] font-black text-white/20 uppercase tracking-[0.2em] mb-1">Classification</span>
                <div className="flex items-center gap-2">
                    <div className={`w-1.5 h-1.5 rounded-full ${alert.classification_level === 'TOP_SECRET' ? 'bg-[#FF003C] animate-pulse' : 'bg-[#00FF95]'}`} />
                    <span className="text-xs font-black text-white tracking-tighter uppercase">{alert.classification_level || 'UNCLASSIFIED'}</span>
                </div>
            </div>

            <div className="flex justify-end gap-2">
                <select
                    disabled={updating || readOnly}
                    className="bg-black border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-black text-white/70 uppercase tracking-widest focus:outline-none focus:border-[#00FF95] transition-colors disabled:opacity-50"
                    value={alert.classification_level || 'UNCLASSIFIED'}
                    onChange={(e) => onUpdate(e.target.value)}
                >
                    {CLEARANCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                {!readOnly && (
                    <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <ArrowUpRight className="w-4 h-4 text-white/20" />
                    </div>
                )}
            </div>
        </motion.div>
    );
}
