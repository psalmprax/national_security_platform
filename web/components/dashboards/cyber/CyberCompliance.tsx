import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { SecurityScan } from '../../../lib/api';

interface CyberComplianceProps {
    securityScans: SecurityScan[];
    currentTheme: {
        primary: string;
        secondary: string;
        glow: string;
        text: string;
    };
    currentPage: number;
    setCurrentPage: (page: number) => void;
    itemsPerPage: number;
}

export default function CyberCompliance({
    securityScans,
    currentTheme,
    currentPage,
    setCurrentPage,
    itemsPerPage
}: CyberComplianceProps) {
    return (
        <div className="w-full h-full overflow-y-auto scrollbar-cyber">
            <div className="w-full max-w-6xl mx-auto p-8">
                <h2 className="text-2xl font-black tracking-wider text-white mb-6 uppercase">Security Compliance</h2>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    <div className="space-y-8">
                        <div className="glass-card p-6 border border-white/5 bg-white/[0.01]">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Vulnerability Scans</h3>
                            <div className="space-y-3">
                                {(securityScans || []).length === 0 ? (
                                    <p className="text-white/20 text-xs italic">No scan history available.</p>
                                ) : (
                                    (securityScans || []).slice(0, 5).map((scan) => (
                                        <div key={scan.id} className="flex items-center justify-between p-3 rounded bg-black/40 border border-white/5">
                                            <div>
                                                <p className="text-xs text-white/80 font-bold uppercase">{scan.target_service}</p>
                                                <p className="text-[10px] text-white/40 font-mono mt-0.5">{new Date(scan.scan_time).toLocaleString()}</p>
                                            </div>
                                            <span className={`text-[9px] font-black px-2 py-1 rounded`} style={{ backgroundColor: scan.status === 'PASSED' ? currentTheme.primary + '33' : 'rgba(239, 68, 68, 0.2)', color: scan.status === 'PASSED' ? currentTheme.primary : 'rgb(239, 68, 68)' }}>
                                                {scan.status}
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <div className="glass-card p-6 border border-white/5 bg-white/[0.01]">
                            <h3 className="text-white font-bold text-sm uppercase tracking-wider mb-4 border-b border-white/5 pb-2">Active Hardening (GuardDog)</h3>
                            <div className="space-y-3">
                                {[
                                    { name: 'JWT Secret Hardening', status: 'Fail-Closed Active' },
                                    { name: 'CORS Strict Mode', status: 'Authorized Origins Only' },
                                    { name: 'RBAC Enforcement', status: 'Global Active' },
                                    { name: 'HSTS/CSP Headers', status: 'Enforced' }
                                ].map((item, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs py-1">
                                        <span className="text-white/60">{item.name}</span>
                                        <span className="font-mono font-bold tracking-tight" style={{ color: currentTheme.primary }}>{item.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="glass-card border border-white/5 overflow-hidden">
                        <div className="bg-white/5 px-6 py-3 border-b border-white/5">
                            <h3 className="text-white text-xs font-black uppercase tracking-widest">Sentinel Audit Ledger</h3>
                        </div>
                        <div className="overflow-x-auto scrollbar-cyber">
                            <table className="w-full text-left font-mono text-xs">
                                <thead>
                                    <tr className="bg-white/[0.02] text-white/30 text-[10px] uppercase">
                                        <th className="px-6 py-3">Scan ID</th>
                                        <th className="px-6 py-3">Timestamp</th>
                                        <th className="px-6 py-3">Findings</th>
                                        <th className="px-6 py-3 text-right">Integrity Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5 text-white/70">
                                    {(securityScans || []).map((scan) => (
                                        <tr key={scan.id} className="hover:bg-white/[0.02] transition-colors">
                                            <td className="px-6 py-3" style={{ color: currentTheme.primary }}>{scan.id.substring(0, 8)}</td>
                                            <td className="px-6 py-3">{new Date(scan.scan_time).toISOString()}</td>
                                            <td className="px-6 py-3">
                                                {(scan.findings || []).length > 0 ? (
                                                    <span className="text-red-400">{(scan.findings || []).length} issue(s) detected</span>
                                                ) : (
                                                    <span style={{ color: currentTheme.primary + '99' }}>Nominal - No issues detected</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-3 text-right font-black">
                                                <span className={scan.status === 'PASSED' ? '' : 'text-red-500'} style={scan.status === 'PASSED' ? { color: currentTheme.primary } : {}}>{scan.status}</span>
                                            </td>
                                        </tr>
                                    ))}
                                    {(securityScans || []).length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-6 py-8 text-center text-white/20 italic">No audit records available in the secure buffer.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="bg-white/5 px-6 py-4 border-t border-white/5 flex items-center justify-between">
                            <div className="text-[10px] text-white/40 font-mono uppercase tracking-widest">
                                Page {currentPage} • Ledger Buffer
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(currentPage + 1)}
                                    disabled={(securityScans || []).length < itemsPerPage}
                                    className="px-4 py-1.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold uppercase tracking-widest hover:bg-white/10 transition-all"
                                    style={{ '&:hover': { backgroundColor: currentTheme.primary + '1a', borderColor: currentTheme.primary + '4d', color: currentTheme.primary } } as any}
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
