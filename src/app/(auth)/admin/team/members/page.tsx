import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { TeamOverviewDashboard } from '@/modules/team/components/TeamOverviewDashboard';

export default async function AdminTeamMembersPage({ searchParams }: { searchParams?: Promise<{ member?: string }> }) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (!['leader', 'operator'].includes(user.role)) redirect('/dashboard');
  const params = await searchParams;
  return <TeamOverviewDashboard user={user} defaultView="list" initialMemberId={params?.member ?? null} />;
}
