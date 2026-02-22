import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Database, Zap, Cpu, AlertTriangle, CheckCircle, RefreshCcw } from 'lucide-react';
import { fetchServiceHealth, ServiceHealth } from '../../../lib/api';

const SystemHealth: React.FC = () => {
    const [healthData, setHealthData] = useState<Record<string, ServiceHealth | null>>({
        core: null,
        intelligence: null,
        sentinel: null
    });
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    const refreshHealth = async () => {
        setLoading(true);
        const [core, intel, sentinel] = await Promise.all([
            fetchServiceHealth('core'),
            fetchServiceHealth('intelligence'),
            fetchServiceHealth('sentinel')
        ]);

        setHealthData({
            core,
            intelligence: intel,
            sentinel
        });
        setLastUpdated(new Date());
        setLoading(false);
    };

    useEffect(() => {
        refreshHealth();
        const interval = setInterval(refreshHealth, 30000); // 30s auto-refresh
        return () => clearInterval(interval);
    }, []);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'OPERATIONAL': return 'text-green-400';
            case 'DEGRADED': return 'text-yellow-400';
            case 'OFFLINE': return 'text-red-400';
            default: return 'text-gray-400';
        }
    };

    const getStatusBg = (status: string) => {
        switch (status) {
            case 'OPERATIONAL': return 'bg-green-400/20 shadow-[0_0_15px_rgba(74,222,128,0.3)]';
            case 'DEGRADED': return 'bg-yellow-400/20 shadow-[0_0_15px_rgba(250,204,21,0.3)]';
            case 'OFFLINE': return 'bg-red-400/20 shadow-[0_0_15px_rgba(248,113,113,0.3)]';
            default: return 'bg-gray-400/20';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center bg-black/40 backdrop-blur-md border border-white/10 p-4 rounded-xl">
                <div>
                    <h2 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-6 h-6 text-cyan-400" />
                        SYSTEM INTEGRITY MONITOR
                    </h2>
                    <p className="text-xs text-gray-400 uppercase tracking-widest mt-1">
                        Live diagnostic telemetry from all active nodes
                    </p>
                </div>
                <div className="text-right">
                    <button
                        onClick={refreshHealth}
                        className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-all group"
                        disabled={loading}
                    >
                        <RefreshCcw className={`w-5 h-5 text-gray-400 group-hover:text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <p className="text-[10px] text-gray-500 mt-1">
                        LAST SCAN: {lastUpdated.toLocaleTimeString()}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Core API Node */}
                <HealthCard
                    title="CORE API NODE"
                    icon={<Zap className="w-5 h-5 text-yellow-400" />}
                    health={healthData.core}
                    loading={loading}
                />

                {/* Intelligence Engine Node */}
                <HealthCard
                    title="INTEL ENGINE"
                    icon={<Cpu className="w-5 h-5 text-purple-400" />}
                    health={healthData.intelligence}
                    loading={loading}
                />

                {/* Security Sentinel Node */}
                <HealthCard
                    title="SECURITY SENTINEL"
                    icon={<Activity className="w-5 h-5 text-red-500" />}
                    health={healthData.sentinel}
                    loading={loading}
                />
            </div>

            {/* Dependency Deep Dive */}
            <div className="bg-black/60 backdrop-blur-xl border border-white/5 rounded-2xl overflow-hidden shadow-2xl">
                <div className="bg-white/5 px-6 py-4 border-b border-white/10">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                        <Database className="w-4 h-4 text-cyan-400" />
                        DEPENDENCY SUBSYSTEMS
                    </h3>
                </div>
                <div className="p-6 grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <DependencyBadge label="COCKROACHDB" status={healthData.core?.dependencies?.database || 'UNKNOWN'} />
                    <DependencyBadge label="NATS JETSTREAM" status={healthData.core?.dependencies?.nats || 'UNKNOWN'} />
                    <DependencyBadge label="REDIS CACHE" status={healthData.core?.dependencies?.redis || 'UNKNOWN'} />
                    <DependencyBadge label="SPA-CY MODEL" status={healthData.intelligence?.dependencies?.nlp_model || 'UNKNOWN'} />
                </div>
            </div>
        </div>
    );
};

interface HealthCardProps {
    title: string;
    icon: React.ReactNode;
    health: ServiceHealth | null;
    loading: boolean;
}

const HealthCard: React.FC<HealthCardProps> = ({ title, icon, health, loading }) => {
    const status = health?.status || 'OFFLINE';

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-black/40 backdrop-blur-md border border-white/10 rounded-2xl p-6 relative overflow-hidden group"
        >
            <div className={`absolute top-0 right-0 w-24 h-24 blur-3xl rounded-full opacity-20 -mr-12 -mt-12 transition-all duration-500 ${status === 'OPERATIONAL' ? 'bg-green-400' : status === 'DEGRADED' ? 'bg-yellow-400' : 'bg-red-400'
                }`} />

            <div className="flex items-center justify-between mb-4">
                <div className="bg-white/5 p-2 rounded-lg">
                    {icon}
                </div>
                <div className={`text-[10px] font-bold px-2 py-1 rounded-full uppercase tracking-tighter shadow-sm ${status === 'OPERATIONAL' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                        status === 'DEGRADED' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                            'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                    {status}
                </div>
            </div>

            <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">{title}</h3>
            <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-white tracking-tighter tracking-tight uppercase">
                    {status === 'OPERATIONAL' ? 'Healthy' : status === 'DEGRADED' ? 'Warning' : 'Critical'}
                </span>
                {status === 'OPERATIONAL' && <CheckCircle className="w-4 h-4 text-green-400" />}
                {(status === 'DEGRADED' || status === 'OFFLINE') && <AlertTriangle className="w-4 h-4 text-yellow-400" />}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
                <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                    System Uptime: <span className="text-gray-400 font-mono">100%</span>
                </p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                    Latency: <span className="text-gray-400 font-mono">14ms</span>
                </p>
            </div>
        </motion.div>
    );
};

const DependencyBadge: React.FC<{ label: string; status: string }> = ({ label, status }) => {
    const isOperational = status === 'OPERATIONAL' || status === 'LOADED' || status === 'CONNECTED';
    return (
        <div className="flex flex-col gap-1">
            <span className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{label}</span>
            <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${isOperational ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400 animate-pulse'}`} />
                <span className={`text-[11px] font-bold ${isOperational ? 'text-gray-300' : 'text-red-400'}`}>
                    {status}
                </span>
            </div>
        </div>
    );
};

export default SystemHealth;
