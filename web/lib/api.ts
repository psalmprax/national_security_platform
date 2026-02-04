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
    classification_level?: string;
}

// Helper to get CSRF token from double-submit cookie
function getCsrfToken(): string {
    if (typeof document === 'undefined') return '';
    const name = 'csrf_token=';
    const decodedCookie = decodeURIComponent(document.cookie);
    const ca = decodedCookie.split(';');
    for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
            return c.substring(name.length, c.length);
        }
    }
    return '';
}

/**
 * Standardized Fetch Wrapper for the Core API
 * Automatically injecting CSRF tokens and ensuring credentials for RBAC.
 */
async function apiFetch(endpoint: string, options: RequestInit = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;

    const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Inject CSRF token for state-mutating methods
    if (options.method && !['GET', 'HEAD', 'OPTIONS'].includes(options.method.toUpperCase())) {
        (headers as any)['X-CSRF-Token'] = getCsrfToken();
    }

    return fetch(url, {
        ...options,
        headers,
        credentials: 'include', // Essential for sending HttpOnly auth cookies
    });
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
        const response = await apiFetch(`${API_BASE_URL}/api/v1/alerts`, {
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
            isEncrypted: isBase64(alert.content_text || '') && (alert.content_text || '').length > 30 && !(alert.content_text || '').includes(' '),
            classification_level: alert.classification_level
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
        const response = await apiFetch(`${API_BASE_URL}/api/v1/system/status`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        return (await response.json()) || null;
    } catch (error) {
        console.error('Failed to fetch system stats:', error);
        return null;
    }
}

export interface State {
    id: string;
    name: string;
    capital_city?: string;
    created_at: string;
    updated_at: string;
}

export interface LGA {
    id: string;
    state_id: string;
    name: string;
    created_at: string;
    updated_at: string;
}

export interface Village {
    id: string;
    lga_id: string;
    name: string;
    population_est?: number;
    created_at: string;
    updated_at: string;
}

export interface Corroboration {
    id: string;
    alert_id: string;
    verifier_id: string;
    confidence_score: number;
    comments?: string;
    is_coerced_report: boolean;
    created_at: string;
    updated_at: string;
}

export interface MediaAttachment {
    id: string;
    alert_id: string;
    storage_path: string;
    content_hash_sha256: string;
    mime_type?: string;
    file_size_bytes?: number;
    is_encrypted: boolean;
    created_at: string;
    updated_at: string;
}

export interface SecurityScan {
    id: string;
    scan_time: string;
    target_service: string;
    status: string;
    findings: any[];
    meta_data: any;
    updated_at: string;
    created_at: string;
}

export async function fetchSecurityScans(page: number = 1, limit: number = 10): Promise<SecurityScan[]> {
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/v1/system/security-scans?page=${page}&limit=${limit}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return [];
        }

        return (await response.json()) || [];
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
    updated_at: string;
    created_at: string;
}

export interface TriangulatedAsset {
    asset: Asset;
    distance_meters: number;
    suitability_score: number;
}

export interface Mission {
    id: string;
    alert_id: string;
    asset_id: string;
    commander_id: string;
    status: 'ASSIGNED' | 'EN_ROUTE' | 'ON_SITE' | 'COMPLETED' | 'ABORTED';
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'IMMEDIATE';
    eta_minutes?: number;
    dispatch_time: string;
    arrival_time?: string;
    completion_time?: string;
    created_at: string;
    updated_at: string;
}

export async function fetchTriangulatedAssets(alertId: string): Promise<TriangulatedAsset[]> {
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/triangulation`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return [];
        }

        return (await response.json()) || [];
    } catch (error) {
        console.error('Failed to fetch triangulated assets:', error);
        return [];
    }
}

export async function fetchSectorReport(): Promise<SectorReport | null> {
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/v1/system/reports/sector`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            return null;
        }

        return (await response.json()) || null;
    } catch (error) {
        console.error('Failed to fetch sector report:', error);
        return null;
    }
}

export async function dispatchAsset(assetId: string): Promise<boolean> {
    try {
        const response = await apiFetch(`${API_BASE_URL}/api/v1/assets/${assetId}/dispatch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCsrfToken()
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
        const response = await apiFetch(`${API_BASE_URL}/api/v1/alerts/${alertId}/verify`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-Token': getCsrfToken()
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
        const response = await apiFetch(`/api/v1/assets`);

        if (!response.ok) {
            return [];
        }

        return (await response.json()) || [];
    } catch (error) {
        console.error('Failed to fetch assets:', error);
        return [];
    }
}

export async function fetchActiveMissions(): Promise<Mission[]> {
    try {
        const response = await apiFetch(`/api/v1/missions/active`);

        if (!response.ok) {
            return [];
        }

        return (await response.json()) || [];
    } catch (error) {
        console.error('Failed to fetch active missions:', error);
        return [];
    }
}

export async function createMission(alertId: string, assetId: string, priority: string = 'MEDIUM'): Promise<Mission | null> {
    try {
        const response = await apiFetch(`/api/v1/missions`, {
            method: 'POST',
            body: JSON.stringify({
                alert_id: alertId,
                asset_id: assetId,
                priority: priority,
            }),
        });

        if (!response.ok) {
            return null;
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to create mission:', error);
        return null;
    }
}

export async function updateMissionStatus(missionId: string, status: string): Promise<boolean> {
    try {
        const response = await apiFetch(`/api/v1/missions/${missionId}/status`, {
            method: 'PATCH',
            body: JSON.stringify({ status }),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to update mission status:', error);
        return false;
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

// Phase 1 Features: Public Alerts, Safety Scores, Anonymous Tips

export interface PublicAlert {
    id: string;
    title: string;
    message: string;
    alert_level: string;
    location: {
        latitude: number;
        longitude: number;
    };
    radius_meters: number;
    affected_count: number;
    created_at: string;
    expires_at: string;
}

export async function createPublicAlert(alert: Partial<PublicAlert>): Promise<PublicAlert | null> {
    try {
        const response = await apiFetch(`/api/v1/public-alerts`, {
            method: 'POST',
            body: JSON.stringify(alert),
        });

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Failed to create public alert:', error);
        return null;
    }
}

export interface SafetyScore {
    lga_code: string;
    lga_name: string;
    state_code: string;
    state_name: string;
    incident_count: number;
    avg_severity: number;
    recent_incidents: number;
    resolved_count: number;
    safety_score: number;
    trend_pct: number;
    risk_level: 'very_safe' | 'safe' | 'moderate_risk' | 'high_risk' | 'critical_risk';
    resolution_rate_pct: number;
    updated_at: string;
}

export async function fetchSafetyScores(riskLevel?: string): Promise<SafetyScore[]> {
    try {
        const urlPath = riskLevel ? `/api/v1/analytics/safety-scores?risk_level=${riskLevel}` : `/api/v1/analytics/safety-scores`;
        const response = await apiFetch(urlPath);

        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch safety scores:', error);
        return [];
    }
}

export async function fetchSafetyScoresSummary(): Promise<any> {
    try {
        const response = await apiFetch(`/api/v1/analytics/safety-scores/summary`);

        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch safety score summary:', error);
        return null;
    }
}

export interface AnonymousTip {
    id: string;
    tip_content: string;
    threat_type: string;
    location_description?: string;
    media_urls?: string[];
    verification_status: 'pending' | 'verified' | 'rejected';
    created_at: string;
    updated_at: string;
}

export async function fetchAnonymousTips(): Promise<AnonymousTip[]> {
    try {
        const response = await apiFetch(`/api/v1/tips`);

        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch tips:', error);
        return [];
    }
}

export async function verifyTip(tipId: string, status: 'verified' | 'rejected'): Promise<boolean> {
    try {
        const response = await apiFetch(`/api/v1/tips/${tipId}/verify`, {
            method: 'POST',
            body: JSON.stringify({ status }),
        });

        return response.ok;
    } catch (error) {
        console.error('Failed to verify tip:', error);
        return false;
    }
}

export async function getMediaAccessURL(key: string, bucket: string = 'national-security-evidence'): Promise<string | null> {
    try {
        const response = await apiFetch(`/api/v1/media/access?key=${encodeURIComponent(key)}&bucket=${encodeURIComponent(bucket)}`);

        if (!response.ok) return null;
        const data = await response.json();
        return data.url;
    } catch (error) {
        console.error('Failed to get media access URL:', error);
        return null;
    }
}

// Admin API
export interface AuditEntry {
    id: string;
    timestamp: string;
    actor: string;
    action: string;
    target: string;
    from: string;
    to: string;
    details: string;
}

export interface Role {
    id: string;
    name: string;
    permissions: string[];
}

export interface Permission {
    id: string;
    name: string;
    description: string;
}

export async function fetchAuditLogs(): Promise<AuditEntry[]> {
    try {
        const response = await apiFetch('/api/v1/admin/audit-logs');
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch audit logs:', error);
        return [];
    }
}

export async function fetchRoles(): Promise<Role[]> {
    try {
        const response = await apiFetch('/api/v1/admin/roles');
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch roles:', error);
        return [];
    }
}

export async function fetchPermissions(): Promise<Permission[]> {
    try {
        const response = await apiFetch('/api/v1/admin/permissions');
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch permissions:', error);
        return [];
    }
}

export async function fetchAllUsers(): Promise<any[]> {
    try {
        const response = await apiFetch('/api/v1/admin/users');
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error('Failed to fetch all users:', error);
        return [];
    }
}

export async function updateUserClearance(userId: string, level: string): Promise<boolean> {
    try {
        const response = await apiFetch(`/api/v1/admin/users/${userId}/clearance`, {
            method: 'POST',
            body: JSON.stringify({ level })
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to update user clearance:', error);
        return false;
    }
}

export async function createRole(name: string, permissions: string[]): Promise<Role | null> {
    try {
        const response = await apiFetch('/api/v1/admin/roles', {
            method: 'POST',
            body: JSON.stringify({ name, permissions }),
        });
        if (!response.ok) return null;
        return await response.json();
    } catch (error) {
        console.error('Failed to create role:', error);
        return null;
    }
}

export async function updateAlertClassification(alertId: string, level: string): Promise<boolean> {
    try {
        const response = await apiFetch(`/api/v1/admin/alerts/${alertId}/classify`, {
            method: 'POST',
            body: JSON.stringify({ level })
        });
        return response.ok;
    } catch (error) {
        console.error('Failed to update alert classification:', error);
        return false;
    }
}
