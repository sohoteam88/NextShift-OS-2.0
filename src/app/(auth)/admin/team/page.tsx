import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { AdminTeamCenter } from '@/modules/admin/components/AdminCommandCenter';
import { workspaceHealthService } from '@/modules/admin/services/workspaceHealthService';
import { TeamOverviewDashboard } from '@/modules/team/components/TeamOverviewDashboard';

export default async function AdminTeamPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (!['leader', 'operator'].includes(user.role)) redirect('/dashboard');

  if (user.role === 'leader') {
    return <TeamOverviewDashboard user={user} defaultView="tree" initialMemberId={null} />;
  }

  const data = await workspaceHealthService.getCommandData(user.tenantId);

  return <AdminTeamCenter data={data} />;
}
