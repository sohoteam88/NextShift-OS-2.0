import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { BetaCommandCenter } from '@/modules/admin/components/BetaCommandCenter';
import { betaCommandService } from '@/modules/admin/services/beta-command-service';

export default async function PlatformAdminBetaPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const data = await betaCommandService.getTenantReport(user.tenantId);

  return <BetaCommandCenter data={data} />;
}
