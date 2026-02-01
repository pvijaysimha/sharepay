'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string | null;
}

interface SettleUpModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId: string;
    recipient: User | null; // The person being paid
    defaultAmount: number;
}

export default function SettleUpModal({ isOpen, onClose, groupId, recipient, defaultAmount }: SettleUpModalProps) {
    const [amount, setAmount] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    useEffect(() => {
        if (isOpen && defaultAmount > 0) {
            setAmount(defaultAmount.toString());
        }
    }, [isOpen, defaultAmount]);

    if (!isOpen || !recipient) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            alert('Please enter a valid amount');
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description: 'Settlement',
                    amount: numAmount,
                    groupId,
                    date: new Date().toISOString(),
                    category: 'SETTLEMENT',
                    splits: [{ userId: recipient.id, amount: numAmount }] // Recipient gets 100% of the value (meaning they are paid back)
                }),
            });

            if (res.ok) {
                setAmount('');
                router.refresh(); // Refresh page data
                onClose();
                // We might need to trigger BalancesList reload explicitly if it uses local fetch
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to record settlement');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4 md:inset-0 md:h-full">
            <div className="relative h-full w-full max-w-sm md:h-auto">
                <div className="relative rounded-lg bg-white shadow">
                    <button onClick={onClose} type="button" className="absolute top-3 right-2.5 ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
                        <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                    <div className="px-6 py-6 lg:px-8">
                        <h3 className="mb-4 text-xl font-medium text-gray-900">Settle Up</h3>
                        <div className="mb-4 text-sm text-gray-500">
                            Paying <span className="font-semibold text-gray-900">{recipient.name}</span>
                        </div>
                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="amount" className="mb-2 block text-sm font-medium text-gray-900">Amount</label>
                                <div className="relative">
                                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                        <span className="text-gray-500 sm:text-sm">$</span>
                                    </div>
                                    <input type="number" step="0.01" name="amount" id="amount" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 pl-7 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500" placeholder="0.00" required value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                            </div>
                            <button type="submit" disabled={loading} className="w-full rounded-lg bg-green-600 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-4 focus:ring-green-300 disabled:opacity-50">{loading ? 'Processing...' : 'Pay'}</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
