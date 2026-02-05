import { NextResponse } from 'next/server';
import { prisma } from '@repo/db';
import { getAuthUser } from '../../../lib/auth-utils';

export async function GET(req: Request) {
    try {
        const user = await getAuthUser();

        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch all splits for this user
        // This represents their share of expenses
        const mySplits = await prisma.expenseSplit.findMany({
            where: {
                userId: user.id
            },
            include: {
                expense: {
                    select: {
                        date: true,
                        category: true,
                        description: true
                    }
                }
            }
        });

        // Aggregation
        let totalSpent = 0;
        const categoryMap = new Map<string, number>();
        const monthMap = new Map<string, number>();

        for (const split of mySplits) {
            const amount = Number(split.amount);
            totalSpent += amount;

            // Category Breakdown
            const category = split.expense.category || 'Uncategorized';
            categoryMap.set(category, (categoryMap.get(category) || 0) + amount);

            // Monthly Trend
            // Format: "Jan 2024"
            const date = new Date(split.expense.date);
            const monthKey = date.toLocaleString('default', { month: 'short', year: 'numeric' });
            monthMap.set(monthKey, (monthMap.get(monthKey) || 0) + amount);
        }

        // Transform for Recharts
        const categoryBreakdown = Array.from(categoryMap.entries())
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value); // sort desc

        // Sort months chronologically? 
        // Quick hack: just returning the map entries, simplified.
        // For proper sorting we might need a better key (YYYY-MM) then format for display.

        // Let's redo month map with sortable key
        const monthMapSortable = new Map<string, { label: string, amount: number }>();

        for (const split of mySplits) {
            const date = new Date(split.expense.date);
            const sortKey = date.toISOString().slice(0, 7); // "2024-01"
            const label = date.toLocaleString('default', { month: 'short' });

            if (!monthMapSortable.has(sortKey)) {
                monthMapSortable.set(sortKey, { label, amount: 0 });
            }
            const entry = monthMapSortable.get(sortKey)!;
            entry.amount += Number(split.amount);
        }

        const monthlyTrend = Array.from(monthMapSortable.entries())
            .sort((a, b) => a[0].localeCompare(b[0])) // Sort by "YYYY-MM"
            .slice(-6) // Last 6 months
            .map(([key, data]) => ({
                month: data.label,
                amount: data.amount
            }));

        return NextResponse.json({
            totalSpent,
            monthlyTrend,
            categoryBreakdown
        });

    } catch (error) {
        console.error('Analytics error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
