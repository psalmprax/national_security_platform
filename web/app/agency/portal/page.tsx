"use client";

import React, { useState, useEffect } from 'react';
import { Shield, Truck, Navigation, Plus, Building2, MapPin, Activity, Save, Loader2, AlertTriangle, User, LogOut, Layout, ShieldAlert } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAuth } from '@/lib/AuthContext';
import { UserRole } from '@/lib/auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

interface Asset {
    id: string;
    name: string;
    type: string;
    status: string;
    capacity_level: number;
    description: string;
}

export default function AgencyPortalPage() {
    const { user, logout, isLoading: isAuthLoading } = useAuth();
    const [assets, setAssets] = useState<Asset[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [showAssetForm, setShowAssetForm] = useState(false);
    const [showAgencyPicker, setShowAgencyPicker] = useState(false);

    // New Asset Form State
    const [newAsset, setNewAsset] = useState({
        agency_id: '00000000-0000-0000-0000-000000000000', // Placeholder or fetch real agency ID
        name: '',
        type: 'PATROL_VEHICLE',
        latitude: 9.0765,
        longitude: 7.3986,
        status: 'ACTIVE',
        description: '',
        call_sign: '',
        capacity_level: 100
    });

    // Fetch Assets
    const fetchAssets = async () => {
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/assets`, {
            });
            if (res.ok) {
                const data = await res.json();
                setAssets(data || []);
            }
        } catch (err) {
            console.error("Failed to fetch assets", err);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (!isAuthLoading && user) {
            fetchAssets();
        }
    }, [user, isAuthLoading]);

    if (isAuthLoading) {
        return (
            <div className="min-h-screen bg-black flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <AlertTriangle className="w-16 h-16 text-yellow-500 mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">ACCESS DENIED</h1>
                <p className="text-slate-400 text-center max-w-md">You must be logged in to access the Agency Command Portal.</p>
                <a href="/login" className="mt-6 bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-xl font-bold transition-all">
                    Return to Login
                </a>
            </div>
        );
    }

    const role = user.role as UserRole;
    const hasPortalAccess = role === 'ADMIN' || role === 'AGENCY_OFFICER';

    if (!hasPortalAccess) {
        return (
            <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
                <Shield className="w-16 h-16 text-red-500 mb-4" />
                <h1 className="text-2xl font-bold text-white mb-2">UNAUTHORIZED</h1>
                <p className="text-slate-400 text-center max-w-md">Your credentials do not grant access to the Agency Command Portal. Please contact system administration for clearance.</p>
                <a href="/" className="mt-6 bg-slate-800 hover:bg-slate-700 text-white px-8 py-3 rounded-xl font-bold transition-all">
                    Back to Dashboard
                </a>
            </div>
        );
    }

    // Handle Submit
    const handleCreateAsset = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/v1/assets`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newAsset)
            });
            if (res.ok) {
                setShowAssetForm(false);
                fetchAssets(); // Refresh list
                alert('Asset Deployed Successfully');
            } else {
                alert('Failed to deploy asset');
            }
        } catch (err) {
            console.error(err);
        }
    };

    // Handle View Switching for Admins
    const toggleAgencyView = (view: string) => {
        window.location.href = `/?view=${view}`;
    };

    return (
        <div className="min-h-screen bg-slate-950 text-white p-6 relative">
            {/* Agency View Switcher - Only for System Admin */}
            {user?.role === 'ADMIN' && (
                <div className="fixed top-0 left-1/2 -translate-x-1/2 z-[100] group">
                    <button
                        className="h-8 px-6 bg-slate-900 border-b border-x border-slate-800 hover:border-blue-500 rounded-b-lg flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md transition-all hover:bg-black"
                        onClick={() => setShowAgencyPicker(!showAgencyPicker)}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        <span className="text-[10px] font-bold text-white/80 uppercase tracking-widest group-hover:text-blue-400">
                            Command View
                        </span>
                        <div className="w-0 h-0 border-l-[3px] border-l-transparent border-t-[4px] border-t-white/60 border-r-[3px] border-r-transparent group-hover:border-t-blue-400" />
                    </button>

                    {showAgencyPicker && (
                        <div className="absolute top-10 left-1/2 -translate-x-1/2 bg-slate-900 border border-slate-800 rounded-xl p-4 shadow-2xl backdrop-blur-md animate-in slide-in-from-top-4 fade-in duration-200 min-w-[320px]">
                            <div className="flex items-center gap-4 text-white">
                                <button
                                    onClick={() => toggleAgencyView('cyber')}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent hover:bg-white/10 text-white/60 hover:text-white transition-all"
                                >
                                    <Layout className="w-6 h-6" />
                                    <span className="text-xs font-bold uppercase">Cyber</span>
                                </button>
                                <button
                                    onClick={() => toggleAgencyView('tactical')}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent hover:bg-white/10 text-white/60 hover:text-white transition-all"
                                >
                                    <Layout className="w-6 h-6" />
                                    <span className="text-xs font-bold uppercase">Tactical</span>
                                </button>
                                <button
                                    onClick={() => toggleAgencyView('strategic')}
                                    className="flex flex-col items-center gap-2 p-3 rounded-lg border border-transparent hover:bg-white/10 text-white/60 hover:text-white transition-all"
                                >
                                    <Layout className="w-6 h-6" />
                                    <span className="text-xs font-bold uppercase">Strategic</span>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            <header className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
                <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-900/20">
                        <Shield className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold italic tracking-tight">Agency Command Portal</h1>
                        <p className="text-slate-400 text-sm font-medium">Logistics & Asset Administration</p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <button
                        onClick={() => setShowAssetForm(!showAssetForm)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg flex items-center gap-2 font-medium transition-all shadow-lg shadow-blue-900/20"
                    >
                        <Plus className="w-4 h-4" />
                        Deploy New Asset
                    </button>

                    <div className="flex items-center gap-4 pl-6 border-l border-slate-800">
                        <div className="text-right">
                            <p className="text-sm font-bold text-slate-200">{user.full_name || user.phone_number}</p>
                            <div className="flex items-center justify-end gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-widest">
                                    {user.role}
                                </p>
                            </div>
                        </div>
                        <div className="w-10 h-10 bg-slate-900 border border-slate-800 rounded-full flex items-center justify-center text-slate-400">
                            <User className="w-5 h-5" />
                        </div>
                        <button
                            onClick={() => logout()}
                            className="w-10 h-10 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg flex items-center justify-center transition-all border border-red-500/20"
                            title="Log Out"
                        >
                            <LogOut className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </header>

            <main className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Asset Form Panel */}
                {showAssetForm && (
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl">
                            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                                <Navigation className="w-5 h-5 text-blue-400" />
                                New Asset Deployment
                            </h2>
                            <form onSubmit={handleCreateAsset} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Asset Name</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                        placeholder="e.g. Alpha Patrol Unit 1"
                                        value={newAsset.name}
                                        onChange={e => setNewAsset({ ...newAsset, name: e.target.value })}
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Type</label>
                                        <select
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                            value={newAsset.type}
                                            onChange={e => setNewAsset({ ...newAsset, type: e.target.value })}
                                        >
                                            <option value="PATROL_VEHICLE">Patrol Vehicle</option>
                                            <option value="STATION">Station / HQ</option>
                                            <option value="CHECKPOINT">Checkpoint</option>
                                            <option value="AMBULANCE">Ambulance</option>
                                            <option value="FIRE_TRUCK">Fire Truck</option>
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Call Sign</label>
                                        <input
                                            type="text"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                            placeholder="e.g. RED-1"
                                            value={newAsset.call_sign}
                                            onChange={e => setNewAsset({ ...newAsset, call_sign: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lat</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                            value={newAsset.latitude}
                                            onChange={e => setNewAsset({ ...newAsset, latitude: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Lng</label>
                                        <input
                                            type="number"
                                            step="0.0001"
                                            className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-sm focus:border-blue-500 outline-none"
                                            value={newAsset.longitude}
                                            onChange={e => setNewAsset({ ...newAsset, longitude: parseFloat(e.target.value) })}
                                        />
                                    </div>
                                </div>
                                <button
                                    type="submit"
                                    className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 transition-all mt-4"
                                >
                                    <Save className="w-4 h-4" />
                                    Confirm Deployment
                                </button>
                            </form>
                        </div>
                    </motion.div>
                )}

                {/* Asset List */}
                <div className={showAssetForm ? "lg:col-span-2" : "lg:col-span-3"}>
                    <div className="bg-slate-900/50 border border-slate-800 rounded-2xl p-6">
                        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-300">
                            <Activity className="w-5 h-5 text-emerald-400" />
                            Active Fleet & Resources
                            <span className="bg-slate-800 text-slate-400 text-xs px-2 py-0.5 rounded-full ml-2">
                                {assets.length} Units
                            </span>
                        </h2>

                        {isLoading ? (
                            <div className="text-center py-20 text-slate-500">Loading Fleet Data...</div>
                        ) : assets.length === 0 ? (
                            <div className="text-center py-20 bg-slate-950/30 rounded-xl border border-dashed border-slate-800">
                                <Truck className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                                <p className="text-slate-500">No assets deployed yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                                {assets.map((asset) => (
                                    <div key={asset.id} className="bg-slate-950 border border-slate-800 hover:border-slate-700 p-4 rounded-xl transition-all group">
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="bg-slate-900 p-2 rounded-lg text-slate-400 group-hover:text-blue-400 transition-colors">
                                                {asset.type === 'STATION' ? <Building2 className="w-5 h-5" /> :
                                                    asset.type === 'CHECKPOINT' ? <MapPin className="w-5 h-5" /> :
                                                        <Truck className="w-5 h-5" />}
                                            </div>
                                            <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${asset.status === 'ACTIVE' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                                }`}>
                                                {asset.status}
                                            </span>
                                        </div>
                                        <h3 className="font-bold text-slate-200 mb-1">{asset.name}</h3>
                                        <p className="text-xs text-slate-500 line-clamp-2">{asset.description || 'No operational details logged.'}</p>

                                        <div className="mt-4 pt-3 border-t border-slate-900 flex justify-between items-center text-xs text-slate-600 font-mono">
                                            <span>OP: {asset.capacity_level}%</span>
                                            <span>ID: {asset.id.slice(0, 8)}</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
}
