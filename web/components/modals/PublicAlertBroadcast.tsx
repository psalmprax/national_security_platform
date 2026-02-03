"use client";

import React, { useState } from 'react';
import { X, Megaphone, MapPin, ShieldAlert, Clock, Send, Users } from 'lucide-react';
import { createPublicAlert, PublicAlert } from '../../lib/api';
import { toast } from 'react-toastify';

interface PublicAlertBroadcastProps {
    onClose: () => void;
    initialLocation?: { lat: number; lng: number };
}

export default function PublicAlertBroadcast({ onClose, initialLocation }: PublicAlertBroadcastProps) {
    const [loading, setLoading] = useState(false);
    const [form, setForm] = useState({
        title: '',
        message: '',
        alert_level: 'info',
        alert_type: 'CIVIL_STATUS',
        radius_meters: 5000,
        expires_in_hours: 4,
        latitude: initialLocation?.lat || 9.0765, // Abuja default
        longitude: initialLocation?.lng || 7.3986
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const success = await createPublicAlert({
                title: form.title,
                message: form.message,
                alert_level: form.alert_level,
                alert_type: form.alert_type,
                location: {
                    latitude: form.latitude,
                    longitude: form.longitude
                },
                radius_meters: form.radius_meters,
                expires_in_hours: form.expires_in_hours
            } as any);

            if (success) {
                toast.success('PUBLIC SAFETY ALERT BROADCASTED');
                onClose();
            } else {
                toast.error('FAILED TO BROADCAST ALERT');
            }
        } catch (error) {
            toast.error('BROADCAST SYSTEM FAILURE');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <form
                onSubmit={handleSubmit}
                className="relative w-full max-w-lg bg-[#0A0A0A] border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Header */}
                <div className="bg-white/5 p-6 border-b border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-orange-500/20 flex items-center justify-center border border-orange-500/30 shadow-[0_0_20px_rgba(249,115,22,0.15)]">
                            <Megaphone className="w-6 h-6 text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white uppercase tracking-tighter">Public Safety Broadcast</h2>
                            <p className="text-[10px] text-white/40 font-mono uppercase tracking-widest">Targeting affected regions in real-time</p>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                        <X className="w-5 h-5 text-white/40" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Severity & Type row */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Alert Severity</label>
                            <select
                                value={form.alert_level}
                                onChange={(e) => setForm({ ...form, alert_level: e.target.value })}
                                className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-orange-500/50 transition-all font-bold uppercase"
                            >
                                <option value="info" className="bg-[#0A0A0A]">Informational</option>
                                <option value="warning" className="bg-[#0A0A0A]">Warning</option>
                                <option value="critical" className="bg-[#0A0A0A]">Critical Threat</option>
                                <option value="emergency" className="bg-[#0A0A0A]">National Emergency</option>
                            </select>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Target Radius</label>
                            <div className="relative">
                                <Users className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                                <select
                                    value={form.radius_meters}
                                    onChange={(e) => setForm({ ...form, radius_meters: Number(e.target.value) })}
                                    className="w-full bg-black/60 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-xs text-white outline-none focus:border-orange-500/50 transition-all font-bold uppercase"
                                >
                                    <option value={1000} className="bg-[#0A0A0A]">1 KM RAD</option>
                                    <option value={5000} className="bg-[#0A0A0A]">5 KM RAD</option>
                                    <option value={10000} className="bg-[#0A0A0A]">10 KM RAD</option>
                                    <option value={50000} className="bg-[#0A0A0A]">50 KM RAD</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Alert Title</label>
                        <input
                            required
                            type="text"
                            placeholder="E.G., UNUSUAL PATHOGEN DETECTED..."
                            value={form.title}
                            onChange={(e) => setForm({ ...form, title: e.target.value.toUpperCase() })}
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 transition-all font-bold placeholder:text-white/10"
                        />
                    </div>

                    {/* Message */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-white/40 uppercase tracking-widest ml-1">Citizen Instructions</label>
                        <textarea
                            required
                            rows={4}
                            placeholder="PROVIDE CLEAR, CONCISE ACTION STEPS FOR CITIZENS..."
                            value={form.message}
                            onChange={(e) => setForm({ ...form, message: e.target.value })}
                            className="w-full bg-black/60 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-orange-500/50 transition-all font-medium placeholder:text-white/10 resize-none"
                        />
                    </div>

                    {/* Expiry and Location Summary */}
                    <div className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <Clock className="w-4 h-4 text-white/30" />
                            <div>
                                <p className="text-[9px] font-bold text-white/40 uppercase">EXPIRES IN</p>
                                <p className="text-[10px] font-mono text-white tracking-widest">{form.expires_in_hours} HOURS</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 text-right">
                            <div>
                                <p className="text-[9px] font-bold text-white/40 uppercase">TARGET ORIGIN</p>
                                <p className="text-[10px] font-mono text-white tracking-widest">{form.latitude.toFixed(2)}, {form.longitude.toFixed(2)}</p>
                            </div>
                            <MapPin className="w-4 h-4 text-white/30" />
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="p-6 bg-white/5 border-t border-white/5 flex items-center justify-end gap-4">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 text-[10px] font-black uppercase text-white/40 hover:text-white transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="flex items-center gap-2 px-8 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 disabled:cursor-not-allowed text-black font-black uppercase text-[11px] rounded-xl transition-all shadow-[0_0_30px_rgba(249,115,22,0.3)]"
                    >
                        {loading ? 'Initializing Broadcast...' : (
                            <>
                                <Send className="w-4 h-4" />
                                Execute Broadcast
                            </>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
