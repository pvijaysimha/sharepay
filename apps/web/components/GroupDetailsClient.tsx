'use client';

import { useState } from 'react';
import Link from 'next/link';
import AddExpenseModal from './AddExpenseModal';
import AddMemberModal from './AddMemberModal';
import BalancesList from './BalancesList';

interface User {
    id: string;
    name: string | null;
}

interface Expense {
    id: string;
    description: string;
    amount: string; 
    date: string;
    payer: {
        id: string;
        name: string | null;
    };
    billEntries?: {
        name: string;
        price: string; // Prisma Decimal to string
        quantity: number;
    }[];
}

interface GroupDetailsClientProps {
    group: {
        id: string;
        name: string;
        currency: string;
        members: {
            user: User;
        }[];
    };
    expenses: Expense[];
    currentUser?: User;
}

export default function GroupDetailsClient({ group, expenses, currentUser }: GroupDetailsClientProps) {
    const [isAddExpenseOpen, setIsAddExpenseOpen] = useState(false);
    const [isAddMemberOpen, setIsAddMemberOpen] = useState(false);
    const [refreshTrigger, setRefreshTrigger] = useState(0);
    const [viewItemsExpense, setViewItemsExpense] = useState<Expense | null>(null);

    // Extract members list for the modal
    const members = group.members.map(m => m.user);

    const handleExpenseAdded = () => {
        setIsAddExpenseOpen(false);
        setRefreshTrigger(prev => prev + 1); // Trigger balances refresh
        // Router refresh happens in modal, but we need local state trigger for child component
    };

    return (
        <div className="bg-white shadow sm:rounded-lg">
            <AddExpenseModal 
                isOpen={isAddExpenseOpen}
                onClose={() => setIsAddExpenseOpen(false)}
                groupId={group.id}
                members={members}
                currentUser={currentUser}
            />
            
            <AddMemberModal 
                isOpen={isAddMemberOpen}
                onClose={() => setIsAddMemberOpen(false)}
                groupId={group.id}
            />

            {/* Receipt Items Modal */}
            {viewItemsExpense && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4" onClick={() => setViewItemsExpense(null)}>
                    <div className="relative w-full max-w-md rounded-lg bg-white p-6 shadow-xl" onClick={e => e.stopPropagation()}>
                        <div className="mb-4 flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{viewItemsExpense.description} Items</h3>
                            <button onClick={() => setViewItemsExpense(null)} className="text-gray-400 hover:text-gray-500">✕</button>
                        </div>
                        <div className="max-h-96 overflow-y-auto rounded-md border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Price</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {viewItemsExpense.billEntries?.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                                            <td className="px-4 py-2 text-sm text-gray-500 text-right">{item.quantity}</td>
                                            <td className="px-4 py-2 text-sm font-medium text-gray-900 text-right">
                                                {group.currency} {Number(item.price).toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                    {(!viewItemsExpense.billEntries || viewItemsExpense.billEntries.length === 0) && (
                                        <tr>
                                            <td colSpan={3} className="px-4 py-4 text-center text-sm text-gray-500">No item details available.</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-right">
                             <p className="text-sm font-medium text-gray-900">Total: {group.currency} {Number(viewItemsExpense.amount).toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            )}

            <div className="border-b border-gray-200 px-4 py-5 sm:px-6">
                <div className="-ml-4 -mt-2 flex flex-wrap items-center justify-between sm:flex-nowrap">
                    <div className="ml-4 mt-2">
                         <div className="flex items-center">
                            <Link href="/dashboard" className="mr-4 text-gray-400 hover:text-gray-500">
                                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                            </Link>
                            <h3 className="text-base font-semibold leading-6 text-gray-900">{group.name}</h3>
                        </div>
                    </div>
                    <div className="ml-4 mt-2 flex-shrink-0 flex space-x-2">
                         <button
                            onClick={() => setIsAddMemberOpen(true)}
                            type="button"
                            className="relative inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Add Member
                        </button>
                        <button
                            onClick={() => setIsAddExpenseOpen(true)}
                            type="button"
                            className="relative inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
                        >
                            Add Expense
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="px-4 py-5 sm:p-6">
                <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
                    {/* Expenses Column */}
                    <div className="lg:col-span-2">
                        <h4 className="text-sm font-medium text-gray-500 mb-4">Expenses</h4>
                        {expenses.length === 0 ? (
                            <div className="text-center py-10 text-gray-500 text-sm">
                                No expenses yet. Add one to get started!
                            </div>
                        ) : (
                            <ul role="list" className="divide-y divide-gray-100">
                                {expenses.map((expense) => (
                                    <li key={expense.id} className="flex items-center justify-between gap-x-6 py-5">
                                        <div className="min-w-0">
                                            <div className="flex items-start gap-x-3">
                                                <p className="text-sm font-semibold leading-6 text-gray-900">{expense.description}</p>
                                                {expense.billEntries && expense.billEntries.length > 0 && (
                                                    <button 
                                                        onClick={() => setViewItemsExpense(expense)}
                                                        className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                                                    >
                                                        Receipt 🧾
                                                    </button>
                                                )}
                                            </div>
                                            <div className="mt-1 flex items-center gap-x-2 text-xs leading-5 text-gray-500">
                                                <p className="whitespace-nowrap">
                                                    Paid by <span className="font-medium text-gray-900">{expense.payer.name}</span>
                                                </p>
                                                <svg viewBox="0 0 2 2" className="h-0.5 w-0.5 fill-current">
                                                    <circle cx={1} cy={1} r={1} />
                                                </svg>
                                                <p className="whitespace-nowrap">
                                                    {new Date(expense.date).toLocaleDateString('en-US')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-none items-center gap-x-4">
                                            <p className="text-sm leading-6 text-gray-900 font-medium">
                                                {group.currency} {Number(expense.amount).toFixed(2)}
                                            </p>
                                        </div>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Balances Column */}
                    <div>
                        <h4 className="text-sm font-medium text-gray-500 mb-4">Balances</h4>
                        <div className="bg-gray-50 rounded-lg p-4">
                            <BalancesList groupId={group.id} refreshTrigger={expenses.length} currentUser={currentUser} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
