import React from 'react';
import { Database } from 'lucide-react';
import { Alert, SystemStatus } from '../../../lib/api';

interface CyberAuditLogProps {
    alerts: Alert[];
    securityStatus: SystemStatus;
    isAlertRedacted: (alert: Alert | null) => boolean;
}

export default function CyberAuditLog({
    alerts,
    securityStatus,
    isAlertRedacted
}: CyberAuditLogProps) {
    return (
        <div className="w-full h-full overflow-y-auto scrollbar-cyber pointer-events-auto">
            <div className="w-full max-w-6xl mx-auto p-8">
                <h2 className="text-2xl font-black tracking-wider text-white mb-6 uppercase">Audit Logs & Data</h2>
                <div className="glass-card p-8 border border-white/5">
                    <div className="flex items-center gap-3 mb-6">
                        <Database className="w-6 h-6 text-[#00FF95]" />
                        <h3 className="text-white font-bold text-lg">System Database Access</h3>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-white/5 p-4 rounded border border-white/10 font-mono text-sm">
                            <p className="text-white/60">Total Alerts Logged: <span className="text-[#00FF95] font-bold">{(alerts || []).length}</span></p>
                            <p className="text-white/60">Trusted Devices: <span className="text-[#00FF95] font-bold">{securityStatus.trustedDevices}</span></p>
                            <p className="text-white/60">Security Status: <span className="text-[#00FF95] font-bold">ENCRYPTED</span></p>
                        </div>
                        <div className="overflow-x-auto scrollbar-cyber rounded border border-white/10">
                            <table className="w-full text-left text-sm text-white/70">
                                <thead className="bg-white/5 uppercase text-xs font-bold text-white/50">
                                    <tr>
                                        <th className="px-4 py-3">Timestamp</th>
                                        <th className="px-4 py-3">Event ID</th>
                                        <th className="px-4 py-3">Type</th>
                                        <th className="px-4 py-3">Location</th>
                                        <th className="px-4 py-3">Integrity</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 font-mono">
                                    {(alerts || []).map((alert) => {
                                        const redacted = isAlertRedacted(alert);
                                        return (
                                            <tr key={alert.id} className={`hover:bg-white/5 transition-colors ${redacted ? 'bg-red-500/5' : ''}`}>
                                                <td className="px-4 py-2">{new Date(alert.timestamp).toISOString()}</td>
                                                <td className="px-4 py-2 text-[#00FF95]">{alert.id.substring(0, 8)}...</td>
                                                <td className="px-4 py-2">
                                                    {redacted ? (
                                                        <span className="text-red-500 font-bold opacity-50">[CLASSIFIED_VECTOR]</span>
                                                    ) : (
                                                        alert.type
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {redacted ? (
                                                        <span className="text-red-500/40 italic text-[10px]">COORDS_MASKED_BY_PROTOCOL</span>
                                                    ) : (
                                                        alert.location
                                                    )}
                                                </td>
                                                <td className="px-4 py-2">
                                                    {alert.isTrusted ? (
                                                        <span className="text-[#00FF95] text-xs px-2 py-0.5 rounded bg-[#00FF95]/10 border border-[#00FF95]/20">VERIFIED</span>
                                                    ) : (
                                                        <span className="text-orange-400 text-xs px-2 py-0.5 rounded bg-orange-400/10 border border-orange-400/20">UNVERIFIED</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                            {(alerts || []).length === 0 && (
                                <div className="p-8 text-center text-white/30 italic">No audit records found.</div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
