import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getAuthUser } from '../../../lib/auth-utils';

export async function GET(req: Request) {
    const user = await getAuthUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const friendships = await prisma.friendship.findMany({
            where: { userId: user.id },
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
    const user = await getAuthUser();

    if (!user) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    try {
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const friend = await prisma.user.findFirst({
            where: {
                email: {
                    equals: email,
                    mode: 'insensitive'
                }
            }
        });

        if (!friend) {
            return NextResponse.json({ error: 'User not found. They need to sign up first.' }, { status: 404 });
        }

        if (friend.id === user.id) {
            return NextResponse.json({ error: 'You cannot add yourself' }, { status: 400 });
        }

        // Check if already friends
        const existing = await prisma.friendship.findUnique({
            where: {
                userId_friendId: {
                    userId: user.id,
                    friendId: friend.id,
                }
            }
        });

        if (existing) {
            return NextResponse.json({ error: 'Already friends' }, { status: 400 });
        }

        // Fetch current user details for notification
        const currentUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { name: true }
        });
        const currentUserName = currentUser?.name || 'Someone';

        // Create bidirectional friendship & Notification
        // Transaction to ensure both exist or neither
        await prisma.$transaction([
            prisma.friendship.create({
                data: {
                    userId: user.id,
                    friendId: friend.id,
                    status: 'ACCEPTED'
                }
            }),
            prisma.friendship.create({
                data: {
                    userId: friend.id,
                    friendId: user.id,
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
