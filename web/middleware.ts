import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession, Session } from './lib/auth'

// Helper to format logs as JSON
function logAccess(
    req: NextRequest,
    status: 'authenticated' | 'unauthenticated' | 'public_access' | 'redirect_login' | 'redirect_home',
    session?: Session | null
) {
    const logEntry = {
        timestamp: new Date().toISOString(),
        ip: req.headers.get('x-forwarded-for') || req.ip || 'unknown',
        method: req.method,
        path: req.nextUrl.pathname,
        status: status,
        user_id: session?.user || 'anonymous',
        role: session?.role || 'guest',
        user_agent: req.headers.get('user-agent') || 'unknown',
    };
    // Console.error is used here because Next.js/Docker stdout can be buffered/suppressed.
    // Stderr ensures the logs are immediately visible in 'docker logs'.
    console.error(JSON.stringify(logEntry));
}

export async function middleware(request: NextRequest) {
    const authToken = request.cookies.get('auth_token')?.value
    const session = await verifySession(authToken || '')

    const { pathname } = request.nextUrl;

    // 1. Define public paths
    const isPublicPath = pathname === '/login' || pathname === '/request-access'

    // 2. Handle protected routes
    const response = NextResponse.next()

    if (session) {
        if (isPublicPath) {
            logAccess(request, 'redirect_home', session);
            return NextResponse.redirect(new URL('/', request.url))
        }

        // 3. Edge-based Role Protection

        // Root Dashboard Protection
        if (pathname === '/') {
            const dashboardRoles = ['ADMIN', 'CYBER_ANALYST', 'STRATEGIC_PLANNER', 'TACTICAL_COMMAND', 'SYSTEM_ADMIN', 'SECURITY_OFFICER'];

            // Redirect Agency Officers to their portal
            if (session.role === 'AGENCY_OFFICER') {
                logAccess(request, 'redirect_home', session);
                return NextResponse.redirect(new URL('/agency/portal', request.url));
            }

            // Block Guests / Unauthorized Roles
            if (!session.role || !dashboardRoles.includes(session.role)) {
                logAccess(request, 'redirect_login', session);
                return NextResponse.redirect(new URL('/login', request.url));
            }
        }

        // Protecting Agency Portal from non-authorized roles
        if (pathname.startsWith('/agency/portal')) {
            const authorizedRoles = ['ADMIN', 'AGENCY_OFFICER'];
            if (!session.role || !authorizedRoles.includes(session.role)) {
                logAccess(request, 'redirect_home', session); // Unauthorized role attempt
                return NextResponse.redirect(new URL('/', request.url))
            }
        }

        // Log successful authenticated access
        logAccess(request, 'authenticated', session);

        response.headers.set('X-Security-Status', 'Authenticated')
        response.headers.set('X-User-Role', session.role)
    } else {
        if (!isPublicPath) {
            logAccess(request, 'redirect_login', null);
            return NextResponse.redirect(new URL('/login', request.url))
        }

        // Log public access (e.g., login page)
        logAccess(request, 'public_access', null);

        response.headers.set('X-Security-Status', 'Unauthenticated')
    }

    return response
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
}
