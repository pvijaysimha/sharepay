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

interface Group {
    id: string;
    name: string;
    currency: string;
}

interface AddExpenseFormProps {
    currentUser: User;
    groups: Group[];
    friends?: User[];
    preSelectedGroupId?: string;
    onSuccess?: () => void;
}

export default function AddExpenseForm({ currentUser, groups, friends = [], preSelectedGroupId, onSuccess }: AddExpenseFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    
    // Selection State
    // Format: "group:ID" or "friend:ID"
    const [selection, setSelection] = useState(preSelectedGroupId ? `group:${preSelectedGroupId}` : '');
    const [members, setMembers] = useState<User[]>([]);
    const [loadingMembers, setLoadingMembers] = useState(false);

    // Form State
    const [description, setDescription] = useState('');
    const [amount, setAmount] = useState('');
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [payerId, setPayerId] = useState(currentUser?.id || '');
    const [splitType, setSplitType] = useState<'EQUAL' | 'FULL'>('EQUAL');
    const [debtorId, setDebtorId] = useState('');
    const [isRecurring, setIsRecurring] = useState(false);
    const [recurrenceInterval, setRecurrenceInterval] = useState<'MONTHLY' | 'WEEKLY'>('MONTHLY');
    const [scannedItems, setScannedItems] = useState<{name: string, price: number, quantity: number}[]>([]);

    // Handle selection change
    useEffect(() => {
        if (!selection) {
            setMembers([]);
            return;
        }

        const [type, id] = selection.split(':');

        if (type === 'group') {
            setLoadingMembers(true);
            fetch(`/api/groups/${id}/members`)
                .then(res => res.json())
                .then(data => {
                    setMembers(data.members || []);
                    setLoadingMembers(false);
                })
                .catch(err => {
                    console.error('Failed to fetch members', err);
                    setLoadingMembers(false);
                });
        } else if (type === 'friend') {
            const friend = friends.find(f => f.id === id);
            if (friend) {
                setMembers([currentUser, friend]);
            }
        }
    }, [selection, currentUser, friends]);

    const handleScanComplete = (data: ParsedReceipt) => {
        if (data.amount) setAmount(data.amount.toString());
        if (data.date) setDate(data.date);
        if (data.merchant) setDescription(data.merchant);
        if (data.items && data.items.length > 0) {
            setScannedItems(data.items);
        }
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

        if (!selection) {
            alert('Please select a group or friend');
            setLoading(false);
            return;
        }

        const [type, targetId] = selection.split(':');
        const groupId = type === 'group' ? targetId : undefined;

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
            
            // Fix rounding
            const currentSum = splits.reduce((acc, s) => acc + s.amount, 0);
            const diff = Number((numAmount - currentSum).toFixed(2));
            if (diff !== 0 && splits.length > 0) {
                const lastSplit = splits[splits.length - 1];
                if (lastSplit) {
                    lastSplit.amount += diff;
                }
            }
        } else {
            if (!debtorId) {
                alert('Please select who owes the full amount');
                setLoading(false);
                return;
            }
            splits = [{ userId: debtorId, amount: numAmount }];
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
                router.refresh(); 
                if (onSuccess) {
                    onSuccess();
                } else if (type === 'group') {
                    router.push(`/dashboard/groups/${targetId}`);
                } else {
                    router.push('/dashboard');
                }
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
        <div className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
             {!preSelectedGroupId && (
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Split With</label>
                    <div className="relative">
                        <select
                            className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-3 bg-white text-gray-900 appearance-none"
                            value={selection}
                            onChange={(e) => setSelection(e.target.value)}
                        >
                            <option value="" className="text-gray-500">Select group or friend...</option>
                            
                            {groups.length > 0 && (
                                <optgroup label="Groups" className="text-gray-900 font-semibold bg-gray-50">
                                    {groups.map(g => (
                                        <option key={g.id} value={`group:${g.id}`} className="text-gray-900 bg-white indent-2">
                                            {g.name}
                                        </option>
                                    ))}
                                </optgroup>
                            )}

                            {friends.length > 0 && (
                                <optgroup label="Friends" className="text-gray-900 font-semibold bg-gray-50">
                                    {friends.map(f => (
                                        <option key={f.id} value={`friend:${f.id}`} className="text-gray-900 bg-white indent-2">
                                            {f.name || f.id}
                                        </option>
                                    ))}
                                </optgroup>
                            )}
                        </select>
                        {/* Custom arrow icon for better styling control */}
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
                            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            )}

            {selection && (
                <>
                    {loadingMembers ? (
                        <div className="flex justify-center py-4">
                            <LoadingSpinner size="sm" />
                        </div>
                    ) : (
                        <>
                            <ReceiptUploader onScanComplete={handleScanComplete} />
                            
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                                    <input 
                                        type="text" 
                                        required 
                                        className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                        placeholder="e.g. Dinner at Mario's"
                                        value={description}
                                        onChange={e => setDescription(e.target.value)}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                                        <input 
                                            type="number" 
                                            step="0.01" 
                                            required 
                                            className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            placeholder="0.00"
                                            value={amount}
                                            onChange={e => setAmount(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                         <label className="block text-sm font-medium text-gray-700 mb-2">Paid By</label>
                                         <select
                                            className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={payerId}
                                            onChange={e => setPayerId(e.target.value)}
                                         >
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>{m.id === currentUser.id ? 'You' : m.name}</option>
                                            ))}
                                         </select>
                                    </div>
                                </div>

                                {/* Split Type */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Split Method</label>
                                    <div className="flex space-x-4">
                                        <label className="flex items-center">
                                            <input type="radio" value="EQUAL" checked={splitType === 'EQUAL'} onChange={() => setSplitType('EQUAL')} className="text-indigo-600 focus:ring-indigo-500"/>
                                            <span className="ml-2 text-sm text-gray-700">Equally</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input type="radio" value="FULL" checked={splitType === 'FULL'} onChange={() => setSplitType('FULL')} className="text-indigo-600 focus:ring-indigo-500"/>
                                            <span className="ml-2 text-sm text-gray-700">Full Amount</span>
                                        </label>
                                    </div>
                                </div>

                                {splitType === 'FULL' && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Owed By</label>
                                        <select
                                            className="block w-full rounded-lg border-gray-300 bg-gray-50 p-2.5 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                            value={debtorId}
                                            onChange={e => setDebtorId(e.target.value)}
                                        >
                                            <option value="">Select person</option>
                                            {members.map(m => (
                                                <option key={m.id} value={m.id}>{m.id === currentUser.id ? 'You' : m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                                
                                <button 
                                    type="submit" 
                                    disabled={loading}
                                    className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                                >
                                    {loading ? <LoadingSpinner size="sm" color="white" /> : 'Save Expense'}
                                </button>
                            </form>
                        </>
                    )}
                </>
            )}
        </div>
    );
}
