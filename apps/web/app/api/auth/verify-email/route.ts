import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const token = searchParams.get('token');

        if (!token) {
            return NextResponse.json({ error: 'Missing verification token' }, { status: 400 });
        }

        // Find user with this token
        const user = await prisma.user.findFirst({
            where: {
                verificationToken: token,
                verificationTokenExpiry: {
                    gt: new Date() // Token not expired
                }
            }
        });

        if (!user) {
            return NextResponse.json({
                error: 'Invalid or expired verification token. Please request a new one.'
            }, { status: 400 });
        }

        // Mark email as verified
        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerified: new Date(),
                verificationToken: null,
                verificationTokenExpiry: null
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Email verified successfully'
        });

    } catch (error) {
        console.error('Email verification error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
