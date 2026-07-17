import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { CeoDashboard, TenantHealthCenter } from '@/modules/admin/components/PlatformOperatingDashboard';
import { AdminCommandDashboard } from '@/modules/admin/components/AdminCommandDashboard';
import { platformOperatingService } from '@/modules/admin/services/platformOperatingService';

export default async function PlatformAdminPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const params = await searchParams;
  const view = Array.isArray(params?.view) ? params.view[0] : params?.view;
  const tab = Array.isArray(params?.tab) ? params.tab[0] : params?.tab;
  if (view === 'command') {
    return <div id="admin-command"><AdminCommandDashboard /></div>;
  }

  const data = await platformOperatingService.getOperatingData();
  if (tab === 'tenants') {
    return <div id="platform-admin-tenants"><TenantHealthCenter data={data} /></div>;
  }
  return <CeoDashboard data={data} />;
}
