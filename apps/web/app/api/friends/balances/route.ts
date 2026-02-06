import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getAuthUser } from '../../../../lib/auth-utils';

export async function GET(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get all friends
        const friendships = await prisma.friendship.findMany({
            where: { userId: user.id },
            include: {
                friend: { select: { id: true, name: true, email: true } }
            }
        });

        // For each friend, calculate the balance
        const friendBalances: Record<string, number> = {};

        // Get all expenses where user is payer or has a split
        const expenses = await prisma.expense.findMany({
            where: {
                OR: [
                    { payerId: user.id },
                    { splits: { some: { userId: user.id } } }
                ]
            },
            include: {
                splits: true
            }
        });

        // Calculate balance for each friend
        for (const friendship of friendships) {
            const friendId = friendship.friend.id;
            let balance = 0;

            for (const expense of expenses) {
                if (expense.payerId === user.id) {
                    // User paid - check if friend has a split
                    const friendSplit = expense.splits.find(s => s.userId === friendId);
                    if (friendSplit) {
                        balance += Number(friendSplit.amount); // Friend owes user
                    }
                } else if (expense.payerId === friendId) {
                    // Friend paid - check if user has a split
                    const userSplit = expense.splits.find(s => s.userId === user.id);
                    if (userSplit) {
                        balance -= Number(userSplit.amount); // User owes friend
                    }
                }
            }

            friendBalances[friendId] = Number(balance.toFixed(2));
        }

        return NextResponse.json({ balances: friendBalances });

    } catch (error) {
        console.error('Friend balances error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
