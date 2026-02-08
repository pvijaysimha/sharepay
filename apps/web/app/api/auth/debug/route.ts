import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

export async function GET() {
    try {
        const headersList = await headers();
        const cookieHeader = headersList.get('cookie') || '';
        const authHeader = headersList.get('authorization') || '';

        // Extract token from cookie
        const cookieToken = cookieHeader.split('token=')[1]?.split(';')[0] || '';

        // Extract token from Authorization header
        const bearerToken = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : '';

        // Try to verify cookie token
        let cookieVerifyResult = null;
        let cookieVerifyError = null;
        if (cookieToken) {
            try {
                cookieVerifyResult = jwt.verify(cookieToken, JWT_SECRET);
            } catch (e: any) {
                cookieVerifyError = e.message;
            }
        }

        // Try to verify bearer token
        let bearerVerifyResult = null;
        let bearerVerifyError = null;
        if (bearerToken) {
            try {
                bearerVerifyResult = jwt.verify(bearerToken, JWT_SECRET);
            } catch (e: any) {
                bearerVerifyError = e.message;
            }
        }

        return NextResponse.json({
            debug: {
                jwtSecretSet: !!process.env.JWT_SECRET,
                jwtSecretLength: JWT_SECRET.length,
                cookieHeader: cookieHeader ? `${cookieHeader.substring(0, 50)}...` : 'EMPTY',
                cookieTokenFound: !!cookieToken,
                cookieTokenLength: cookieToken.length,
                cookieVerifyResult,
                cookieVerifyError,
                authHeader: authHeader ? `${authHeader.substring(0, 30)}...` : 'EMPTY',
                bearerTokenFound: !!bearerToken,
                bearerTokenLength: bearerToken.length,
                bearerVerifyResult,
                bearerVerifyError,
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token } = body;

        if (!token) {
            return NextResponse.json({ error: 'No token provided' }, { status: 400 });
        }

        let verifyResult = null;
        let verifyError = null;
        try {
            verifyResult = jwt.verify(token, JWT_SECRET);
        } catch (e: any) {
            verifyError = e.message;
        }

        return NextResponse.json({
            debug: {
                jwtSecretSet: !!process.env.JWT_SECRET,
                jwtSecretLength: JWT_SECRET.length,
                tokenLength: token.length,
                verifyResult,
                verifyError,
            }
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
