import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';

export default async function OnboardingIndexPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }

  redirect('/brand-builder');
}
