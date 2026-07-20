import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';

export default async function PlatformAdminPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  redirect('/superadmin');
}
