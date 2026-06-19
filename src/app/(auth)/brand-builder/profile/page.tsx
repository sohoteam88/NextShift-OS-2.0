import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { ProfilePageClient } from '@/modules/brand-builder/components/wizard/ProfilePageClient';
import { getBrandBuilderProfileViewModel } from '@/modules/brand-builder/adapters/InterviewAuthorityBrandProfileViewModel';

export default async function BrandProfilePage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');

  const brandProfile = await getBrandBuilderProfileViewModel(user.id);

  return <ProfilePageClient initialProfile={brandProfile} />;
}
