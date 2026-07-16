import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { CeoDashboard } from '@/modules/admin/components/PlatformOperatingDashboard';
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
  if (params?.view === 'command') {
    return <div id="admin-command"><AdminCommandDashboard /></div>;
  }

  const data = await platformOperatingService.getOperatingData();
  return <CeoDashboard data={data} />;
}
