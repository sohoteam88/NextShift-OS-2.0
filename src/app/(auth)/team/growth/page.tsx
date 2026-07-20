import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import {
  buildCompatibilityDestination,
  type RedirectPageProps,
} from '@/lib/navigation/compatibility-redirect';

export default async function TeamGrowthPage({ searchParams }: RedirectPageProps) {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (user.role !== 'operator') redirect('/dashboard');

  redirect(buildCompatibilityDestination('/admin/team', await searchParams));
}
