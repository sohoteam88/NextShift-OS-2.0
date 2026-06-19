import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { IntelligenceOverview } from '@/modules/brand-intelligence';

export default async function BrandIntelligencePage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  return <IntelligenceOverview userId={user.id} />;
}
