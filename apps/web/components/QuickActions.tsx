'use client';

import { useRouter } from 'next/navigation';

interface QuickActionsProps {
    onCreateGroup: () => void;
    onAddFriend: () => void;
}

export default function QuickActions({ onCreateGroup, onAddFriend }: QuickActionsProps) {
    const router = useRouter();

    const actions = [
        {
            label: 'Add Expense',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
                </svg>
            ),
            color: 'bg-emerald-100 text-emerald-700',
            onClick: () => router.push('/dashboard/expenses/new')
        },
        {
            label: 'New Group',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM7 10.5a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z" />
                </svg>
            ),
            color: 'bg-indigo-100 text-indigo-700',
            onClick: onCreateGroup
        },
        {
            label: 'Add Friend',
            icon: (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 7.5v3m0 0v3m0-3h3m-3 0h-3m-2.25-4.125a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0ZM4 19.235v-.11a6.375 6.375 0 0 1 12.75 0v.109A12.318 12.318 0 0 1 9.374 21c-2.331 0-4.512-.645-6.374-1.766Z" />
                </svg>
            ),
            color: 'bg-violet-100 text-violet-700',
            onClick: onAddFriend
        },
    ];

    return (
        <section className="mt-6">
            <h3 className="text-sm font-medium text-gray-500 mb-3 px-1">Quick Actions</h3>
            <div className="flex space-x-4 overflow-x-auto pb-2 scrollbar-hide">
                {actions.map((action, idx) => (
                    <button 
                        key={idx}
                        onClick={action.onClick}
                        className="flex flex-col items-center justify-center min-w-[5rem] space-y-2 group"
                    >
                        <div className={`w-14 h-14 rounded-full flex items-center justify-center shadow-sm group-active:scale-95 transition-transform ${action.color}`}>
                            {action.icon}
                        </div>
                        <span className="text-xs font-medium text-gray-600">{action.label}</span>
                    </button>
                ))}
            </div>
        </section>
    );
}
