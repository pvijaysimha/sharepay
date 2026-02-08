'use client';

import { signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';

export default function ProfileActions() {
    const router = useRouter();

    const handleSignOut = async () => {
        // Clear custom auth cookie if it exists (by calling logout API) based on how we implemented login
        // But specifically NextAuth signOut handles clearing its own session.
        // If we use custom JWT, we might need a custom logout handler.
        // For now, let's try calling the logout endpoint if we have one, or just deleting cookie.
        // But wait, our /api/auth/logout likely clears the cookie.
        
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
            console.error('Logout error', e);
        }
        
        // Also call NextAuth signOut just in case
        await signOut({ callbackUrl: '/auth/login' });
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <button 
                onClick={handleSignOut}
                className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors group"
            >
                <span className="text-red-600 font-medium group-hover:text-red-700">Sign Out</span>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 text-gray-400 group-hover:text-red-500">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0 0 13.5 3h-6a2.25 2.25 0 0 0-2.25 2.25v13.5A2.25 2.25 0 0 0 7.5 21h6a2.25 2.25 0 0 0 2.25-2.25V15M12 9l-3 3m0 0 3 3m-3-3h12.75" />
                </svg>
            </button>
        </div>
    );
}
