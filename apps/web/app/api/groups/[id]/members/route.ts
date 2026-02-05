import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getAuthUser } from '../../../../../lib/auth-utils';

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: groupId } = await params;
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        // 1. Verify Requestor Membership & Get Group Name
        const requesterMembership = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: groupId,
                }
            },
            include: {
                group: {
                    select: { name: true }
                }
            }
        });

        if (!requesterMembership) {
            return NextResponse.json({ error: 'Forbidden: You are not a member of this group' }, { status: 403 });
        }

        const groupName = requesterMembership.group.name;

        // 2. Find User to Add
        const userToAdd = await prisma.user.findUnique({
            where: { email }
        });

        if (!userToAdd) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 3. Check if already member
        const existingMember = await prisma.groupMember.findUnique({
            where: {
                userId_groupId: {
                    userId: userToAdd.id,
                    groupId: groupId,
                }
            }
        });

        if (existingMember) {
            return NextResponse.json({ error: 'User is already a member' }, { status: 409 });
        }

        // 4. Add Member & Notify
        const [newMember] = await prisma.$transaction([
            prisma.groupMember.create({
                data: {
                    userId: userToAdd.id,
                    groupId: groupId,
                },
                include: {
                    user: {
                        select: { id: true, name: true, email: true, avatarUrl: true }
                    }
                }
            }),
            prisma.notification.create({
                data: {
                    userId: userToAdd.id,
                    type: 'GROUP_ADD',
                    message: `You were added to group "${groupName}".`,
                    link: `/groups/${groupId}`
                }
            })
        ]);

        return NextResponse.json(newMember);

    } catch (error) {
        console.error('Error adding member:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
