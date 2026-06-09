import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { getWizardState } from '@/modules/brand-builder/services/wizard-state-service';
import { InterviewStepClient } from '@/modules/brand-builder/components/wizard/InterviewStepClient';

export default async function InterviewStepPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const state = await getWizardState(user.id);

  return <InterviewStepClient existingInterviewId={state.interview_id} />;
}
