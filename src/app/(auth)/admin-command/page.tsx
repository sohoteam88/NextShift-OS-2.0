import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import {
  buildCompatibilityDestination,
  type RedirectPageProps,
} from '@/lib/navigation/compatibility-redirect';

export default async function AdminCommandPage({ searchParams }: RedirectPageProps) {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  redirect(buildCompatibilityDestination('/platform-admin?view=command', await searchParams));
}
