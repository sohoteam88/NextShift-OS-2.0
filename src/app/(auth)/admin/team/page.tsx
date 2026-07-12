import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { AdminTeamCenter } from '@/modules/admin/components/AdminCommandCenter';
import { workspaceHealthService } from '@/modules/admin/services/workspaceHealthService';

export default async function AdminTeamPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (!['operator', 'platform_admin'].includes(user.role)) redirect('/dashboard');

  const data = await workspaceHealthService.getCommandData(user.tenantId);

  return <AdminTeamCenter data={data} />;
}
