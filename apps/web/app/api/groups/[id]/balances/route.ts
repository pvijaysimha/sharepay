import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getAuthUser } from '../../../../../lib/auth-utils';

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
    try {
        const { id: groupId } = await params;
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

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

        // 1. Fetch Expenses and Splits
        const expenses = await prisma.expense.findMany({
            where: { groupId },
            include: {
                splits: true,
                payer: { select: { id: true, name: true } }
            }
        });

        // 2. Fetch Users involved (to get their names)
        const groupMembers = await prisma.groupMember.findMany({
            where: { groupId },
            include: {
                user: { select: { id: true, name: true, avatarUrl: true } }
            }
        });
        const usersMap: Record<string, { id: string, name: string | null, avatarUrl: string | null }> = {};
        groupMembers.forEach(m => usersMap[m.userId] = m.user);

        // 3. Calculate Net Balances
        // Positive = Paid more than share (Owed money)
        // Negative = Paid less than share (Owes money)
        const balances: Record<string, number> = {};

        // Initialize 0
        groupMembers.forEach(m => balances[m.userId] = 0);

        for (const expense of expenses) {
            const payerId = expense.payerId;
            const amount = Number(expense.amount);

            // Add to payer
            if (balances[payerId] !== undefined) {
                balances[payerId] += amount;
            }

            // Subtract from splitters
            for (const split of expense.splits) {
                const splitAmount = Number(split.amount);
                const userId = split.userId;
                if (balances[userId] !== undefined) {
                    balances[userId] -= splitAmount;
                }
            }
        }

        // 4. Simplify Debts (Who owes whom)
        const debts: { from: string, to: string, amount: number }[] = [];

        interface BalanceItem {
            id: string;
            amount: number;
        }

        // Separate into debtors (negative) and creditors (positive)
        let debtors: BalanceItem[] = Object.keys(balances)
            .filter(id => (balances[id] || 0) < -0.01)
            .map(id => ({ id, amount: balances[id] || 0 })); // amount is negative

        let creditors: BalanceItem[] = Object.keys(balances)
            .filter(id => (balances[id] || 0) > 0.01)
            .map(id => ({ id, amount: balances[id] || 0 })); // amount is positive

        // Sort to optimize matching
        debtors.sort((a, b) => a.amount - b.amount); // Ascending (most negative first)
        creditors.sort((a, b) => b.amount - a.amount); // Descending (most positive first)

        let i = 0; // debtors index
        let j = 0; // creditors index

        while (i < debtors.length && j < creditors.length) {
            const debtor = debtors[i];
            const creditor = creditors[j];

            if (!debtor || !creditor) break;

            // The amount to settle is the minimum of what debtor owes and creditor is owed
            const amount = Math.min(Math.abs(debtor.amount), creditor.amount);

            // Round logic to 2 decimals
            const roundedAmount = Number(amount.toFixed(2));

            if (roundedAmount > 0) {
                debts.push({
                    from: debtor.id,
                    to: creditor.id,
                    amount: roundedAmount
                });
            }


            // Adjust remaining amounts
            debtor.amount += amount;
            creditor.amount -= amount;

            // Move indices if settled (using small epsilon for float comparison)
            if (Math.abs(debtor.amount) < 0.01) i++;
            if (creditor.amount < 0.01) j++;
        }

        // Enrich response with user details
        const enrichedDebts = debts.map(debt => ({
            from: usersMap[debt.from],
            to: usersMap[debt.to],
            amount: debt.amount
        }));

        return NextResponse.json({ balances, debts: enrichedDebts });

    } catch (error) {
        console.error('Error fetching balances:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
