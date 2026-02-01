import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { verifyAuth } from '../../../lib/auth-utils';
import { headers } from 'next/headers';

export async function GET(request: Request) {
    const headersList = await headers();
    const token = headersList.get('cookie')?.split('token=')[1]?.split(';')[0] || '';

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await verifyAuth(token);
    if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    try {
        const notifications = await prisma.notification.findMany({
            where: {
                userId: payload.id
            },
            orderBy: {
                createdAt: 'desc'
            },
            take: 20 // Limit to recent 20
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error('Error fetching notifications:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
