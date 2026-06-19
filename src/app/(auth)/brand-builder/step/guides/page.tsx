import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { GuidesStepClient } from '@/modules/brand-builder/components/wizard/GuidesStepClient';
import { getBrandBuilderProfileViewModel } from '@/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel';

export default async function GuidesStepPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const [brandProfile, dbUser] = await Promise.all([
    getBrandBuilderProfileViewModel(user.id),
    prisma.user.findUnique({ where: { id: user.id }, select: { phone: true } }),
  ]);

  const platforms = (brandProfile.platforms as string[] | undefined) ?? ['facebook'];
  const phone = (dbUser?.phone as string | undefined) ?? '';
  const funnelUrl = (brandProfile.funnelUrl as string | undefined) ?? '';

  return (
    <GuidesStepClient
      brandProfile={brandProfile}
      platforms={platforms}
      phone={phone}
      funnelUrl={funnelUrl}
    />
  );
}
