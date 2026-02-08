import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { getServerSession } from 'next-auth';
import { authOptions } from './next-auth';
import { prisma } from '@repo/db';
import { headers } from 'next/headers';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key-for-dev';

export async function hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export function signToken(payload: object, expiresIn: string | number = '7d'): string {
    const options: SignOptions = { expiresIn: expiresIn as any };
    return jwt.sign(payload, JWT_SECRET, options);
}

export async function verifyAuth(token: string): Promise<any> {
    try {
        // Use the same library (jsonwebtoken) for both signing and verification
        const verified = jwt.verify(token, JWT_SECRET);
        console.log('DEBUG verifyAuth - verified payload:', verified);
        return verified;
    } catch (error) {
        console.error('verifyAuth error:', error);
        return null;
    }
}

// Unified auth function that checks NextAuth session first, then falls back to custom JWT
export async function getAuthUser(): Promise<{ id: string; email: string } | null> {
    // First, try NextAuth session (for OAuth users)
    try {
        const session = await getServerSession(authOptions);
        if (session?.user?.email) {
            const user = await prisma.user.findUnique({
                where: { email: session.user.email },
                select: { id: true, email: true }
            });
            if (user) {
                return user;
            }
        }
    } catch (error) {
        console.error('NextAuth session check error:', error);
    }

    // Fallback to custom JWT token (for email/password users)
    try {
        const headersList = await headers();
        const cookieHeader = headersList.get('cookie') || '';
        console.log('DEBUG getAuthUser - Cookie header:', cookieHeader);

        const token = cookieHeader.split('token=')[1]?.split(';')[0] || '';
        console.log('DEBUG getAuthUser - Token extracted:', token ? `${token.substring(0, 20)}...` : 'EMPTY');

        if (token) {
            const payload = await verifyAuth(token);
            console.log('DEBUG getAuthUser - JWT verify result:', payload);
            // Login API sets 'userId' in the JWT payload
            if (payload?.userId) {
                return { id: payload.userId as string, email: payload.email as string };
            }
        }
    } catch (error) {
        console.error('Custom JWT check error:', error);
    }

    return null;
}
