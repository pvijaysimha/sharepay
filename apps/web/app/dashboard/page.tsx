import { redirect } from 'next/navigation';
import { getAuthUser } from '../../lib/auth-utils';
import { prisma } from '@repo/db';
import DashboardClient from '../../components/DashboardClient';

async function getUser() {
  const authUser = await getAuthUser();
  
  if (!authUser) return null;

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

  return user;
}

export default async function DashboardPage() {
  const user = await getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return <DashboardClient user={user} />;
}
