import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';

export default async function WorkspacePage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (!['operator', 'platform_admin', 'admin'].includes(user.role)) redirect('/dashboard');

  redirect('/admin');
}
