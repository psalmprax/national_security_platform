// API client for Core API
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || '';

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
    severity: number;
    timestamp: string;
    isTrusted: boolean;
    isDuress?: boolean;
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const rawAlerts = (data || []) as any[];

        return rawAlerts.map(alert => ({
            ...alert,
            latitude: Number(alert.latitude),
            longitude: Number(alert.longitude),
            type: alert.alert_type || 'Unknown',
            content: alert.content_text || 'No description available.',
            location: `${Number(alert.latitude || 0).toFixed(2)}, ${Number(alert.longitude || 0).toFixed(2)}`,
            timestamp: alert.created_at,
            isTrusted: alert.verification_count > 0,
            severity: mapPriorityToSeverity(alert.priority_class)
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
    total_users: number;
    active_alerts: number;
    critical_alerts: number;
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
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error('Failed to fetch system stats:', error);
        return null;
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
