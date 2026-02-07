import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const APP_NAME = 'SharePay';
const FROM_EMAIL = process.env.FROM_EMAIL || 'onboarding@resend.dev'; // Use your verified domain in production

export async function sendVerificationEmail(
    email: string,
    token: string,
    name?: string
): Promise<{ success: boolean; error?: string }> {
    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
    const verificationUrl = `${baseUrl}/auth/verify-email?token=${token}`;

    try {
        const { data, error } = await resend.emails.send({
            from: `${APP_NAME} <${FROM_EMAIL}>`,
            to: email,
            subject: `Verify your ${APP_NAME} email`,
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
                            <h1 style="color: #4f46e5; font-size: 28px; margin: 0;">💰 ${APP_NAME}</h1>
                        </div>
                        
                        <h2 style="color: #111827; font-size: 24px; margin-bottom: 16px;">
                            Verify your email
                        </h2>
                        
                        <p style="color: #6b7280; font-size: 16px; line-height: 24px; margin-bottom: 24px;">
                            Hi${name ? ` ${name}` : ''},<br><br>
                            Thanks for signing up for ${APP_NAME}! Please verify your email address by clicking the button below.
                        </p>
                        
                        <div style="text-align: center; margin-bottom: 32px;">
                            <a href="${verificationUrl}" 
                               style="display: inline-block; background-color: #4f46e5; color: white; font-weight: 600; font-size: 16px; padding: 12px 32px; border-radius: 8px; text-decoration: none;">
                                Verify Email Address
                            </a>
                        </div>
                        
                        <p style="color: #9ca3af; font-size: 14px; margin-bottom: 16px;">
                            Or copy and paste this link into your browser:
                        </p>
                        <p style="color: #4f46e5; font-size: 14px; word-break: break-all; margin-bottom: 32px;">
                            ${verificationUrl}
                        </p>
                        
                        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
                        
                        <p style="color: #9ca3af; font-size: 12px; text-align: center;">
                            This link expires in 24 hours. If you didn't create an account, you can safely ignore this email.
                        </p>
                    </div>
                </body>
                </html>
            `,
        });

        if (error) {
            console.error('Email send error:', error);
            return { success: false, error: error.message };
        }

        console.log('Verification email sent:', data?.id);
        return { success: true };
    } catch (error) {
        console.error('Email service error:', error);
        return { success: false, error: 'Failed to send email' };
    }
}

export function generateVerificationToken(): string {
    // Generate a secure random token
    const array = new Uint8Array(32);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

export function getVerificationTokenExpiry(): Date {
    // Token expires in 24 hours
    return new Date(Date.now() + 24 * 60 * 60 * 1000);
}
