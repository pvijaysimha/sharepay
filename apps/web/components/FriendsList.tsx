'use client';

import { useState, useEffect } from 'react';
// AddFriendModal moved to parent
import AddExpenseModal from './AddExpenseModal';
import FriendLedger from './FriendLedger';

interface User {
    id: string;
    name: string | null;
    email?: string;
    avatarUrl?: string | null;
}

interface FriendsListProps {
    currentUser: User;
    onAddFriend?: () => void;
    refreshTrigger?: number;
}

export default function FriendsList({ currentUser, onAddFriend, refreshTrigger = 0 }: FriendsListProps) {
    const [friends, setFriends] = useState<User[]>([]);
    const [balances, setBalances] = useState<Record<string, number>>({});
    const [loading, setLoading] = useState(true);
    // Internal state for expense/ledger modals
    const [selectedFriend, setSelectedFriend] = useState<User | null>(null);
    const [ledgerFriend, setLedgerFriend] = useState<User | null>(null);

    const fetchFriends = async () => {
        try {
            const [friendsRes, balancesRes] = await Promise.all([
                fetch('/api/friends'),
                fetch('/api/friends/balances')
            ]);
            
            if (friendsRes.ok) {
                const data = await friendsRes.json();
                setFriends(data.friends);
            }
            
            if (balancesRes.ok) {
                const data = await balancesRes.json();
                setBalances(data.balances || {});
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, [refreshTrigger]);

    const handleOpenExpense = (friend: User) => {
        setSelectedFriend(friend);
    };

    const handleCloseExpense = () => {
        setSelectedFriend(null);
    };

    return (
        <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium leading-6 text-gray-900">Friends</h2>
                {onAddFriend && (
                    <button
                        onClick={onAddFriend}
                        className="inline-flex items-center rounded-md bg-indigo-50 px-3 py-2 text-sm font-semibold text-indigo-600 shadow-sm hover:bg-indigo-100"
                    >
                        Add Friend
                    </button>
                )}
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-xl">
                <ul className="divide-y divide-gray-200">
                    {loading ? (
                         <li className="px-6 py-4 text-center text-sm text-gray-500">Loading...</li>
                    ) : friends.length === 0 ? (
                        <li className="px-6 py-4 text-center text-sm text-gray-500">No friends yet. Add one to get started!</li>
                    ) : (
                        friends.map((friend) => {
                            const balance = balances[friend.id] || 0;
                            return (
                            <li key={friend.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center flex-1">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                        {(friend.name?.toUpperCase()?.[0]) ?? '?'}
                                    </div>
                                    <div className="ml-4 flex-1 min-w-0">
                                        <div className="text-sm font-medium text-gray-900 truncate">{friend.name || 'Unknown'}</div>
                                        <div className="text-sm text-gray-500 truncate hidden sm:block">{friend.email}</div>
                                    </div>
                                    {/* Balance Display */}
                                    <div className="mx-2 sm:mx-4 text-right flex-shrink-0">
                                        {balance === 0 ? (
                                            <span className="text-sm text-gray-400">settled</span>
                                        ) : balance > 0 ? (
                                            <div>
                                                <div className="text-sm font-medium text-green-600">+${balance.toFixed(2)}</div>
                                                <div className="text-xs text-gray-500">owes you</div>
                                            </div>
                                        ) : (
                                            <div>
                                                <div className="text-sm font-medium text-red-600">-${Math.abs(balance).toFixed(2)}</div>
                                                <div className="text-xs text-gray-500">you owe</div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
                                    <button
                                        onClick={() => setLedgerFriend(friend)}
                                        className="p-2 text-gray-400 hover:text-indigo-600 rounded-full hover:bg-indigo-50 transition-colors"
                                        title="View Ledger"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 0 0-3.375-3.375h-1.5A1.125 1.125 0 0 1 13.5 7.125v-1.5a3.375 3.375 0 0 0-3.375-3.375H8.25m2.25 0H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 0 0-9-9Z" />
                                        </svg>
                                        <span className="sr-only">Ledger</span>
                                    </button>
                                    <button
                                        onClick={() => handleOpenExpense(friend)}
                                        className="p-2 text-indigo-600 hover:text-indigo-700 rounded-full hover:bg-indigo-50 transition-colors"
                                        title="Add Expense"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                                            <path fillRule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25ZM12.75 9a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V15a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V9Z" clipRule="evenodd" />
                                        </svg>
                                        <span className="sr-only">Add Expense</span>
                                    </button>
                                </div>
                            </li>
                            );
                        })
                    )}
                </ul>
            </div>

            {selectedFriend && (
                <AddExpenseModal
                    isOpen={!!selectedFriend}
                    onClose={handleCloseExpense}
                    members={[currentUser, selectedFriend]}
                    currentUser={currentUser}
                    groupId={null}
                />
            )}

            {ledgerFriend && (
                <FriendLedger
                    isOpen={!!ledgerFriend}
                    onClose={() => setLedgerFriend(null)}
                    friend={ledgerFriend}
                    currentUserId={currentUser.id}
                />
            )}
        </div>
    );
}
