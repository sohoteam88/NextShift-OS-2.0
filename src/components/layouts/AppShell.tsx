'use client';

import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { MobileTabBar } from './MobileTabBar';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { OnboardingState } from '@/modules/member/types';
import { TenantBranding } from '@/modules/tenant/components/TenantBranding';
import { PLAN_TIERS, type PlanTier } from '@/modules/tenant/constants/plans';

type AppShellProps = {
  children: ReactNode;
  user: AuthUser;
  onboarding: OnboardingState;
  tenant?: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    settings: unknown;
  } | null;
};

const allowedDuringOnboarding = ['/settings', '/member', '/onboarding', '/api/'];

function isAllowedPath(pathname: string) {
  return allowedDuringOnboarding.some((path) => pathname === path || pathname.startsWith(path));
}

function extractBranding(tenant: AppShellProps['tenant']) {
  if (!tenant) return null;

  const plan = (tenant.plan as PlanTier) ?? 'starter';
  const planConfig = PLAN_TIERS[plan] ?? PLAN_TIERS.starter;
  if (!planConfig.custom_branding) return null;

  const settings = tenant.settings && typeof tenant.settings === 'object' && !Array.isArray(tenant.settings)
    ? (tenant.settings as Record<string, unknown>)
    : {};
  const branding = settings.branding && typeof settings.branding === 'object' && !Array.isArray(settings.branding)
    ? (settings.branding as Record<string, unknown>)
    : {};

  return {
    primaryColor: typeof branding.primary_color === 'string' ? branding.primary_color : null,
    logoUrl: typeof settings.logo_url === 'string' ? settings.logo_url : null,
  };
}

export default function AppShell({ children, user, onboarding, tenant }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const isOnboardingPath = pathname.startsWith('/onboarding');
  const shouldRedirect = !onboarding.completed && !isAllowedPath(pathname);
  const branding = extractBranding(tenant);

  useEffect(() => {
    if (shouldRedirect) {
      router.replace('/onboarding');
    }
  }, [router, shouldRedirect]);

  if (shouldRedirect) {
    return <div className="min-h-screen bg-[var(--color-surface)]" />;
  }

  if (isOnboardingPath) {
    return <div className="min-h-screen bg-[var(--color-surface)]">{children}</div>;
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-surface)]">
      <TenantBranding primaryColor={branding?.primaryColor} />
      <TopBar userName={user.name} />
      <div className="flex min-w-0">
        <Sidebar
          className="hidden lg:block"
          role={user.role as 'member' | 'leader' | 'operator' | 'platform_admin'}
          tenantName={tenant?.name}
          tenantLogoUrl={branding?.logoUrl}
        />
        <main className="min-w-0 flex-1 p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:p-6 lg:pb-6">{children}</main>
      </div>
      <MobileTabBar className="lg:hidden" />
    </div>
  );
}

export { AppShell };
