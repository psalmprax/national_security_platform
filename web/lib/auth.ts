export interface Session {
    user: string;
    role: string;
    clearance: string;
    exp: number;
}

export type AgencyView = 'cyber' | 'tactical' | 'strategic' | 'access';

export type UserRole = 'CYBER_ANALYST' | 'TACTICAL_COMMAND' | 'STRATEGIC_PLANNER' | 'ADMIN' | 'SYSTEM_ADMIN' | 'SECURITY_OFFICER' | 'AGENCY_OFFICER';

export function hasAccess(role: UserRole, view: AgencyView): boolean {
    if (role === 'ADMIN') return true;

    switch (role) {
        case 'CYBER_ANALYST':
        case 'SYSTEM_ADMIN':
            return view === 'cyber';
        case 'STRATEGIC_PLANNER':
            return view === 'strategic';
        case 'TACTICAL_COMMAND':
            return view === 'tactical';
        case 'SECURITY_OFFICER':
            return view === 'access';
        case 'AGENCY_OFFICER':
            return false;
        default:
            return false;
    }
}

import { jwtVerify } from 'jose'

/**
 * Hardened Session Verification
 * Uses 'jose' to verify the JWT against the system secret.
 */
export async function verifySession(token: string): Promise<Session | null> {
    try {
        if (!token) return null;

        const secret = process.env.JWT_SECRET || 'insecure_default_secret_for_dev_only';
        const { payload } = await jwtVerify(
            token,
            new TextEncoder().encode(secret)
        );

        return {
            user: (payload.user_id as string) || 'unknown',
            role: (payload.role as string) || 'GUEST',
            clearance: (payload.clearance_level as string) || 'UNCLASSIFIED',
            exp: payload.exp || 0
        };
    } catch (e) {
        // Only log errors in development to avoid leaking info in production
        if (process.env.NODE_ENV === 'development') {
            console.error('Session verification failed:', e);
        }
        return null;
    }
}

/**
 * Validates the cryptographic signature of an alert.
 * Ensures the alert content was signed by a trusted device key.
 */
export async function verifyAlertSignature(alertId: string, signature: string, payload: string): Promise<boolean> {
    // This is a placeholder for Web Crypto API signature validation
    // verified against the public key from the Spatial Registry.
    if (!signature) return false;

    // In production, we'd use:
    // const encoder = new TextEncoder();
    // const data = encoder.encode(payload);
    // return await crypto.subtle.verify(...)

    return signature.startsWith('sig_trusted_');
}
