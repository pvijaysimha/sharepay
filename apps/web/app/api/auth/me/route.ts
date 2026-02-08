import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getAuthUser } from '../../../../lib/auth-utils';

export async function GET() {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const fullUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { id: true, name: true, email: true, avatarUrl: true }
        });

        if (!fullUser) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json({ user: fullUser });
    } catch (error) {
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
