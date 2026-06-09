import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { StrategyStepClient } from '@/modules/brand-builder/components/wizard/StrategyStepClient';

export default async function StrategyStepPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const brandProfile = (meta.brand_profile as Record<string, unknown>) ?? {};

  return <StrategyStepClient brandProfile={brandProfile} />;
}
