import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { PlatformFunnelsDashboard } from '@/modules/admin/components/PlatformOperatingDashboard';
import { platformOperatingService } from '@/modules/admin/services/platformOperatingService';

export default async function SuperadminFunnelsPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const data = await platformOperatingService.getOperatingData();

  return <PlatformFunnelsDashboard data={data} />;
}
