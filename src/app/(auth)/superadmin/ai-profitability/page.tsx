import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { AiProfitabilityDashboard } from '@/modules/admin/components/PlatformOperatingDashboard';
import { platformOperatingService } from '@/modules/admin/services/platformOperatingService';

export default async function SuperadminAiProfitabilityPage() {
  const user = await getAuthUser();

  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const data = await platformOperatingService.getOperatingData();

  return <AiProfitabilityDashboard data={data} />;
}
