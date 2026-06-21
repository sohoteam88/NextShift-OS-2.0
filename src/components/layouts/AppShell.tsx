'use client';

import { type ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { MobileTabBar } from './MobileTabBar';
import { TopBar } from './TopBar';
import { AdminSidebar } from './AdminSidebar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { OnboardingState } from '@/modules/member/types';
import { TenantBranding } from '@/modules/tenant/components/TenantBranding';
import { PLAN_TIERS, type PlanTier } from '@/modules/tenant/constants/plans';
import { ExecutionRoadmapRail } from '@/modules/mission/components/ExecutionRoadmapRail';
import { MissionListener } from '@/modules/mission/components/MissionListener';

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
  const isOnboardingPath = pathname.startsWith('/onboarding');
  const isWizardPath = pathname.startsWith('/brand-builder/step');
  const isAdminRole = ['operator', 'platform_admin', 'admin'].includes(user.role);
  const isAdminExperience = pathname.startsWith('/admin') || pathname.startsWith('/workspace') || (isAdminRole && pathname.startsWith('/settings'));
  const adminHomeHref = user.role === 'platform_admin' ? '/platform-admin' : '/admin';
  void onboarding;
  const branding = extractBranding(tenant);

  if (isOnboardingPath || isWizardPath) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)]">
        {children}
        <MissionListener />
      </div>
    );
  }

  // Platform admin gets a dedicated admin console shell
  if (user.role === 'platform_admin' && pathname.startsWith('/platform-admin')) {
    return (
      <PlatformAdminShell userName={user.name} pathname={pathname}>
        {children}
      </PlatformAdminShell>
    );
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-[var(--color-surface)]">
      <TenantBranding primaryColor={branding?.primaryColor} />
      <TopBar
        userName={user.name}
        userRole={user.role as 'member' | 'leader' | 'operator' | 'platform_admin'}
        tenantName={tenant?.name}
        tenantLogoUrl={branding?.logoUrl}
        showExecutionRoadmap={!isAdminExperience}
        homeHref={isAdminExperience ? adminHomeHref : '/dashboard'}
      />
      {isAdminExperience ? null : <ExecutionRoadmapRail />}
      <main className="mx-auto min-w-0 max-w-[1440px] p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:p-6 lg:pb-6">
        {children}
      </main>
      {isAdminExperience ? null : <MobileTabBar className="lg:hidden" />}
      <MissionListener />
    </div>
  );
}

function PlatformAdminShell({ userName, pathname, children }: { userName: string; pathname: string; children: ReactNode }) {
  const t = useTranslations('platformAdmin');

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: t('platformAdmin'), href: '/platform-admin' }];
    const segments = pathname.replace('/platform-admin', '').split('/').filter(Boolean);

    const labelMap: Record<string, string> = {
      'revenue': t('revenueIntel'),
      'tenant-health': t('tenantHealth'),
      'ai-profitability': t('aiProfitabilityTitle'),
      'growth': t('growth'),
      'funnels': t('funnelIntelTitle'),
      'ai-usage': t('aiUsageTitle'),
      'beta': t('betaTitle'),
      'health': t('healthTitle'),
      'users': t('users'),
      'billing': t('billingTitle'),
      'audit-logs': t('title'),
      'tenants': t('tenants'),
    };

    let currentPath = '/platform-admin';
    for (const seg of segments) {
      currentPath += `/${seg}`;
      items.push({ label: labelMap[seg] ?? seg.replace(/-/g, ' '), href: currentPath });
    }

    return items;
  }, [pathname, t]);

  return (
    <div className="flex h-screen overflow-hidden">
      <AdminSidebar userName={userName} />
      <div className="flex flex-1 flex-col overflow-hidden">
        <div className="flex h-10 shrink-0 items-center border-b border-[var(--color-border)] bg-white px-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <main className="flex-1 overflow-y-auto bg-[var(--color-surface)] p-6 xl:p-8">
          {children}
        </main>
      </div>
      <MissionListener />
    </div>
  );
}

export { AppShell };
