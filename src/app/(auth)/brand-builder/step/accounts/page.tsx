import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { AccountsStepClient } from '@/modules/brand-builder/components/wizard/AccountsStepClient';
import { getBrandBuilderProfileViewModel } from '@/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel';

export default async function AccountsStepPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const brandProfile = await getBrandBuilderProfileViewModel(user.id);

  return <AccountsStepClient brandProfile={brandProfile} />;
}
