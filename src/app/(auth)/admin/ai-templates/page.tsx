import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';

export default async function AIAdminTemplatesPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (!['operator', 'platform_admin'].includes(user.role)) redirect('/dashboard');
  redirect('/admin/templates');
}
