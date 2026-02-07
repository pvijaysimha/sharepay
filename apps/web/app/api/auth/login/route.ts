import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { comparePassword, signToken } from '../../../../lib/auth-utils';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
        }

        // Case-insensitive email lookup
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });

        // Check if user exists and has a password (not social-only)
        if (!user || !user.password) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        const isValid = await comparePassword(password, user.password);
        if (!isValid) {
            return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
        }

        // Check if email is verified
        if (!user.emailVerified) {
            return NextResponse.json({
                error: 'Please verify your email before logging in.',
                needsVerification: true,
                email: user.email
            }, { status: 403 });
        }

        const token = signToken({ userId: user.id, email: user.email });

        const response = NextResponse.json({
            token,
            user: { id: user.id, name: user.name, email: user.email }
        });
        response.cookies.set('token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7, // 1 week
            path: '/',
        });

        return response;
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
