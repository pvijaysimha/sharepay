'use client';

import { useEffect, useState } from 'react';
import LoadingSpinner from './LoadingSpinner';

interface BalanceDetail {
    personId: string;
    personName: string;
    personEmail: string;
    amount: number;
    groupId?: string;
    groupName?: string;
}

interface BalanceSummaryData {
    totalOwed: number;
    totalOwe: number;
    netBalance: number;
    details: BalanceDetail[];
}

export default function BalanceSummary() {
    const [data, setData] = useState<BalanceSummaryData | null>(null);
    const [loading, setLoading] = useState(true);
    const [showDetails, setShowDetails] = useState(false);

    useEffect(() => {
        const fetchBalances = async () => {
            try {
                const res = await fetch('/api/balances/summary');
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error('Error fetching balance summary:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchBalances();
    }, []);

    if (loading) {
        return (
            <div className="mt-8 bg-white shadow sm:rounded-lg p-6">
                <div className="flex justify-center">
                    <LoadingSpinner size="md" />
                </div>
            </div>
        );
    }

    if (!data) {
        return null;
    }

    const hasBalances = data.totalOwed > 0 || data.totalOwe > 0;
    const isPositive = data.netBalance >= 0;

    return (
        <div className="mt-6">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 to-violet-700 p-6 shadow-lg text-white">
                {/* Background Pattern */}
                <div className="absolute top-0 right-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-white/10 blur-3xl"></div>
                <div className="absolute bottom-0 left-0 -ml-16 -mb-16 h-64 w-64 rounded-full bg-black/10 blur-3xl"></div>

                <div className="relative">
                    <h3 className="text-sm font-medium text-indigo-100">Total Balance</h3>
                    <div className="mt-2 flex items-baseline">
                        <span className="text-4xl font-bold tracking-tight">
                            {isPositive ? '+' : '-'}${Math.abs(data.netBalance).toFixed(2)}
                        </span>
                        {hasBalances && (
                            <span className="ml-2 text-sm text-indigo-200 bg-white/10 px-2 py-0.5 rounded-full">
                                {isPositive ? 'You are owed' : 'You owe'}
                            </span>
                        )}
                    </div>

                    <div className="mt-8 grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                        <div>
                            <p className="text-xs font-medium text-indigo-200">You Owe</p>
                            <p className="mt-1 text-xl font-semibold text-white">${data.totalOwe.toFixed(2)}</p>
                        </div>
                        <div>
                            <p className="text-xs font-medium text-indigo-200">Owed to You</p>
                            <p className="mt-1 text-xl font-semibold text-white">${data.totalOwed.toFixed(2)}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Details Section */}
            {hasBalances && data.details.length > 0 && (
                <div className="mt-4">
                    <button
                        onClick={() => setShowDetails(!showDetails)}
                        className="flex items-center text-sm font-medium text-gray-500 hover:text-gray-900 transition-colors"
                    >
                        <span>{showDetails ? 'Hide breakdown' : 'See breakdown'}</span>
                        <svg 
                            className={`ml-1 h-4 w-4 transform transition-transform ${showDetails ? 'rotate-180' : ''}`} 
                            fill="none" viewBox="0 0 24 24" stroke="currentColor"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </button>

                    {showDetails && (
                        <div className="mt-3 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                            <div className="divide-y divide-gray-100">
                                {data.details.map((detail, idx) => (
                                    <div key={`${detail.personId}-${detail.groupId}-${idx}`} className="flex items-center justify-between p-4 hover:bg-gray-50">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-8 w-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-bold text-gray-500">
                                                {detail.personName.charAt(0)}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{detail.personName}</p>
                                                <p className="text-xs text-gray-500">{detail.groupName || 'Direct Expense'}</p>
                                            </div>
                                        </div>
                                        <span className={`text-sm font-semibold ${detail.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                            {detail.amount >= 0 ? '+' : '-'}${Math.abs(detail.amount).toFixed(2)}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
