import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { AdminSettingsPanel } from '@/modules/admin/components/AdminSettingsPanel';

export default async function AdminSettingsPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (!['operator', 'platform_admin'].includes(user.role)) redirect('/dashboard');

  return <AdminSettingsPanel />;
}
