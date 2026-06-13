import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { BetaCommandCenter } from '@/modules/admin/components/BetaCommandCenter';
import { betaCommandService } from '@/modules/admin/services/beta-command-service';

export default async function AdminBetaPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (!['operator', 'platform_admin'].includes(user.role)) redirect('/dashboard');

  const data = await betaCommandService.getTenantReport(user.tenantId);

  return <BetaCommandCenter data={data} />;
}

