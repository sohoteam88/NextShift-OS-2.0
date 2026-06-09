import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { getWizardState } from '@/modules/brand-builder/services/wizard-state-service';
import { ProfileStepClient } from '@/modules/brand-builder/components/wizard/ProfileStepClient';

export default async function ProfileStepPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [state, dbUser] = await Promise.all([
    getWizardState(user.id),
    prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } }),
  ]);

  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const brandProfile = (meta.brand_profile as Record<string, unknown>) ?? {};

  return (
    <ProfileStepClient
      initialProfile={brandProfile}
      interviewId={state.interview_id}
    />
  );
}
