import { notFound, redirect } from 'next/navigation';
import { prisma } from '@repo/db';
import { getAuthUser } from '../../../../lib/auth-utils';
import GroupDetailsClient from '../../../../components/GroupDetailsClient';

interface PageProps {
    params: Promise<{
        id: string;
    }>;
}

async function getData(groupId: string) {
    const authUser = await getAuthUser();
    
    if (!authUser) return { user: null, group: null, expenses: [] };

    const user = await prisma.user.findUnique({
        where: { id: authUser.id }
    });

    // Fetch Group & Verify Membership
    const group = await prisma.group.findUnique({
        where: { id: groupId },
        include: {
            members: {
                include: {
                    user: {
                        select: { id: true, name: true }
                    }
                }
            }
        }
    });

    if (!group) return { user, group: null, expenses: [] };

    const isMember = group.members.some(m => m.user.id === user?.id);
    if (!isMember) return { user, group: null, expenses: [] }; // Or handle as forbidden

    // Fetch Expenses
    const expenses = await prisma.expense.findMany({
        where: { groupId },
        include: {
            payer: { select: { id: true, name: true } }
        },
        orderBy: { date: 'desc' }
    });

    return { user, group, expenses };
}

export default async function GroupDetailsPage({ params }: PageProps) {
    const { id } = await params;
    const { user, group, expenses } = await getData(id);

    if (!user) {
        redirect('/auth/login');
    }

    if (!group) {
        notFound();
    }

    // Transform expenses amounts to strings if needed (Prisma Decimal to string is auto in JSON usually, but safe to pass as is if client handles it)
    // Client expects string for amount.
    const formattedExpenses = expenses.map(e => ({
        ...e,
        amount: e.amount.toString(),
        date: e.date.toISOString(),
    }));

    return <GroupDetailsClient group={group} expenses={formattedExpenses} currentUser={user} />;
}
