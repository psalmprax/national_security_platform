import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifySession } from './lib/auth'

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
            return NextResponse.redirect(new URL('/', request.url))
        }
        response.headers.set('X-Security-Status', 'Authenticated')
        response.headers.set('X-User-Role', session.role)
    } else {
        if (!isPublicPath) {
            return NextResponse.redirect(new URL('/login', request.url))
        }
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
