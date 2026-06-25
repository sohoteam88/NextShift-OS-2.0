import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { OnboardingShell } from '@/modules/member/components/OnboardingShell';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { homeRouteForRole, isAdminRole } from '@/modules/auth/services/auth-routing';

export default async function OnboardingLayout({ children }: { children: ReactNode }) {
  const user = await getAuthUser();

  if (user && isAdminRole(user.role)) {
    redirect(homeRouteForRole(user.role));
  }

  return <OnboardingShell>{children}</OnboardingShell>;
}
