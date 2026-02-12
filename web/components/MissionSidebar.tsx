"use client";
import React from 'react';
import { Truck, MapPin, Clock, Navigation, CheckCircle2, XCircle, MoreVertical } from 'lucide-react';
import { Mission, updateMissionStatus } from '../lib/api';

export default function MissionSidebar({
    missions,
    onSelect,
    selectedId,
    themeColor = '#00FF95',
    onRefresh,
    hideHeader = false
}: {
    missions: Mission[],
    onSelect?: (mission: Mission) => void,
    selectedId?: string | null,
    themeColor?: string,
    onRefresh?: () => void,
    hideHeader?: boolean
}) {
    const [isUpdating, setIsUpdating] = React.useState<string | null>(null);

    const handleStatusUpdate = async (missionId: string, status: string) => {
        setIsUpdating(missionId);
        try {
            const success = await updateMissionStatus(missionId, status);
            if (success && onRefresh) {
                onRefresh();
            }
        } catch (error) {
            console.error('Failed to update mission:', error);
        } finally {
            setIsUpdating(null);
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'ASSIGNED': return '#3B82F6'; // Blue
            case 'EN_ROUTE': return '#F59E0B'; // Amber
            case 'ON_SITE': return '#10B981'; // Emerald
            default: return themeColor;
        }
    };

    return (
        <aside className={`${hideHeader ? 'w-full' : 'w-80'} glass-surface flex flex-col z-30 ${hideHeader ? '' : 'border-l border-white/5'} h-full`}>
            {!hideHeader && (
                <div className="p-6 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                    <div className="flex items-center gap-3">
                        <Navigation className="w-5 h-5" style={{ color: themeColor }} />
                        <h2 className="text-sm font-black tracking-[0.2em] text-white/90 uppercase">ACTIVE MISSIONS</h2>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-white/40 tracking-widest uppercase">
                            {(missions || []).length} Active
                        </span>
                    </div>
                </div>
            )}

            <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-cyber">
                {(missions || []).length === 0 ? (
                    <div className="py-20 text-center flex flex-col items-center gap-4 opacity-20">
                        <Truck className="w-8 h-8" />
                        <p className="text-[10px] font-bold tracking-widest uppercase">No active dispatches</p>
                    </div>
                ) : (
                    (missions || []).map(mission => (
                        <div
                            key={mission.id}
                            onClick={() => onSelect?.(mission)}
                            className={`p-4 rounded-xl bg-white/[0.03] border transition-all duration-300 cursor-pointer group relative overflow-hidden ${selectedId === mission.id ? 'border-theme' : 'border-white/5'}`}
                            style={selectedId === mission.id ? { borderColor: themeColor, backgroundColor: themeColor + '0d' } : {}}
                        >
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="text-[10px] font-black tracking-widest uppercase" style={{ color: getStatusColor(mission.status) }}>
                                            {mission.status}
                                        </span>
                                        <span className="text-[8px] bg-white/10 text-white/60 px-1.5 py-0.5 rounded font-mono">
                                            {mission.priority}
                                        </span>
                                    </div>
                                    <h3 className="text-xs font-bold text-white uppercase truncate max-w-[140px]">
                                        Unit: {mission.asset_id.slice(0, 8)}
                                    </h3>
                                </div>
                                <div className="text-right">
                                    <div className="flex items-center gap-1 text-[10px] text-white/40 font-mono">
                                        <Clock className="w-3 h-3" />
                                        {mission.eta_minutes ? `${mission.eta_minutes}m` : '--'}
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 text-[10px] text-white/60 mb-4">
                                <MapPin className="w-3 h-3" />
                                <span className="truncate">Alert: {mission.alert_id.slice(0, 8)}</span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 pt-3 border-t border-white/5">
                                {mission.status === 'ASSIGNED' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(mission.id, 'EN_ROUTE'); }}
                                        disabled={isUpdating === mission.id}
                                        className="h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-amber-500/20 hover:border-amber-500/40 text-[9px] font-bold text-white/60 hover:text-amber-500 transition-all uppercase tracking-widest"
                                    >
                                        Deploy
                                    </button>
                                )}
                                {mission.status === 'EN_ROUTE' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(mission.id, 'ON_SITE'); }}
                                        disabled={isUpdating === mission.id}
                                        className="h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-emerald-500/20 hover:border-emerald-500/40 text-[9px] font-bold text-white/60 hover:text-emerald-500 transition-all uppercase tracking-widest"
                                    >
                                        Confirm Arrival
                                    </button>
                                )}
                                {mission.status === 'ON_SITE' && (
                                    <button
                                        onClick={(e) => { e.stopPropagation(); handleStatusUpdate(mission.id, 'COMPLETED'); }}
                                        disabled={isUpdating === mission.id}
                                        className="h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-blue-500/20 hover:border-blue-500/40 text-[9px] font-bold text-white/60 hover:text-blue-500 transition-all uppercase tracking-widest"
                                    >
                                        Complete
                                    </button>
                                )}
                                <button
                                    onClick={(e) => { e.stopPropagation(); handleStatusUpdate(mission.id, 'ABORTED'); }}
                                    disabled={isUpdating === mission.id}
                                    className="h-8 rounded-lg bg-white/5 border border-white/10 hover:bg-red-500/20 hover:border-red-500/40 text-[9px] font-bold text-white/60 hover:text-red-500 transition-all uppercase tracking-widest col-span-1"
                                >
                                    Abort
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </aside>
    );
}
