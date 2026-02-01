import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyAuth } from '../../lib/auth-utils';
import { prisma } from '@repo/db';
import DashboardClient from '../../components/DashboardClient';

async function getUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get('token')?.value;

  if (!token) return null;

  const payload = await verifyAuth(token);
  if (!payload || !payload.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: payload.userId },
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

