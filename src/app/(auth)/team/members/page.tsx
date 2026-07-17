import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { buildCompatibilityDestination, type RedirectPageProps } from '@/lib/navigation/compatibility-redirect';

export default async function TeamMembersPage({
  searchParams,
}: RedirectPageProps) {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }

  if (!['leader', 'operator'].includes(user.role)) {
    redirect('/dashboard');
  }

  redirect(buildCompatibilityDestination('/admin/team/members', await searchParams, ['member', 'source']));
}
