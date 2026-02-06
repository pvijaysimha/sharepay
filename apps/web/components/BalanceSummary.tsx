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

    return (
        <div className="mt-8 bg-white shadow sm:rounded-lg">
            <div className="px-4 py-5 sm:p-6">
                <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4">
                    Your Balance Summary
                </h3>

                {!hasBalances ? (
                    <p className="text-gray-500">All settled up! No pending balances.</p>
                ) : (
                    <>
                        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                            {/* You Owe */}
                            <div className="rounded-lg bg-red-50 p-4">
                                <dt className="text-sm font-medium text-red-800">You Owe</dt>
                                <dd className="mt-1 text-2xl font-semibold text-red-600">
                                    ${data.totalOwe.toFixed(2)}
                                </dd>
                            </div>

                            {/* Owed to You */}
                            <div className="rounded-lg bg-green-50 p-4">
                                <dt className="text-sm font-medium text-green-800">Owed to You</dt>
                                <dd className="mt-1 text-2xl font-semibold text-green-600">
                                    ${data.totalOwed.toFixed(2)}
                                </dd>
                            </div>

                            {/* Net Balance */}
                            <div className={`rounded-lg p-4 ${data.netBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                <dt className={`text-sm font-medium ${data.netBalance >= 0 ? 'text-blue-800' : 'text-orange-800'}`}>
                                    Net Balance
                                </dt>
                                <dd className={`mt-1 text-2xl font-semibold ${data.netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
                                    {data.netBalance >= 0 ? '+' : '-'}${Math.abs(data.netBalance).toFixed(2)}
                                </dd>
                            </div>
                        </div>

                        {/* Toggle Details */}
                        {data.details.length > 0 && (
                            <div className="mt-4">
                                <button
                                    onClick={() => setShowDetails(!showDetails)}
                                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                >
                                    {showDetails ? 'Hide Details' : 'Show Details'}
                                </button>

                                {showDetails && (
                                    <div className="mt-4 overflow-hidden border rounded-lg">
                                        <table className="min-w-full divide-y divide-gray-200">
                                            <thead className="bg-gray-50">
                                                <tr>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Person</th>
                                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                                                    <th className="px-4 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                                </tr>
                                            </thead>
                                            <tbody className="bg-white divide-y divide-gray-200">
                                                {data.details.map((detail, idx) => (
                                                    <tr key={`${detail.personId}-${detail.groupId}-${idx}`}>
                                                        <td className="px-4 py-2 text-sm text-gray-900">
                                                            {detail.personName}
                                                        </td>
                                                        <td className="px-4 py-2 text-sm text-gray-500">
                                                            {detail.groupName || 'Direct'}
                                                        </td>
                                                        <td className={`px-4 py-2 text-sm text-right font-medium ${detail.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                            {detail.amount >= 0 
                                                                ? `+$${detail.amount.toFixed(2)} (owes you)` 
                                                                : `-$${Math.abs(detail.amount).toFixed(2)} (you owe)`
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
