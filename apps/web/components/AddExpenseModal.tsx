'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import ReceiptUploader from './ReceiptUploader';
import { ParsedReceipt } from '../lib/receipt-parser';
import LoadingSpinner from './LoadingSpinner';

interface User {
    id: string;
    name: string | null;
}

interface AddExpenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    groupId?: string | null;
    members: User[];
    currentUser?: User;
}

export default function AddExpenseModal({ isOpen, onClose, groupId, members, currentUser }: AddExpenseModalProps) {
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [payerId, setPayerId] = useState(currentUser?.id || '');
    const [splitType, setSplitType] = useState<'EQUAL' | 'FULL'>('EQUAL');
    const [debtorId, setDebtorId] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceInterval, setRecurrenceInterval] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');
    const [loading, setLoading] = useState(false);
    const router = useRouter();

    const [scannedItems, setScannedItems] = useState<{name: string, price: number, quantity: number}[]>([]);

    // Reset payer when open/current user changes
    useEffect(() => {
        if (isOpen && currentUser) {
            setPayerId(currentUser.id);
            setAmount('');
            setDescription('');
            setDate(new Date().toISOString().split('T')[0]);
            setSplitType('EQUAL');
            setDebtorId('');
            setIsRecurring(false);
            setRecurrenceInterval('MONTHLY');
            setScannedItems([]);
        }
    }, [isOpen, currentUser]);

    if (!isOpen) return null;

    const handleScanComplete = (data: ParsedReceipt) => {
        if (data.amount) setAmount(data.amount.toString());
        if (data.date) setDate(data.date);
        if (data.merchant) setDescription(data.merchant);
        if (data.items && data.items.length > 0) {
            setScannedItems(data.items);
            // Optional: Sum items to create amount if not found?
            // For now, rely on parsed Amount
        }
    };

    const updateItem = (index: number, field: string, value: string | number) => {
        const newItems = [...scannedItems];
        newItems[index] = { ...newItems[index], [field]: value };
        setScannedItems(newItems);
        
        // Update Total Amount automatically if items change?
        // Let's assume User manually verifies total.
    };

    const removeItem = (index: number) => {
        setScannedItems(scannedItems.filter((_, i) => i !== index));
    };

    const addItem = () => {
        setScannedItems([...scannedItems, { name: 'New Item', price: 0, quantity: 1 }]);
    };


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        const numAmount = parseFloat(amount);
        if (isNaN(numAmount) || numAmount <= 0) {
            alert('Please enter a valid amount');
            setLoading(false);
            return;
        }

        if (!payerId) {
             alert('Please select who paid');
             setLoading(false);
             return;
        }

        if (members.length === 0) {
            alert('No members to split with');
            setLoading(false);
            return;
        }

        let splits = [];

        if (splitType === 'EQUAL') {
            const splitAmount = numAmount / members.length;
            splits = members.map(m => ({
                userId: m.id,
                amount: Number(splitAmount.toFixed(2))
            }));

            // Adjust last split to match total exactly
            if (splits.length > 0) {
                const currentSum = splits.reduce((acc, s) => acc + s.amount, 0);
                const diff = Number((numAmount - currentSum).toFixed(2));
                if (diff !== 0) {
                    const lastSplit = splits[splits.length - 1];
                    if (lastSplit) {
                        lastSplit.amount = Number((lastSplit.amount + diff).toFixed(2));
                    }
                }
            }
        } else {
            // FULL Amount owed by one person
            if (!debtorId) {
                alert('Please select who owes the full amount');
                setLoading(false);
                return;
            }
            splits = [{
                userId: debtorId,
                amount: numAmount
            }];
        }

        try {
            const res = await fetch('/api/expenses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    description,
                    amount: numAmount,
                    groupId,
                    date,
                    payerId,
                    splits,
                    recurrence: isRecurring ? { interval: recurrenceInterval } : undefined,
                    items: scannedItems
                }),
            });

            if (res.ok) {
                setDescription('');
                setAmount('');
                router.refresh();
                onClose();
            } else {
                const data = await res.json();
                alert(data.error || 'Failed to create expense');
            }
        } catch (err) {
            console.error(err);
            alert('An error occurred');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 p-4 md:inset-0 md:h-full" role="dialog" aria-modal="true">
            <div className="relative h-full w-full max-w-md md:h-auto">
                <div className="relative rounded-lg bg-white shadow">
                    <button onClick={onClose} type="button" className="absolute top-3 right-2.5 ml-auto inline-flex items-center rounded-lg bg-transparent p-1.5 text-sm text-gray-400 hover:bg-gray-200 hover:text-gray-900">
                        <svg aria-hidden="true" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd"></path></svg>
                        <span className="sr-only">Close modal</span>
                    </button>
                    <div className="px-6 py-6 lg:px-8">
                        <h3 className="mb-4 text-xl font-medium text-gray-900">Add New Expense</h3>
                        
                        <ReceiptUploader onScanComplete={handleScanComplete} />

                        {scannedItems.length > 0 && (
                            <div className="mb-4">
                                <h4 className="text-sm font-medium text-gray-900 mb-2">Review Scanned Items</h4>
                                <div className="border rounded-md overflow-hidden bg-gray-50">
                                    <div className="max-h-40 overflow-y-auto">
                                        <table className="min-w-full text-xs text-left">
                                            <thead className="bg-gray-100 font-medium">
                                                <tr>
                                                    <th className="px-2 py-1">Item</th>
                                                    <th className="px-2 py-1 w-16">Price</th>
                                                    <th className="px-2 py-1 w-8"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {scannedItems.map((item, idx) => (
                                                    <tr key={idx} className="border-t">
                                                        <td className="px-2 py-1">
                                                            <input 
                                                                type="text" 
                                                                value={item.name} 
                                                                onChange={(e) => updateItem(idx, 'name', e.target.value)}
                                                                className="w-full bg-transparent border-none p-0 text-xs focus:ring-0"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1">
                                                            <input 
                                                                type="number" 
                                                                value={item.price} 
                                                                onChange={(e) => updateItem(idx, 'price', parseFloat(e.target.value))}
                                                                className="w-full bg-transparent border-none p-0 text-xs focus:ring-0"
                                                            />
                                                        </td>
                                                        <td className="px-2 py-1 text-center">
                                                            <button type="button" onClick={() => removeItem(idx)} className="text-red-500 hover:text-red-700">✕</button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="p-2 border-t text-center">
                                        <button type="button" onClick={addItem} className="text-xs text-blue-600 font-medium">+ Add Item</button>
                                    </div>
                                </div>
                            </div>
                        )}

                        <form className="space-y-6" onSubmit={handleSubmit}>
                            <div>
                                <label htmlFor="description" className="mb-2 block text-sm font-medium text-gray-900">Description</label>
                                <input type="text" name="description" id="description" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500" placeholder="e.g. Dinner" required value={description} onChange={(e) => setDescription(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="amount" className="mb-2 block text-sm font-medium text-gray-900">Amount</label>
                                    <input type="number" step="0.01" name="amount" id="amount" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500" placeholder="0.00" required value={amount} onChange={(e) => setAmount(e.target.value)} />
                                </div>
                                <div>
                                    <label htmlFor="payer" className="mb-2 block text-sm font-medium text-gray-900">Paid By</label>
                                    <select 
                                        id="payer" 
                                        className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                        value={payerId}
                                        onChange={(e) => setPayerId(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>Select Payer</option>
                                        {members.map(member => (
                                            <option key={member.id} value={member.id}>
                                                {currentUser && member.id === currentUser.id ? 'You' : member.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Split Options */}
                            <div>
                                <label className="mb-2 block text-sm font-medium text-gray-900">Split Method</label>
                                <div className="flex space-x-4 mb-2">
                                    <div className="flex items-center">
                                        <input 
                                            id="split-equal" 
                                            type="radio" 
                                            value="EQUAL" 
                                            name="splitType" 
                                            checked={splitType === 'EQUAL'}
                                            onChange={() => setSplitType('EQUAL')}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                        />
                                        <label htmlFor="split-equal" className="ml-2 text-sm font-medium text-gray-900">Split Equally</label>
                                    </div>
                                    <div className="flex items-center">
                                        <input 
                                            id="split-full" 
                                            type="radio" 
                                            value="FULL" 
                                            name="splitType" 
                                            checked={splitType === 'FULL'}
                                            onChange={() => setSplitType('FULL')}
                                            className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500"
                                        />
                                        <label htmlFor="split-full" className="ml-2 text-sm font-medium text-gray-900">One person owes everything</label>
                                    </div>
                                </div>

                                {splitType === 'FULL' && (
                                     <div>
                                        <label htmlFor="debtor" className="mb-1 block text-sm font-medium text-gray-700">Who owes full amount?</label>
                                        <select 
                                            id="debtor" 
                                            className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                            value={debtorId}
                                            onChange={(e) => setDebtorId(e.target.value)}
                                        >
                                            <option value="" disabled>Select Person</option>
                                            {members.map(member => (
                                                <option key={member.id} value={member.id}>
                                                    {currentUser && member.id === currentUser.id ? 'You' : member.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>

                            {/* Recurrence Option */}
                            <div className="flex items-start space-x-3">
                                <div className="flex h-5 items-center">
                                    <input
                                        id="recurring"
                                        type="checkbox"
                                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        checked={isRecurring}
                                        onChange={(e) => setIsRecurring(e.target.checked)}
                                    />
                                </div>
                                <div className="flex flex-1 flex-col">
                                    <label htmlFor="recurring" className="text-sm font-medium text-gray-900">Repeat this expense</label>
                                    {isRecurring && (
                                        <select
                                            className="mt-2 block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500"
                                            value={recurrenceInterval}
                                            onChange={(e) => setRecurrenceInterval(e.target.value as 'MONTHLY' | 'WEEKLY')}
                                        >
                                            <option value="WEEKLY">Weekly</option>
                                            <option value="MONTHLY">Monthly</option>
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div>
                                <label htmlFor="date" className="mb-2 block text-sm font-medium text-gray-900">Date</label>
                                <input type="date" name="date" id="date" className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-blue-500" required value={date} onChange={(e) => setDate(e.target.value)} />
                            </div>
                            <button type="submit" disabled={loading} className="w-full rounded-lg bg-blue-700 px-5 py-2.5 text-center text-sm font-medium text-white hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 disabled:opacity-50 flex justify-center items-center">
                                {loading ? <LoadingSpinner size="sm" color="white" /> : 'Add Expense'}
                            </button>
                        </form>
                        <p className="mt-2 text-xs text-gray-500 text-center">Split equally among {members.length} members.</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
