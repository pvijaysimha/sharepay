import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    // Middleware disabled for OAuth compatibility
    // Authentication is handled client-side via useSession
    return NextResponse.next();
}

export const config = {
    matcher: ['/dashboard/:path*'],
};

