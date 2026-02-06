'use client';

import { useState } from 'react';
import Link from 'next/link';
import CreateGroupModal from './CreateGroupModal';
import FriendsList from './FriendsList';
import BalanceSummary from './BalanceSummary';

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
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="bg-white shadow sm:rounded-lg">
      <CreateGroupModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
      
      <div className="px-4 py-5 sm:p-6">
        <div className="md:flex md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <h3 className="text-base font-semibold leading-6 text-gray-900">
              Welcome back, {user.name}!
            </h3>
            <div className="mt-2 max-w-xl text-sm text-gray-500">
                <p>You are a member of {user.memberships.length} groups.</p>
            </div>
          </div>
          <div className="mt-4 flex md:ml-4 md:mt-0">
            <button
              onClick={() => setIsModalOpen(true)}
              type="button"
              className="ml-3 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Create New Group
            </button>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
           <div className="overflow-hidden rounded-lg bg-white shadow">
              <div className="p-5">
                 <div className="flex items-center">
                    <div className="flex-shrink-0">
                       <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                       </svg>
                    </div>
                    <div className="ml-5 w-0 flex-1">
                       <dl>
                          <dt className="truncate text-sm font-medium text-gray-500">Total Groups</dt>
                          <dd>
                             <div className="text-lg font-medium text-gray-900">{user.memberships.length}</div>
                          </dd>
                       </dl>
                    </div>
                 </div>
              </div>
              <div className="bg-gray-50 px-5 py-3">
                 <div className="text-sm">
                    <Link href="/dashboard/groups" className="font-medium text-indigo-700 hover:text-indigo-900">
                       View all
                    </Link>
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-8">
             <h2 className="text-lg font-medium leading-6 text-gray-900">Your Groups</h2>
             <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                {user.memberships.slice(0, 4).map((membership) => (
                    <div key={membership.group.id} className="relative flex items-center space-x-3 rounded-lg border border-gray-300 bg-white px-6 py-5 shadow-sm focus-within:ring-2 focus-within:ring-indigo-500 focus-within:ring-offset-2 hover:border-gray-400">
                        <div className="min-w-0 flex-1">
                            {/* Link to specific group details */}
                            <Link href={`/dashboard/groups/${membership.group.id}`} className="focus:outline-none">
                                <span className="absolute inset-0" aria-hidden="true" />
                                <p className="text-sm font-medium text-gray-900">{membership.group.name}</p>
                                <p className="truncate text-sm text-gray-500">{membership.group.currency}</p>
                            </Link>
                        </div>
                    </div>
                ))}
                {user.memberships.length === 0 && (
                    <p className="text-gray-500 text-sm">You haven't joined any groups yet.</p>
                )}
             </div>
        </div>

        <BalanceSummary />
        
        <FriendsList currentUser={user} />
      </div>
    </div>
  );
}
