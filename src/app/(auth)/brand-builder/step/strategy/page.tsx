import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { StrategyStepClient } from '@/modules/brand-builder/components/wizard/StrategyStepClient';
import { getBrandBuilderProfileViewModel } from '@/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel';

export default async function StrategyStepPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const brandProfile = await getBrandBuilderProfileViewModel(user.id);

  return <StrategyStepClient brandProfile={brandProfile} />;
}
