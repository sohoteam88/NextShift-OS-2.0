import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { DailyActionsConfig } from '@/modules/admin/components/DailyActionsConfig';

export default async function AdminDailyActionsPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (!['operator', 'platform_admin'].includes(user.role)) redirect('/dashboard');

  return <DailyActionsConfig />;
}
