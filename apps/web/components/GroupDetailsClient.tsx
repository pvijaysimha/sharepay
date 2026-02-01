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
