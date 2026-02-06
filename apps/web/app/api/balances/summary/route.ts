import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getAuthUser } from '../../../../lib/auth-utils';

interface BalanceDetail {
    personId: string;
    personName: string;
    personEmail: string;
    amount: number; // Positive = they owe you, Negative = you owe them
    groupId?: string;
    groupName?: string;
}

export async function GET(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all groups the user is a member of
        const memberships = await prisma.groupMember.findMany({
            where: { userId: user.id },
            select: { groupId: true, group: { select: { name: true } } }
        });

        const groupIds = memberships.map(m => m.groupId);
        const groupMap = new Map(memberships.map(m => [m.groupId, m.group.name]));

        // Get all expenses in user's groups
        const expenses = await prisma.expense.findMany({
            where: { groupId: { in: groupIds } },
            include: {
                splits: true,
                payer: { select: { id: true, name: true, email: true } }
            }
        });

        // Calculate net balance per person
        // Logic: For each expense:
        // - If user paid: add split amounts from others (they owe user)
        // - If user has a split: subtract that amount (user owes payer)
        const balanceMap = new Map<string, {
            name: string;
            email: string;
            balance: number;
            groupBalances: Map<string, number>;
        }>();

        for (const expense of expenses) {
            const payerId = expense.payerId;
            const groupId = expense.groupId || 'direct';

            for (const split of expense.splits) {
                if (split.userId === user.id && payerId !== user.id) {
                    // User owes the payer
                    const amount = Number(split.amount);
                    if (!balanceMap.has(payerId)) {
                        balanceMap.set(payerId, {
                            name: expense.payer.name || 'Unknown',
                            email: expense.payer.email || '',
                            balance: 0,
                            groupBalances: new Map()
                        });
                    }
                    const entry = balanceMap.get(payerId)!;
                    entry.balance -= amount; // Negative = you owe them
                    entry.groupBalances.set(groupId, (entry.groupBalances.get(groupId) || 0) - amount);
                } else if (payerId === user.id && split.userId !== user.id) {
                    // Someone owes the user
                    const amount = Number(split.amount);
                    if (!balanceMap.has(split.userId)) {
                        // Need to fetch user info
                        const splitUser = await prisma.user.findUnique({
                            where: { id: split.userId },
                            select: { name: true, email: true }
                        });
                        balanceMap.set(split.userId, {
                            name: splitUser?.name || 'Unknown',
                            email: splitUser?.email || '',
                            balance: 0,
                            groupBalances: new Map()
                        });
                    }
                    const entry = balanceMap.get(split.userId)!;
                    entry.balance += amount; // Positive = they owe you
                    entry.groupBalances.set(groupId, (entry.groupBalances.get(groupId) || 0) + amount);
                }
            }
        }

        // Calculate totals
        let totalOwed = 0;  // What others owe you
        let totalOwe = 0;   // What you owe others
        const details: BalanceDetail[] = [];

        for (const [personId, data] of balanceMap.entries()) {
            if (Math.abs(data.balance) > 0.01) { // Skip negligible amounts
                if (data.balance > 0) {
                    totalOwed += data.balance;
                } else {
                    totalOwe += Math.abs(data.balance);
                }

                // Add per-group breakdown
                for (const [groupId, amount] of data.groupBalances.entries()) {
                    if (Math.abs(amount) > 0.01) {
                        details.push({
                            personId,
                            personName: data.name,
                            personEmail: data.email,
                            amount: Number(amount.toFixed(2)),
                            groupId: groupId !== 'direct' ? groupId : undefined,
                            groupName: groupId !== 'direct' ? groupMap.get(groupId) : 'Direct'
                        });
                    }
                }
            }
        }

        // Sort: show what you owe first, then what's owed to you
        details.sort((a, b) => a.amount - b.amount);

        return NextResponse.json({
            totalOwed: Number(totalOwed.toFixed(2)),  // Others owe you
            totalOwe: Number(totalOwe.toFixed(2)),    // You owe others
            netBalance: Number((totalOwed - totalOwe).toFixed(2)),
            details
        });

    } catch (error) {
        console.error('Balance summary error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
