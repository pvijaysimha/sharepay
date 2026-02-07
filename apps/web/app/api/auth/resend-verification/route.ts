import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { sendVerificationEmail, generateVerificationToken, getVerificationTokenExpiry } from '../../../../lib/email';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find user
        const user = await prisma.user.findUnique({
            where: { email }
        });

        if (!user) {
            // Don't reveal if user exists or not for security
            return NextResponse.json({
                success: true,
                message: 'If your email is registered, you will receive a verification email.'
            });
        }

        if (user.emailVerified) {
            return NextResponse.json({
                error: 'Email is already verified'
            }, { status: 400 });
        }

        // Generate new token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = getVerificationTokenExpiry();

        // Update user with new token
        await prisma.user.update({
            where: { id: user.id },
            data: {
                verificationToken,
                verificationTokenExpiry
            }
        });

        // Send verification email
        const result = await sendVerificationEmail(email, verificationToken, user.name || undefined);

        if (!result.success) {
            console.error('Failed to send verification email:', result.error);
            return NextResponse.json({
                error: 'Failed to send verification email. Please try again later.'
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            message: 'Verification email sent! Please check your inbox.'
        });

    } catch (error) {
        console.error('Resend verification error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
