'use client';

import { useState, useEffect } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface Transaction {
    id: string;
    date: string;
    description: string;
    category: string;
    amount: number;
    payerId: string;
    payerName: string;
    groupId: string | null;
    groupName: string;
    userAmount: number;
    runningBalance: number;
}

interface FriendLedgerProps {
    isOpen: boolean;
    onClose: () => void;
    friend: {
        id: string;
        name: string | null;
        email?: string;
    };
    currentUserId: string;
}

export default function FriendLedger({ isOpen, onClose, friend, currentUserId }: FriendLedgerProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);
    const [netBalance, setNetBalance] = useState(0);
    const [filters, setFilters] = useState({
        startDate: '',
        endDate: '',
        category: ''
    });

    const fetchTransactions = async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            params.set('friendId', friend.id);
            if (filters.startDate) params.set('startDate', filters.startDate);
            if (filters.endDate) params.set('endDate', filters.endDate);
            if (filters.category) params.set('category', filters.category);

            const res = await fetch(`/api/transactions?${params.toString()}`);
            if (res.ok) {
                const data = await res.json();
                setTransactions(data.transactions);
                setNetBalance(data.summary.netBalance || 0);
            }
        } catch (error) {
            console.error('Error fetching transactions:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            fetchTransactions();
        }
    }, [isOpen, friend.id, filters]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
                <div className="fixed inset-0 transition-opacity bg-gray-500 bg-opacity-75" onClick={onClose} />

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>

                <div className="inline-block w-full max-w-4xl px-4 pt-5 pb-4 overflow-hidden text-left align-bottom transition-all transform bg-white rounded-lg shadow-xl sm:my-8 sm:align-middle sm:p-6">
                    {/* Header */}
                    <div className="flex justify-between items-center mb-4">
                        <div>
                            <h3 className="text-lg font-medium text-gray-900">
                                Ledger with {friend.name || friend.email}
                            </h3>
                            <div className={`mt-1 text-sm font-medium ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {netBalance >= 0 
                                    ? `${friend.name} owes you $${netBalance.toFixed(2)}`
                                    : `You owe ${friend.name} $${Math.abs(netBalance).toFixed(2)}`
                                }
                            </div>
                        </div>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-500">
                            <span className="sr-only">Close</span>
                            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>

                    {/* Filters */}
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-4 mb-4 p-3 bg-gray-50 rounded-lg">
                        <div>
                            <label className="block text-xs font-medium text-gray-700">From Date</label>
                            <input
                                type="date"
                                value={filters.startDate}
                                onChange={(e) => setFilters(f => ({ ...f, startDate: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">To Date</label>
                            <input
                                type="date"
                                value={filters.endDate}
                                onChange={(e) => setFilters(f => ({ ...f, endDate: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-700">Category</label>
                            <select
                                value={filters.category}
                                onChange={(e) => setFilters(f => ({ ...f, category: e.target.value }))}
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                            >
                                <option value="">All</option>
                                <option value="EXPENSE">Expenses Only</option>
                                <option value="SETTLEMENT">Settlements Only</option>
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={() => setFilters({ startDate: '', endDate: '', category: '' })}
                                className="w-full px-3 py-2 text-sm text-gray-600 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                            >
                                Clear Filters
                            </button>
                        </div>
                    </div>

                    {/* Transactions Table */}
                    <div className="max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <LoadingSpinner size="md" />
                            </div>
                        ) : transactions.length === 0 ? (
                            <p className="text-center text-gray-500 py-8">No transactions found</p>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                        <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Balance</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {transactions.map((tx) => (
                                        <tr key={tx.id} className={tx.category === 'SETTLEMENT' ? 'bg-blue-50' : ''}>
                                            <td className="px-4 py-2 text-sm text-gray-900 whitespace-nowrap">
                                                {new Date(tx.date).toLocaleDateString()}
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-900">
                                                <div>{tx.description}</div>
                                                <div className="text-xs text-gray-500">
                                                    {tx.payerId === currentUserId ? 'You paid' : `${tx.payerName} paid`}
                                                    {tx.category === 'SETTLEMENT' && ' (Settlement)'}
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-sm text-gray-500">
                                                {tx.groupName}
                                            </td>
                                            <td className={`px-4 py-2 text-sm text-right font-medium ${tx.userAmount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {tx.userAmount >= 0 ? '+' : '-'}${Math.abs(tx.userAmount).toFixed(2)}
                                            </td>
                                            <td className={`px-4 py-2 text-sm text-right font-medium ${tx.runningBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                ${tx.runningBalance.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer Summary */}
                    {!loading && transactions.length > 0 && (
                        <div className="mt-4 pt-4 border-t flex justify-between items-center">
                            <span className="text-sm text-gray-500">
                                {transactions.length} transaction{transactions.length !== 1 ? 's' : ''}
                            </span>
                            <div className={`text-lg font-semibold ${netBalance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                Net: {netBalance >= 0 ? '+' : '-'}${Math.abs(netBalance).toFixed(2)}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
