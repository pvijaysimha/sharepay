import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getAuthUser } from '../../../lib/auth-utils';

export async function GET(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const friendId = searchParams.get('friendId');
        const groupId = searchParams.get('groupId');
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');
        const category = searchParams.get('category');

        // Build where clause for expenses
        const where: any = {
            OR: [
                { payerId: user.id },
                { splits: { some: { userId: user.id } } }
            ]
        };

        // Filter by specific friend (expenses involving both users)
        if (friendId) {
            where.AND = [
                {
                    OR: [
                        { payerId: user.id, splits: { some: { userId: friendId } } },
                        { payerId: friendId, splits: { some: { userId: user.id } } }
                    ]
                }
            ];
            delete where.OR;
        }

        // Filter by group
        if (groupId) {
            where.groupId = groupId;
        }

        // Filter by date range
        if (startDate || endDate) {
            where.date = {};
            if (startDate) where.date.gte = new Date(startDate);
            if (endDate) where.date.lte = new Date(endDate);
        }

        // Filter by category
        if (category) {
            where.category = category;
        }

        // Fetch expenses
        const expenses = await prisma.expense.findMany({
            where,
            include: {
                payer: { select: { id: true, name: true, email: true } },
                splits: {
                    include: {
                        user: { select: { id: true, name: true, email: true } }
                    }
                },
                group: { select: { id: true, name: true } },
                billEntries: true // Fetch items
            },
            orderBy: { date: 'desc' }
        });

        // Calculate running balance if filtering by friend
        let runningBalance = 0;
        const transactions = expenses.map(expense => {
            let userAmount = 0;
            let description = '';

            if (expense.payerId === user.id) {
                // User paid - friend owes user
                const friendSplit = expense.splits.find(s => s.userId === friendId);
                if (friendSplit) {
                    userAmount = Number(friendSplit.amount);
                    description = `You paid for ${expense.description}`;
                }
            } else if (expense.payerId === friendId) {
                // Friend paid - user owes friend
                const userSplit = expense.splits.find(s => s.userId === user.id);
                if (userSplit) {
                    userAmount = -Number(userSplit.amount);
                    description = `${expense.payer.name} paid for ${expense.description}`;
                }
            }

            if (friendId) {
                runningBalance += userAmount;
            }

            return {
                id: expense.id,
                date: expense.date.toISOString(),
                description: expense.description,
                category: expense.category,
                amount: Number(expense.amount),
                payerId: expense.payerId,
                payerName: expense.payer.name,
                groupId: expense.groupId,
                groupName: expense.group?.name || 'Direct',
                // For ledger view
                userAmount: Number(userAmount.toFixed(2)),
                runningBalance: Number(runningBalance.toFixed(2)),
                splits: expense.splits.map(s => ({
                    userId: s.userId,
                    userName: s.user.name,
                    amount: Number(s.amount)
                })),
                billEntries: expense.billEntries.map(b => ({
                    name: b.name,
                    price: b.price.toString(),
                    quantity: b.quantity
                }))
            };
        });

        // Calculate summary
        const summary = {
            totalExpenses: expenses.length,
            totalAmount: Number(expenses.reduce((sum, e) => sum + Number(e.amount), 0).toFixed(2)),
            netBalance: friendId ? runningBalance : null
        };

        return NextResponse.json({
            transactions,
            summary
        });

    } catch (error) {
        console.error('Transactions error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
