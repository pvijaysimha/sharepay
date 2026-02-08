'use client';

import { useState } from 'react';
import Link from 'next/link';
import CreateGroupModal from './CreateGroupModal';
import AddFriendModal from './AddFriendModal';
import FriendsList from './FriendsList';
import BalanceSummary from './BalanceSummary';
import QuickActions from './QuickActions';
import NotificationBell from './NotificationBell';

interface DashboardClientProps {
  user: {
     id: string;
     name: string | null;
     email: string;
     avatarUrl: string | null;
     memberships: Array<{
       group: {
         id: string;
         name: string;
         currency: string;
       };
     }>;
  };
}

export default function DashboardClient({ user }: DashboardClientProps) {
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [isAddFriendOpen, setIsAddFriendOpen] = useState(false);
  const [friendsRefreshTrigger, setFriendsRefreshTrigger] = useState(0);

  const handleAddFriendClose = () => {
      setIsAddFriendOpen(false);
      setFriendsRefreshTrigger(prev => prev + 1);
  };

  const firstName = user.name?.split(' ')[0] || 'there';
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 18 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="pb-20 md:pb-0">
      <CreateGroupModal isOpen={isGroupModalOpen} onClose={() => setIsGroupModalOpen(false)} />
      <AddFriendModal isOpen={isAddFriendOpen} onClose={handleAddFriendClose} />
      
      {/* Mobile Header - Visible only on mobile */}
      <div className="md:hidden flex justify-between items-center py-4 px-1">
        <div className="flex items-center space-x-3">
            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold border-2 border-white shadow-sm">
                {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={firstName} className="h-full w-full rounded-full object-cover" />
                ) : (
                    firstName[0]
                )}
            </div>
            <div>
                <p className="text-xs text-gray-500 font-medium">{greeting},</p>
                <h1 className="text-xl font-bold text-gray-900">{firstName}</h1>
            </div>
        </div>
        <NotificationBell />
      </div>

      {/* Desktop Header - Simplified as main nav handles most */}
      <div className="hidden md:block mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>

      <div className="space-y-6">
        {/* Premium Balance Card */}
        <BalanceSummary />

        {/* Quick Actions */}
        <QuickActions 
            onCreateGroup={() => setIsGroupModalOpen(true)}
            onAddFriend={() => setIsAddFriendOpen(true)}
        />

        {/* Groups Section - Redesigned */}
        <div>
             <div className="flex items-center justify-between px-1 mb-3">
                 <h3 className="text-lg font-bold text-gray-900">Your Groups</h3>
                 <Link href="/dashboard/groups" className="text-sm font-medium text-indigo-600 hover:text-indigo-500">
                     See all
                 </Link>
             </div>
             
             {user.memberships.length > 0 ? (
                 <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {user.memberships.slice(0, 3).map((membership) => (
                        <Link key={membership.group.id} href={`/dashboard/groups/${membership.group.id}`}>
                            <div className="group relative flex items-center space-x-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm hover:border-indigo-300 hover:shadow-md transition-all">
                                <div className="h-10 w-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 10.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
                                    </svg>
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors">{membership.group.name}</p>
                                    <p className="truncate text-xs text-gray-500">{membership.group.currency}</p>
                                </div>
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-300 group-hover:text-indigo-400">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                                </svg>
                            </div>
                        </Link>
                    ))}
                 </div>
             ) : (
                <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <p className="text-sm text-gray-500">No groups yet.</p>
                    <button onClick={() => setIsGroupModalOpen(true)} className="mt-2 text-sm font-medium text-indigo-600 hover:text-indigo-500">
                        Create a group
                    </button>
                </div>
             )}
        </div>
        
        <FriendsList 
            currentUser={user} 
            onAddFriend={() => setIsAddFriendOpen(true)}
            refreshTrigger={friendsRefreshTrigger}
        />
      </div>
    </div>
  );
}
