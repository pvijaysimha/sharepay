'use client';

import { useEffect, useState } from 'react';
import SettleUpModal from './SettleUpModal';
import { useRouter } from 'next/navigation';

interface User {
    id: string;
    name: string | null;
    avatarUrl: string | null;
}

interface Debt {
    from: User;
    to: User;
    amount: number;
}

interface BalancesListProps {
    groupId: string;
    refreshTrigger: number;
    currentUser?: { id: string; name: string | null };
}

export default function BalancesList({ groupId, refreshTrigger, currentUser }: BalancesListProps) {
    const [debts, setDebts] = useState<Debt[]>([]);
    const [loading, setLoading] = useState(true);
    
    // Settle Modal State
    const [settleRecipient, setSettleRecipient] = useState<User | null>(null);
    const [settleAmount, setSettleAmount] = useState(0);
    const router = useRouter(); // To refresh expenses after settlement

    const fetchBalances = async () => {
        try {
            const res = await fetch(`/api/groups/${groupId}/balances`);
            if (res.ok) {
                const data = await res.json();
                setDebts(data.debts);
            }
        } catch (error) {
            console.error("Failed to fetch balances", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBalances();
    }, [groupId, refreshTrigger]);

    // Handle closing modal and refreshing data
    const handleSettleClose = () => {
        setSettleRecipient(null);
        setSettleAmount(0);
        // We trigger a re-fetch of balances which might be redundant if parent triggers refresh,
        // but it's safe. 
        // Note: The parent triggers refresh via refreshTrigger prop when expenses change.
        // SettleUpModal calls router.refresh(). 
        // We should also re-fetch THIS list. 
        fetchBalances(); 
    };

    if (loading) return <div className="text-sm text-gray-500 animate-pulse">Calculating balances...</div>;

    if (debts.length === 0) {
        return <div className="text-sm text-gray-500 text-center py-4">No outstanding balances. You are all settled up!</div>;
    }

    return (
        <>
            <SettleUpModal 
                isOpen={!!settleRecipient} 
                onClose={handleSettleClose}
                groupId={groupId}
                recipient={settleRecipient}
                defaultAmount={settleAmount}
            />
            
            <ul className="divide-y divide-gray-100">
                {debts.map((debt, idx) => {
                    const isOwedByMe = currentUser && debt.from.id === currentUser.id;
                    
                    return (
                        <li key={idx} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-x-3">
                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-xs font-medium text-gray-600">
                                     {debt.from.name ? debt.from.name.charAt(0).toUpperCase() : '?'}
                                </div>
                                <div className="text-sm">
                                    <span className="font-medium text-gray-900">{debt.from.name}</span>
                                    <span className="text-gray-500"> owes </span>
                                    <span className="font-medium text-gray-900">{debt.to.name}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-x-3">
                                <div className="text-sm font-semibold text-red-600">
                                     ${debt.amount.toFixed(2)}
                                </div>
                                {isOwedByMe && (
                                    <button 
                                        onClick={() => {
                                            setSettleRecipient(debt.to);
                                            setSettleAmount(debt.amount);
                                        }}
                                        className="rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 hover:bg-green-100 ring-1 ring-inset ring-green-600/20"
                                    >
                                        Settle
                                    </button>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ul>
        </>
    );
}

