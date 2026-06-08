import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { TeamOverviewDashboard } from '@/modules/team/components/TeamOverviewDashboard';

export default async function TeamPage({
  searchParams,
}: {
  searchParams?: { member?: string };
}) {
  const user = await getAuthUser();
  const params = searchParams ?? {};

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'member') {
    redirect('/dashboard');
  }

  return <TeamOverviewDashboard user={user} defaultView="tree" initialMemberId={params.member ?? null} />;
}
