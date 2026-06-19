import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { getWizardState } from '@/modules/brand-builder/services/wizard-state-service';
import { ProfileStepClient } from '@/modules/brand-builder/components/wizard/ProfileStepClient';
import { getBrandBuilderProfileViewModel } from '@/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel';

export default async function ProfileStepPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [state, brandProfile] = await Promise.all([
    getWizardState(user.id),
    getBrandBuilderProfileViewModel(user.id),
  ]);

  return (
    <ProfileStepClient
      initialProfile={brandProfile}
      interviewId={state.interview_id}
    />
  );
}
