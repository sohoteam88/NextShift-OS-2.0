import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { AdminCommandDashboard } from '@/modules/admin/components/AdminCommandDashboard';

export default async function AdminCommandPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  return <div className="py-6 px-4"><AdminCommandDashboard /></div>;
}
