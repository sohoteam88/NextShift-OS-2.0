import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { TemplatesPanel } from '@/modules/admin/components/TemplatesPanel';

export default async function AdminTemplatesPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (!['operator', 'platform_admin'].includes(user.role)) redirect('/dashboard');

  return <TemplatesPanel />;
}
