import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { GuidesStepClient } from '@/modules/brand-builder/components/wizard/GuidesStepClient';

export default async function GuidesStepPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true, phone: true } });
  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const brandProfile = (meta.brand_profile as Record<string, unknown>) ?? {};

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
