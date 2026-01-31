// API client for Core API
declare var process: any;
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

export interface Alert {
    id: string;
    user_id: string;
    status: string;
    priority_class: string;
    longitude: number;
    latitude: number;
    impact_radius_meters: number;
    alert_type: string;
    content_text: string | null;
    content_media_url: string | null;
    verification_count: number;
    created_at: string;
    updated_at: string;
    // UI mapping fields
    type: string;
    content: string;
    location: string;
    lga_name?: string;
    state_name?: string;
    location_source: 'GPS' | 'GOVERNANCE_OVERRIDE';
    severity: number;
    timestamp: string;
    isTrusted: boolean;
    isDuress?: boolean;
    isEncrypted?: boolean;
    source_device_id?: string;
}

// Helper to detect Base64 strings (simple heuristic)
function isBase64(str: string) {
    if (!str || str.length % 4 !== 0 || /[^A-Z0-9+\/=]/i.test(str)) {
        return false;
    }
    const firstPaddingChar = str.indexOf('=');
    return firstPaddingChar === -1 || firstPaddingChar === str.length - 1 || (firstPaddingChar === str.length - 2 && str[str.length - 1] === '=');
}

export async function fetchAlerts(): Promise<Alert[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/alerts`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            // If unauthorized, return empty but let the UI handle redirect via AuthContext
            if (response.status === 401) return [];
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const rawAlerts = (data || []) as any[];

        return rawAlerts.map(alert => ({
            ...alert,
            id: alert.id || '',
            latitude: Number(alert.latitude || 0),
            longitude: Number(alert.longitude || 0),
            type: alert.alert_type || 'Unknown',
            content: alert.content_text || 'No description available.',
            location: `${Number(alert.latitude || 0).toFixed(4)}, ${Number(alert.longitude || 0).toFixed(4)}`,
            timestamp: alert.created_at || new Date().toISOString(),
            isTrusted: (alert.verification_count || 0) > 0,
            severity: mapPriorityToSeverity(alert.priority_class || 'LOW'),
            lga_name: alert.lga_name,
            state_name: alert.state_name,
            location_source: alert.location_source as 'GPS' | 'GOVERNANCE_OVERRIDE',
            isEncrypted: isBase64(alert.content_text || '') && (alert.content_text || '').length > 30 && !(alert.content_text || '').includes(' ')
        }));
    } catch (error) {
        console.error('Failed to fetch alerts:', error);
        return [];
    }
}

function mapPriorityToSeverity(priority: string): number {
    switch (priority) {
        case 'CRITICAL': return 1.0;
        case 'HIGH': return 0.8;
        case 'MEDIUM': return 0.5;
        case 'LOW': return 0.2;
        default: return 0.1;
    }
}

export interface SystemStatus {
    total_users?: number;
    active_alerts?: number;
    critical_alerts?: number;
    // UI state fields
    isAuthenticated?: boolean;
    isEncrypted?: boolean;
    trustedDevices?: number;
    systemIntegrity?: number;
}

export async function fetchSystemStatus(): Promise<SystemStatus | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/system/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch system stats:', error);
        return null;
    }
}

export interface SecurityScan {
    id: string;
    scan_time: string;
    target_service: string;
    status: string;
    findings: any[];
    meta_data: any;
}

export async function fetchSecurityScans(page: number = 1, limit: number = 10): Promise<SecurityScan[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/system/security-scans?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch security scans:', error);
        return [];
    }
}

export interface SectorReport {
    sector_id: string;
    timestamp: string;
    total_alerts: number;
    critical_threats: number;
    routine_alerts: number;
    system_integrity: number;
    trust_score_avg: number;
    threat_level: string;
    last_incident_type: string;
}

export interface Asset {
    id: string;
    agency_id: string;
    name: string;
    type: string;
    latitude: number;
    longitude: number;
    status: string;
    description?: string;
    call_sign?: string;
    capacity_level: number;
}

export interface TriangulatedAsset {
    asset: Asset;
    distance_meters: number;
    suitability_score: number;
}

export async function fetchTriangulatedAssets(alertId: string): Promise<TriangulatedAsset[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/triangulation`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch triangulated assets:', error);
        return [];
    }
}

export async function fetchSectorReport(): Promise<SectorReport | null> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/system/reports/sector`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch sector report:', error);
        return null;
    }
}

export async function dispatchAsset(assetId: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/assets/${assetId}/dispatch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to dispatch asset:', error);
        return false;
    }
}

export async function verifyAlert(alertId: string): Promise<boolean> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to verify alert:', error);
        return false;
    }
}

export async function fetchAssets(): Promise<Asset[]> {
    try {
        const response = await fetch(`${API_BASE_URL}/api/v1/assets`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return [];
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch assets:', error);
        return [];
    }
}

// Stats Helpers for Dashboards
export function getIncidentTrends(alerts: any[]) {
    // Group alerts by hour (last 12 hours)
    const trends = new Array(12).fill(0);
    const now = new Date();

    alerts.forEach(alert => {
        const alertDate = new Date(alert.timestamp || alert.created_at);
        const hoursAgo = Math.floor((now.getTime() - alertDate.getTime()) / (1000 * 60 * 60));
        if (hoursAgo >= 0 && hoursAgo < 12) {
            trends[11 - hoursAgo] += 1;
        }
    });

    // Normalize to percentage for bar heights (max 100%)
    const max = Math.max(...trends, 1);
    return trends.map(v => (v / max) * 100);
}

export function getThreatDistribution(alerts: any[]) {
    const counts: Record<string, number> = {};
    alerts.forEach(alert => {
        const type = alert.type || alert.alert_type || 'Unknown';
        counts[type] = (counts[type] || 0) + 1;
    });

    const total = alerts.length || 1;
    return Object.entries(counts).map(([name, value]) => ({
        name,
        percentage: (value / total) * 100
    }));
}
