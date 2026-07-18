import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { GrowthDashboard } from '@/modules/admin/components/PlatformOperatingDashboard';
import { platformOperatingService } from '@/modules/admin/services/platformOperatingService';

export default async function SuperadminGrowthPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const data = await platformOperatingService.getOperatingData();

  return <GrowthDashboard data={data} />;
}
