import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { hashPassword, signToken } from '../../../../lib/auth-utils';
import { sendVerificationEmail, generateVerificationToken, getVerificationTokenExpiry } from '../../../../lib/email';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, password } = body;

        if (!email || !password) {
            return NextResponse.json({ error: 'Missing email or password' }, { status: 400 });
        }

        // Case-insensitive email check
        const existingUser = await prisma.user.findFirst({
            where: {
                email: { equals: email, mode: 'insensitive' }
            }
        });
        if (existingUser) {
            return NextResponse.json({ error: 'User already exists' }, { status: 409 });
        }

        // Generate verification token
        const verificationToken = generateVerificationToken();
        const verificationTokenExpiry = getVerificationTokenExpiry();

        const hashedPassword = await hashPassword(password);
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(), // Store email in lowercase
                password: hashedPassword,
                verificationToken,
                verificationTokenExpiry,
            },
        });

        // Send verification email (don't fail signup if email fails)
        const emailResult = await sendVerificationEmail(email, verificationToken, name);
        if (!emailResult.success) {
            console.warn('Failed to send verification email:', emailResult.error);
        }

        const token = signToken({ userId: user.id, email: user.email });

        const response = NextResponse.json({
            token,
            user: { id: user.id, name: user.name, email: user.email },
            emailVerificationSent: emailResult.success,
            message: emailResult.success
                ? 'Account created! Please check your email to verify your account.'
                : 'Account created! Please verify your email to complete registration.'
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
        console.error('Signup error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
