'use client';

import { useState, useEffect } from 'react';
import AddFriendModal from './AddFriendModal';
import AddExpenseModal from './AddExpenseModal';

interface User {
    id: string;
    name: string | null;
    email?: string;
    avatarUrl?: string | null;
}

interface FriendsListProps {
    currentUser: User;
}

export default function FriendsList({ currentUser }: FriendsListProps) {
    const [friends, setFriends] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
    const [selectedFriend, setSelectedFriend] = useState<User | null>(null);

    const fetchFriends = async () => {
        try {
            const res = await fetch('/api/friends');
            if (res.ok) {
                const data = await res.json();
                setFriends(data.friends);
            }
        } catch (error) {
            console.error('Error fetching friends:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFriends();
    }, []);

    // Refresh friends list when a new friend is added
    const handleAddFriendClose = () => {
        setIsAddFriendOpen(false);
        fetchFriends();
    };

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
                <button
                    onClick={() => setIsAddFriendOpen(true)}
                    className="inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700"
                >
                    Add Friend
                </button>
            </div>

            <div className="bg-white shadow overflow-hidden sm:rounded-md">
                <ul className="divide-y divide-gray-200">
                    {loading ? (
                         <li className="px-6 py-4 text-center text-sm text-gray-500">Loading...</li>
                    ) : friends.length === 0 ? (
                        <li className="px-6 py-4 text-center text-sm text-gray-500">No friends yet. Add one to get started!</li>
                    ) : (
                        friends.map((friend) => (
                            <li key={friend.id} className="px-6 py-4 flex items-center justify-between hover:bg-gray-50">
                                <div className="flex items-center">
                                    <div className="flex-shrink-0 h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold">
                                        {(friend.name?.toUpperCase()?.[0]) ?? '?'}
                                    </div>
                                    <div className="ml-4">
                                        <div className="text-sm font-medium text-gray-900">{friend.name || 'Unknown'}</div>
                                        <div className="text-sm text-gray-500">{friend.email}</div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleOpenExpense(friend)}
                                    className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
                                >
                                    Add Expense
                                </button>
                            </li>
                        ))
                    )}
                </ul>
            </div>

            <AddFriendModal 
                isOpen={isAddFriendOpen} 
                onClose={handleAddFriendClose} 
            />

            {selectedFriend && (
                <AddExpenseModal
                    isOpen={!!selectedFriend}
                    onClose={handleCloseExpense}
                    members={[currentUser, selectedFriend]}
                    currentUser={currentUser}
                    groupId={null}
                />
            )}
        </div>
    );
}
