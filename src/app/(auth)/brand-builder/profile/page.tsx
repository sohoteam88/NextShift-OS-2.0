import { redirect } from 'next/navigation';
import prisma from '@/lib/prisma';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { ProfilePageClient } from '@/modules/brand-builder/components/wizard/ProfilePageClient';

export default async function BrandProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
  const meta = (dbUser?.metadata as Record<string, unknown>) ?? {};
  const brandProfile = (meta.brand_profile as Record<string, unknown>) ?? {};

  return <ProfilePageClient initialProfile={brandProfile} />;
}
