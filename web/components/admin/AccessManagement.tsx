"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Users, Shield, Lock, Search, Filter,
    ArrowUpRight, AlertCircle, RefreshCw,
    UserCircle, Mail, Phone, Clock, Plus, Trash, User as UserIcon, Settings
} from 'lucide-react';
import {
    fetchAllUsers, updateUserClearance, Alert, fetchAlerts,
    updateAlertClassification, fetchAuditLogs, fetchRoles,
    fetchPermissions, createRole
} from '../../lib/api';
import { useAuth, User } from '../../lib/AuthContext';
import { hasAccess } from '../../lib/auth';
import UserProfile from './UserProfile';

const CLEARANCE_LEVELS = [
    'UNCLASSIFIED',
    'RESTRICTED',
    'CONFIDENTIAL',
    'SECRET',
    'TOP_SECRET'
];

interface AuditEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    target: string;
    from: string;
    to: string;
    details: string;
}

interface Role {
    id: string;
    name: string;
    permissions: string[];
}

interface Permission {
    id: string;
    name: string;
    description: string;
}

interface AccessManagementProps {
    displayMode?: 'dark' | 'light' | 'contrast' | 'oled' | 'terminal';
    setDisplayMode?: (mode: 'dark' | 'light' | 'contrast' | 'oled' | 'terminal') => void;
    watermarkMode?: 'none' | 'seal' | 'coat_of_arms';
    setWatermarkMode?: (mode: 'none' | 'seal' | 'coat_of_arms') => void;
}

export default function AccessManagement({
    displayMode = 'dark',
    setDisplayMode,
    watermarkMode = 'seal',
    setWatermarkMode
}: AccessManagementProps) {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<User[]>([]);
    const [alerts, setAlerts] = useState<Alert[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'users' | 'alerts' | 'audit' | 'rbac'>('users');
    const [searchTerm, setSearchTerm] = useState(''); const [roleFilter, setRoleFilter] = useState<string>('');
    const [clearanceFilter, setClearanceFilter] = useState<string>('');
    const [classificationFilter, setClassificationFilter] = useState<string>('');
    const [auditLogs, setAuditLogs] = useState<AuditEntry[]>([]);
    const [roles, setRoles] = useState<Role[]>([]);
    const [permissions, setPermissions] = useState<Permission[]>([]);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [isCreateRoleModalOpen, setCreateRoleModalOpen] = useState(false);

    const isSecurityAdmin = currentUser?.role === 'ADMIN' || currentUser?.role === 'SECURITY_OFFICER';

    const loadData = async () => {
        setLoading(true);
        try {
            const [usersData, alertsData, auditLogsData, rolesData, permissionsData] = await Promise.all([
                fetchAllUsers(),
                fetchAlerts(),
                fetchAuditLogs(),
                fetchRoles(),
                fetchPermissions(),
            ]);
            setUsers(usersData);
            setAlerts(alertsData);
            setAuditLogs(auditLogsData);
            setRoles(rolesData);
            setPermissions(permissionsData);
        } catch (error) {
            console.error('Failed to load access management data:', error);
            setNotification({ message: 'Failed to load initial data.', type: 'error' });
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
        setNotification(null);
        try {
            const success = await updateUserClearance(userId, level);
            if (success) {
                await loadData();
                setNotification({ message: 'User clearance updated successfully.', type: 'success' });
            } else {
                setNotification({ message: 'Failed to update user clearance.', type: 'error' });
            }
        } catch (error) {
            console.error('Error updating user clearance:', error);
            setNotification({ message: 'An error occurred while updating user clearance.', type: 'error' });
        } finally {
            setUpdatingId(null);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleClassificationUpdate = async (alertId: string, level: string) => {
        if (!isSecurityAdmin) return;
        setUpdatingId(alertId);
        setNotification(null);
        try {
            const success = await updateAlertClassification(alertId, level);
            if (success) {
                await loadData();
                setNotification({ message: 'Alert classification updated successfully.', type: 'success' });
            } else {
                setNotification({ message: 'Failed to update alert classification.', type: 'error' });
            }
        } catch (error) {
            console.error('Error updating alert classification:', error);
            setNotification({ message: 'An error occurred while updating alert classification.', type: 'error' });
        } finally {
            setUpdatingId(null);
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const handleCreateRole = async (roleName: string, selectedPermissions: string[]) => {
        if (!isSecurityAdmin) return;
        setNotification(null);
        try {
            const newRole = await createRole(roleName, selectedPermissions);
            if (newRole) {
                await loadData();
                setNotification({ message: `Role "${roleName}" created successfully.`, type: 'success' });
                setCreateRoleModalOpen(false);
            } else {
                setNotification({ message: 'Failed to create role.', type: 'error' });
            }
        } catch (error) {
            console.error('Error creating role:', error);
            setNotification({ message: 'An error occurred while creating the role.', type: 'error' });
        } finally {
            setTimeout(() => setNotification(null), 5000);
        }
    };

    const filteredUsers = users.filter(u =>
        ((u.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (u.phone_number || '').includes(searchTerm)) &&
        (roleFilter ? u.role === roleFilter : true) &&
        (clearanceFilter ? u.clearance_level === clearanceFilter : true)
    );

    const filteredAlerts = alerts.filter(a =>
        ((a.type || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
            (a.content || '').toLowerCase().includes(searchTerm.toLowerCase())) &&
        (classificationFilter ? a.classification_level === classificationFilter : true)
    );

    const filteredAuditLogs = auditLogs.filter(log =>
        (log.actor || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (log.action || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredRoles = roles.filter(role =>
        (role.name || '').toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="w-full h-full flex flex-col bg-transparent p-6 pb-20 space-y-8" data-theme={displayMode}>
            <AnimatePresence>
                {selectedUser && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
                        onClick={() => setSelectedUser(null)}
                    >
                        <motion.div
                            initial={{ scale: 0.9 }}
                            animate={{ scale: 1 }}
                            exit={{ scale: 0.9 }}
                            className="w-full max-w-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <UserProfile user={selectedUser} />
                        </motion.div>
                    </motion.div>
                )}
                {isCreateRoleModalOpen && (
                    <CreateRoleModal
                        isOpen={isCreateRoleModalOpen}
                        onClose={() => setCreateRoleModalOpen(false)}
                        onSubmit={handleCreateRole}
                        permissions={permissions}
                        readOnly={!isSecurityAdmin}
                    />
                )}
            </AnimatePresence>
            <header className="flex items-center justify-between mb-8">
                <div>
                    <div className="flex items-center gap-3 mb-1">
                        <Lock className="w-5 h-5 text-[#00FF95]" />
                        <h1 className="text-2xl font-black text-white uppercase tracking-wider">Access & Identity Registry</h1>
                    </div>
                    <p className="text-white/40 text-xs font-medium uppercase tracking-widest">Global Clearance & Classification Control</p>
                </div>

                <div className="flex items-center gap-4">
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
                        <button
                            onClick={() => setActiveTab('audit')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'audit' ? 'bg-[#00FF95] text-black shadow-[0_0_20px_rgba(0,255,149,0.3)]' : 'text-white/40 hover:text-white'}`}
                        >
                            Audit Log
                        </button>
                        <button
                            onClick={() => setActiveTab('rbac')}
                            className={`px-6 py-2 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all ${activeTab === 'rbac' ? 'bg-[#00FF95] text-black shadow-[0_0_20px_rgba(0,255,149,0.3)]' : 'text-white/40 hover:text-white'}`}
                        >
                            RBAC
                        </button>
                    </div>
                </div>
            </header>


            <AnimatePresence>
                {notification && (
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`mb-6 p-4 rounded-2xl text-xs font-bold uppercase tracking-widest flex items-center gap-3 ${notification.type === 'success'
                            ? 'bg-green-500/10 border border-green-500/20 text-green-500'
                            : 'bg-red-500/10 border border-red-500/20 text-red-500'
                            }`}
                    >
                        <AlertCircle className="w-5 h-5" />
                        {notification.message}
                    </motion.div>
                )}
            </AnimatePresence>

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
                        placeholder={activeTab === 'users' ? "Search personnel by name or NIN..." : activeTab === 'alerts' ? "Search alerts by type or content..." : activeTab === 'audit' ? "Search audit log by actor or action..." : "Search roles by name..."}
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
                <select
                    value={roleFilter}
                    onChange={(e) => setRoleFilter(e.target.value)}
                    className="bg-black border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-black text-white/70 uppercase tracking-widest focus:outline-none focus:border-[#00FF95] transition-colors disabled:opacity-50"
                >
                    <option value="">All Roles</option>
                    {roles.map(r => <option key={r.id} value={r.name}>{r.name}</option>)}
                </select>
                <select
                    value={clearanceFilter}
                    onChange={(e) => setClearanceFilter(e.target.value)}
                    className="bg-black border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-black text-white/70 uppercase tracking-widest focus:outline-none focus:border-[#00FF95] transition-colors disabled:opacity-50"
                >
                    <option value="">All Clearances</option>
                    {CLEARANCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
                <select
                    value={classificationFilter}
                    onChange={(e) => setClassificationFilter(e.target.value)}
                    className="bg-black border border-white/10 rounded-lg py-1.5 px-3 text-[10px] font-black text-white/70 uppercase tracking-widest focus:outline-none focus:border-[#00FF95] transition-colors disabled:opacity-50"
                >
                    <option value="">All Classifications</option>
                    {CLEARANCE_LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
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
                                    onSelect={() => setSelectedUser(user)}
                                />
                            ))}
                        </motion.div>
                    ) : activeTab === 'alerts' ? (
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
                    ) : activeTab === 'audit' ? (
                        <motion.div
                            key="audit"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            {filteredAuditLogs.map((log, idx) => (
                                <AuditLogRow
                                    key={log.id}
                                    log={log}
                                    index={idx}
                                />
                            ))}
                        </motion.div>
                    ) : (
                        <motion.div
                            key="rbac"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="space-y-3"
                        >
                            <div className="grid grid-cols-2 gap-8">
                                <div>
                                    <div className="flex justify-between items-center mb-4">
                                        <h2 className="text-lg font-bold text-white">Roles</h2>
                                        {isSecurityAdmin && (
                                            <button
                                                onClick={() => setCreateRoleModalOpen(true)}
                                                className="flex items-center gap-2 text-sm text-[#00FF95] hover:text-white transition-colors"
                                            >
                                                <Plus className="w-4 h-4" /> Create Role
                                            </button>
                                        )}
                                    </div>
                                    {roles.map((role, idx) => (
                                        <RoleRow
                                            key={role.id}
                                            role={role}
                                            index={idx}
                                            readOnly={!isSecurityAdmin}
                                        />
                                    ))}
                                </div>
                                <div>
                                    <h2 className="text-lg font-bold text-white mb-4">Permissions</h2>
                                    {permissions.map((permission, idx) => (
                                        <PermissionRow
                                            key={permission.id}
                                            permission={permission}
                                            index={idx}
                                        />
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
function RoleRow({ role, index, readOnly }: { role: Role, index: number, readOnly: boolean }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-3 flex justify-between items-start"
        >
            <div>
                <h3 className="text-sm font-bold text-white">{role.name}</h3>
                <div className="flex flex-wrap gap-2 mt-2">
                    {role.permissions.map(p => (
                        <span key={p} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-white/40 font-black uppercase tracking-widest leading-none">
                            {p}
                        </span>
                    ))}
                </div>
            </div>
            {!readOnly && (
                <button className="text-white/40 hover:text-red-500 transition-colors">
                    <Trash className="w-4 h-4" />
                </button>
            )}
        </motion.div>
    );
}

function PermissionRow({ permission, index }: { permission: Permission, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 mb-3"
        >
            <h3 className="text-sm font-bold text-white">{permission.name}</h3>
            <p className="text-xs text-white/60">{permission.description}</p>
        </motion.div>
    );
}


function UserRow({ user, index, updating, readOnly, onUpdate, onSelect }: { user: User, index: number, updating: boolean, readOnly: boolean, onUpdate: (l: string) => void, onSelect: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`group grid grid-cols-[1fr_200px_250px] items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border transition-all ${readOnly ? 'opacity-80' : 'hover:border-white/20'}`}
            style={{ borderColor: 'rgba(255,255,255,0.05)' }}
            onClick={onSelect}
        >
            <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center border border-white/10 group-hover:scale-110 transition-transform">
                    <UserCircle className="w-5 h-5 text-white/40" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-white tracking-tight">{user.full_name || 'IDENT_PENDING'}</h3>
                        {user.nin_verified && (
                            <span className="flex items-center gap-1 bg-[#00FF95]/10 border border-[#00FF95]/30 text-[#00FF95] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                <Shield className="w-2 h-2" /> Verified
                            </span>
                        )}
                    </div>
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
                    <h3 className="text-sm font-black text-white tracking-tight uppercase truncate">{alert.type}</h3>
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
function AuditLogRow({ log, index }: { log: AuditEntry, index: number }) {
    return (
        <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.05 }}
            className="grid grid-cols-[150px_150px_1fr_150px] items-center gap-6 p-4 rounded-2xl bg-white/[0.02] border border-white/5"
        >
            <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-white/40" />
                <span className="text-xs text-white/60 font-mono">{new Date(log.timestamp).toLocaleString()}</span>
            </div>
            <div className="flex items-center gap-2">
                <UserCircle className="w-4 h-4 text-white/40" />
                <span className="text-sm font-bold text-white">{log.actor}</span>
            </div>
            <div>
                <span className="text-sm text-white/80">{log.action}: <span className="font-bold">{log.target}</span></span>
                <span className="text-xs text-white/40 ml-2">({log.from} {'->'} {log.to})</span>
            </div>
            <div className="text-xs text-white/50 italic text-right">
                {log.details}
            </div>
        </motion.div>
    );
}

function CreateRoleModal({ isOpen, onClose, onSubmit, permissions, readOnly }: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (roleName: string, selectedPermissions: string[]) => void;
    permissions: Permission[];
    readOnly: boolean;
}) {
    const [roleName, setRoleName] = useState('');
    const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);

    const handlePermissionToggle = (permissionName: string) => {
        setSelectedPermissions(prev =>
            prev.includes(permissionName)
                ? prev.filter(p => p !== permissionName)
                : [...prev, permissionName]
        );
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (roleName.trim() && !readOnly) {
            onSubmit(roleName, selectedPermissions);
        }
    };

    if (!isOpen) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="bg-[#0A0A0A] border border-white/10 rounded-2xl p-8 w-full max-w-lg"
                onClick={(e) => e.stopPropagation()}
            >
                <h2 className="text-xl font-bold text-white mb-6">Create New Role</h2>
                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        value={roleName}
                        onChange={(e) => setRoleName(e.target.value)}
                        placeholder="Role Name (e.g., FIELD_AGENT)"
                        className="w-full bg-white/[0.03] border border-white/10 rounded-lg py-3 px-4 text-sm text-white focus:outline-none focus:border-[#00FF95]/50 mb-6"
                        disabled={readOnly}
                    />
                    <h3 className="text-sm font-bold text-white/80 mb-3">Assign Permissions</h3>
                    <div className="grid grid-cols-2 gap-3 max-h-60 overflow-y-auto pr-2 scrollbar-cyber">
                        {permissions.map(p => (
                            <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${selectedPermissions.includes(p.name) ? 'bg-[#00FF95]/10' : 'bg-white/5 hover:bg-white/10'}`}>
                                <input
                                    type="checkbox"
                                    className="appearance-none w-4 h-4 rounded-sm bg-white/10 checked:bg-[#00FF95] border border-white/20"
                                    checked={selectedPermissions.includes(p.name)}
                                    onChange={() => handlePermissionToggle(p.name)}
                                    disabled={readOnly}
                                />
                                <span className="text-xs font-semibold text-white/80">{p.name}</span>
                            </label>
                        ))}
                    </div>

                    <div className="flex justify-end gap-4 mt-8">
                        <button type="button" onClick={onClose} className="text-white/40 hover:text-white transition-colors text-sm font-bold">Cancel</button>
                        <button
                            type="submit"
                            disabled={readOnly || !roleName.trim()}
                            className="bg-[#00FF95] text-black font-bold py-2 px-6 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            Create Role
                        </button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
}