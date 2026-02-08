import { getAuthUser } from '../../../lib/auth-utils';
import { prisma } from '@repo/db';
import { redirect } from 'next/navigation';
import ProfileActions from '../../../components/ProfileActions';

export default async function ProfilePage() {
    const authUser = await getAuthUser();
    
    if (!authUser) {
        redirect('/auth/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        select: { name: true, email: true, avatarUrl: true }
    });

    if (!user) return null;

    return (
        <div className="max-w-xl mx-auto pb-24 md:pb-10 space-y-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>
            
            <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200 flex items-center space-x-4">
                <div className="h-16 w-16 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-2xl font-bold border-2 border-white shadow-md">
                    {user.avatarUrl ? (
                        <img src={user.avatarUrl} alt={user.name || 'User'} className="h-full w-full rounded-full object-cover" />
                    ) : (
                        (user.name || 'U')[0]
                    )}
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">{user.name}</h2>
                    <p className="text-sm text-gray-500">{user.email}</p>
                </div>
            </div>

            <ProfileActions />
            
            <div className="text-center text-xs text-gray-400 mt-8">
                SharePay v1.0.0
            </div>
        </div>
    );
}
