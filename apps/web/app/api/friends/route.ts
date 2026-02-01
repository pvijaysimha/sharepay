import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { verifyAuth } from '../../../lib/auth-utils';
import { cookies } from 'next/headers';

export async function GET(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const payload = await verifyAuth(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const friendships = await prisma.friendship.findMany({
            where: { userId: payload.userId },
            include: {
                friend: {
                    select: { id: true, name: true, email: true, avatarUrl: true }
                }
            }
        });

        // Flatten the structure: Return list of users who are friends
        const friends = friendships.map(f => f.friend);
        return NextResponse.json({ friends });
    } catch (error) {
        console.error('Error fetching friends:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(req: Request) {
    const cookieStore = await cookies();
    const token = cookieStore.get('token')?.value;
    const payload = await verifyAuth(token || '');

    if (!payload) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        if (email === payload.email) { // payload usually doesn't have email unless put there, checking self add
            // We need to fetch current user to know their email?
            // Or simpler: check if found user id === payload.userId
        }

        const friend = await prisma.user.findUnique({ where: { email } });

        if (!friend) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        if (friend.id === payload.userId) {
            return NextResponse.json({ error: 'You cannot add yourself' }, { status: 400 });
        }

        // Check if already friends
        const existing = await prisma.friendship.findUnique({
            where: {
                userId_friendId: {
                    userId: payload.userId,
                    friendId: friend.id,
                }
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Already friends' }, { status: 400 });
        }

        // Fetch current user details for notification
        const currentUser = await prisma.user.findUnique({
            where: { id: payload.userId },
            select: { name: true }
        });
        const currentUserName = currentUser?.name || 'Someone';

        // Create bidirectional friendship & Notification
        // Transaction to ensure both exist or neither
        await prisma.$transaction([
            prisma.friendship.create({
                data: {
                    userId: payload.userId,
                    friendId: friend.id,
                    status: 'ACCEPTED'
                }
            }),
            prisma.friendship.create({
                data: {
                    userId: friend.id,
                    friendId: payload.userId,
                    status: 'ACCEPTED'
                }
            }),
            prisma.notification.create({
                data: {
                    userId: friend.id,
                    type: 'FRIEND_ADD',
                    message: `${currentUserName} added you as a friend.`,
                    link: '/dashboard'
                }
            })
        ]);

        return NextResponse.json({ message: 'Friend added', friend: { id: friend.id, name: friend.name, email: friend.email } });

    } catch (error) {
        console.error('Error adding friend:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
