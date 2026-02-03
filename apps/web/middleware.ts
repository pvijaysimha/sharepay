import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAuth } from './lib/auth-utils';
import { getToken } from 'next-auth/jwt';

export async function middleware(request: NextRequest) {
    // 1. Check if the route is protected
    if (request.nextUrl.pathname.startsWith('/dashboard')) {
        const token = request.cookies.get('token')?.value;
        const payload = await verifyAuth(token || '');

        if (payload) {
            return NextResponse.next();
        }

        // Check for NextAuth session
        // Note: Requires NEXTAUTH_SECRET to be set in .env
        const isProduction = process.env.NODE_ENV === 'production';
        const session = await getToken({
            req: request,
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: isProduction,
            cookieName: isProduction
                ? '__Secure-next-auth.session-token'
                : 'next-auth.session-token',
        });
        console.log('[Middleware] Session token:', session ? 'Found' : 'Not found', 'isProduction:', isProduction);
        if (session) {
            return NextResponse.next();
        }

        return NextResponse.redirect(new URL('/auth/login', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};
