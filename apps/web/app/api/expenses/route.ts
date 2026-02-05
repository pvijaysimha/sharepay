import { NextResponse } from 'next/server';
import { prisma, Prisma } from '@repo/db';
import { getAuthUser } from '../../../lib/auth-utils';
import { Decimal } from '@prisma/client/runtime/library';

export async function POST(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await req.json();
        const { description, amount, groupId, splits, date, category, payerId } = body;

        // 1. Basic Validation
        if (!description || !amount || !splits || !Array.isArray(splits)) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const totalAmount = Number(amount);
        if (totalAmount <= 0) {
            return NextResponse.json({ error: 'Amount must be positive' }, { status: 400 });
        }

        // 2. Split Validation
        let splitSum = 0;
        for (const split of splits) {
            if (!split.userId || !split.amount) {
                return NextResponse.json({ error: 'Invalid split data' }, { status: 400 });
            }
            splitSum += Number(split.amount);
        }

        // Allow for small floating point differences (e.g. 0.01)
        if (Math.abs(splitSum - totalAmount) > 0.01) {
            return NextResponse.json({
                error: `Split mismatch: Total ${totalAmount} does not match sum of splits ${splitSum}`
            }, { status: 400 });
        }

        // Determine Payer (Default to Creator if not specified)
        const finalPayerId = payerId || user.id;

        // 3. Verify Membership (If Group ID provided)
        if (groupId) {
            const membership = await prisma.groupMember.findUnique({
                where: {
                    userId_groupId: {
                        userId: user.id,
                        groupId: groupId,
                    }
                }
            });

            if (!membership) {
                return NextResponse.json({ error: 'You are not a member of this group' }, { status: 403 });
            }

            // Verify Payer Membership if explicitly provided and different from creator
            if (payerId && payerId !== user.id) {
                const payerMembership = await prisma.groupMember.findUnique({
                    where: {
                        userId_groupId: {
                            userId: payerId,
                            groupId: groupId,
                        }
                    }
                });
                if (!payerMembership) {
                    return NextResponse.json({ error: 'Payer is not a member of this group' }, { status: 400 });
                }
            }
        }


        // Fetch payer details for notification
        const payerUser = await prisma.user.findUnique({
            where: { id: finalPayerId },
            select: { name: true }
        });
        const payerName = payerUser?.name || 'Someone';

        // 4. Create Transaction
        const expense = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            // Create the main expense record
            const newExpense = await tx.expense.create({
                data: {
                    description,
                    amount: totalAmount,
                    date: date ? new Date(date) : new Date(),
                    groupId,
                    payerId: finalPayerId,
                    category: category || 'EXPENSE',
                    billEntries: body.items ? {
                        create: body.items.map((item: any) => ({
                            name: item.name,
                            price: item.price,
                            quantity: item.quantity || 1
                        }))
                    } : undefined
                }
            });

            // Create splits & Notifications
            for (const split of splits) {
                await tx.expenseSplit.create({
                    data: {
                        expenseId: newExpense.id,
                        userId: split.userId,
                        amount: split.amount,
                    }
                });

                // Notify split members (excluding payer)
                if (split.userId !== finalPayerId) {
                    await tx.notification.create({
                        data: {
                            userId: split.userId,
                            type: 'EXPENSE_ADD',
                            message: `${payerName} added you to an expense: "${description}" ($${split.amount})`,
                            link: groupId ? `/groups/${groupId}` : '/dashboard'
                        }
                    });
                }
            }

            // Handle Recurrence
            if (body.recurrence) {
                const { interval } = body.recurrence;
                const startDate = date ? new Date(date) : new Date();
                let nextRun = new Date(startDate);

                if (interval === 'WEEKLY') {
                    nextRun.setDate(nextRun.getDate() + 7);
                } else if (interval === 'MONTHLY') {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }

                await tx.recurringExpense.create({
                    data: {
                        description,
                        amount: totalAmount,
                        category: category || 'EXPENSE',
                        interval,
                        nextRun,
                        payerId: finalPayerId,
                        groupId,
                        splits: JSON.stringify(splits), // Store splits for future creation
                    }
                });
            }

            return newExpense;
        });

        return NextResponse.json(expense);

    } catch (error) {
        console.error('Error creating expense:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const groupId = url.searchParams.get('groupId');

        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        if (groupId) {
            // Verify membership
            const membership = await prisma.groupMember.findUnique({
                where: {
                    userId_groupId: {
                        userId: user.id,
                        groupId: groupId,
                    }
                }
            });

            if (!membership) {
                return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
            }

            const expenses = await prisma.expense.findMany({
                where: { groupId },
                include: {
                    payer: { select: { id: true, name: true } },
                    splits: { include: { user: { select: { id: true, name: true } } } }
                },
                orderBy: { date: 'desc' }
            });
            return NextResponse.json(expenses);
        } else {
            // Return all expenses involving the user (either as payer or split)
            const expenses = await prisma.expense.findMany({
                where: {
                    OR: [
                        { payerId: user.id },
                        { splits: { some: { userId: user.id } } }
                    ]
                },
                include: {
                    group: { select: { id: true, name: true, currency: true } },
                    payer: { select: { id: true, name: true } }
                },
                orderBy: { date: 'desc' }
            });
            return NextResponse.json(expenses);
        }

    } catch (error) {
        console.error('Error fetching expenses:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
