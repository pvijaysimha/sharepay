import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { verifyAuth } from '../../../../lib/auth-utils';
import { headers } from 'next/headers';

export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const headersList = await headers();
    const token = headersList.get('cookie')?.split('token=')[1]?.split(';')[0] || '';

    if (!token) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const payload = await verifyAuth(token);
    if (!payload) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    try {
        const notification = await prisma.notification.update({
            where: {
                id: id,
                userId: payload.id // Ensure ownership
            },
            data: {
                isRead: true
            }
        });

        return NextResponse.json(notification);
    } catch (error) {
        console.error('Error updating notification:', error);
        return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }
}
