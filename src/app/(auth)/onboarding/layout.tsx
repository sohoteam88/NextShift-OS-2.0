import type { ReactNode } from 'react';
import { OnboardingShell } from '@/modules/member/components/OnboardingShell';

export default function OnboardingLayout({ children }: { children: ReactNode }) {
  return <OnboardingShell>{children}</OnboardingShell>;
}
