import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { DashboardV4 } from '@/modules/dashboard/components/DashboardV4';
import { onboardingService } from '@/modules/member/services/onboarding-service';

export default async function DashboardPage() {
  const user = await getAuthUser();

  if (!user) {
    redirect('/login');
  }

  if (user.role === 'member') {
    const onboarding = await onboardingService.getState(user.id);
    if (!onboarding.completed) {
      redirect('/onboarding');
    }

    return <DashboardV4 />;
  }

  if (user.role === 'platform_admin') {
    redirect('/admin');
  }

  return <DashboardV4 />;
}
