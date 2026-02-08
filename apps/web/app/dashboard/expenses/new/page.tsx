import { getAuthUser } from '../../../../lib/auth-utils';
import { PrismaClient } from '@prisma/client';
import AddExpenseForm from '../../../../components/AddExpenseForm';
import { redirect } from 'next/navigation';

const prisma = new PrismaClient();

export default async function NewExpensePage() {
    const authUser = await getAuthUser();
    if (!authUser) {
        redirect('/auth/login');
    }

    const user = await prisma.user.findUnique({
        where: { id: authUser.id },
        include: {
            memberships: {
                include: {
                    group: true
                }
            }
        }
    });

    if (!user) {
        redirect('/auth/login');
    }

    const groups = user.memberships.map(m => m.group);

    return (
        <div className="max-w-xl mx-auto pb-24 md:pb-10">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">Add New Expense</h1>
            <AddExpenseForm 
                currentUser={user} 
                groups={groups} 
            />
        </div>
    );
}
