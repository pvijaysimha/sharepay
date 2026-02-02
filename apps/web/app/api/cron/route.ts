import { NextResponse } from 'next/server';
import { prisma, Prisma } from '@repo/db';

export async function GET(req: Request) {
    try {
        // Optional: Check for a secret key to prevent unauthorized triggering
        // const authHeader = req.headers.get('authorization');
        // if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //     return new NextResponse('Unauthorized', { status: 401 });
        // }

        const now = new Date();

        // 1. Find due recurring expenses
        const dueExpenses = await prisma.recurringExpense.findMany({
            where: {
                isActive: true,
                nextRun: {
                    lte: now
                }
            },
            include: {
                payer: { select: { name: true } }
            }
        });

        const results: { id: string; createdExpenseId: string }[] = [];

        for (const recurring of dueExpenses) {
            // Parse splits
            let splits = [];
            try {
                splits = JSON.parse(recurring.splits);
            } catch (e) {
                console.error(`Failed to parse splits for recurring expense ${recurring.id}`, e);
                continue;
            }

            // Create Expense & Update Next Run in transaction
            await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
                // 1. Create Expense
                const newExpense = await tx.expense.create({
                    data: {
                        description: recurring.description,
                        amount: recurring.amount,
                        category: recurring.category,
                        date: new Date(), // Created now
                        payerId: recurring.payerId,
                        groupId: recurring.groupId,
                        receiptUrl: null, // No receipt for auto-generated?
                    }
                });

                // 2. Create Splits & Notifications
                for (const split of splits) {
                    await tx.expenseSplit.create({
                        data: {
                            expenseId: newExpense.id,
                            userId: split.userId,
                            amount: split.amount
                        }
                    });

                    if (split.userId !== recurring.payerId) {
                        await tx.notification.create({
                            data: {
                                userId: split.userId,
                                type: 'EXPENSE_ADD',
                                message: `Recurring expense "${recurring.description}" was added.`,
                                link: recurring.groupId ? `/groups/${recurring.groupId}` : '/dashboard'
                            }
                        });
                    }
                }

                // 3. Update Next Run
                let nextRun = new Date(recurring.nextRun);
                if (recurring.interval === 'WEEKLY') {
                    nextRun.setDate(nextRun.getDate() + 7);
                } else if (recurring.interval === 'MONTHLY') {
                    nextRun.setMonth(nextRun.getMonth() + 1);
                }

                await tx.recurringExpense.update({
                    where: { id: recurring.id },
                    data: { nextRun }
                });

                results.push({ id: recurring.id, createdExpenseId: newExpense.id });
            });
        }

        return NextResponse.json({ processed: results.length, details: results });

    } catch (error) {
        console.error('Cron job error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
