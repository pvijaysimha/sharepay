import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { generateVerificationToken, getVerificationTokenExpiry } from '../../../../lib/email';
import { Resend } from 'resend';

// Lazy Resend initialization
let resendClient: Resend | null = null;
function getResendClient(): Resend {
    if (!resendClient) {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY not set');
        }
        resendClient = new Resend(process.env.RESEND_API_KEY);
    }
    return resendClient;
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // Find user (case-insensitive)
        const user = await prisma.user.findFirst({
            where: { email: { equals: email, mode: 'insensitive' } }
        });

        // Always return success to prevent email enumeration attacks
        if (!user || !user.password) {
            // User doesn't exist or is OAuth-only
            return NextResponse.json({
                success: true,
                message: 'If your email is registered, you will receive a password reset email.'
            });
        }

        // Generate reset token
        const resetToken = generateVerificationToken();
        const resetExpiry = getVerificationTokenExpiry(); // 24 hours

        // Store token in database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                passwordResetToken: resetToken,
                passwordResetExpiry: resetExpiry
            }
        });

        // Send reset email
        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
        const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;
        const fromEmail = process.env.FROM_EMAIL || 'onboarding@resend.dev';

        const resend = getResendClient();
        await resend.emails.send({
            from: `SharePay <${fromEmail}>`,
            to: email,
            subject: 'Reset your SharePay password',
            html: `
                <!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                </head>
                <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
                    <div style="max-width: 480px; margin: 0 auto; background: white; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
                        <div style="text-align: center; margin-bottom: 32px;">
                            <h1 style="color: #4f46e5; font-size: 28px; margin: 0;">💰 SharePay</h1>
                        </div>
                        
                        <h2 style="color: #111827; font-size: 24px; margin-bottom: 16px;">
                            Reset your password
                        </h2>
                        
                        <p style="color: #6b7280; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                            Hi${user.name ? ` ${user.name}` : ''},<br><br>
                            We received a request to reset your password. Click the button below to create a new password.
                        </p>
                        
                        <div style="text-align: center; margin-bottom: 32px;">
                            <a href="${resetUrl}" 
                               style="display: inline-block; background-color: #4f46e5; color: white; font-weight: 600; font-size: 16px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
                                Reset Password
                            </a>
                        </div>
                        
                        <p style="color: #9ca3af; font-size: 14px; margin-bottom: 16px;">
                            Or copy and paste this link into your browser:
                        </p>
                        <p style="color: #4f46e5; font-size: 14px; word-break: break-all; margin-bottom: 32px;">
                            ${resetUrl}
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                        
                        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                            This link expires in 24 hours. If you didn't request a password reset, you can safely ignore this email.
                        </p>
                    </div>
                </body>
                </html>
            `,
        });

        return NextResponse.json({
            success: true,
            message: 'If your email is registered, you will receive a password reset email.'
        });

    } catch (error) {
        console.error('Forgot password error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
