import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { DashboardV4 } from '@/modules/dashboard/components/DashboardV4';

export default async function DashboardPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'platform_admin') {
    redirect('/superadmin');
  }

  return <DashboardV4 />;
}
