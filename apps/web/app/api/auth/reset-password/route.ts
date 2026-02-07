import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { hashPassword } from '../../../../lib/auth-utils';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { token, password } = body;

        if (!token || !password) {
            return NextResponse.json({ error: 'Token and password are required' }, { status: 400 });
        }

        if (password.length < 6) {
            return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
        }

        // Find user with valid reset token
        const user = await prisma.user.findFirst({
            where: {
                passwordResetToken: token,
                passwordResetExpiry: {
                    gt: new Date() // Token not expired
                }
            }
        });

        if (!user) {
            return NextResponse.json({
                error: 'Invalid or expired reset token. Please request a new password reset.'
            }, { status: 400 });
        }

        // Hash new password and clear reset token
        const hashedPassword = await hashPassword(password);

        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                passwordResetToken: null,
                passwordResetExpiry: null
            }
        });

        return NextResponse.json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });

    } catch (error) {
        console.error('Reset password error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
