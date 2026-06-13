import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { AdminOperationsCenter } from '@/modules/admin/components/AdminCommandCenter';
import { workspaceHealthService } from '@/modules/admin/services/workspaceHealthService';

export default async function AdminOperationsPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (!['operator', 'platform_admin', 'admin'].includes(user.role)) redirect('/dashboard');

  const data = await workspaceHealthService.getCommandData(user.tenantId);

  return <AdminOperationsCenter data={data} />;
}
