import { redirect } from 'next/navigation';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { onboardingService } from '@/modules/member/services/onboarding-service';

const STEP_ROUTES = [
  '/onboarding/profile',
  '/onboarding/goals',
  '/onboarding/brand',
  '/onboarding/first-content',
  '/onboarding/first-funnel',
];

export default async function OnboardingIndexPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }

  const state = await onboardingService.getState(user.id);

  if (state.completed) {
    redirect('/dashboard');
  }

  const target = STEP_ROUTES[Math.max(0, Math.min(4, state.current_step - 1))];
  redirect(target);
}
