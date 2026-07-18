'use client';

import { type ReactNode, useMemo } from 'react';
import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { MobileTabBar } from './MobileTabBar';
import { TopBar } from './TopBar';
import { AdminSidebar } from './AdminSidebar';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { OnboardingState } from '@/modules/member/types';
import { TenantBranding } from '@/modules/tenant/components/TenantBranding';
import { PLAN_TIERS, type PlanTier } from '@/modules/tenant/constants/plans';
import { MissionListener } from '@/modules/mission/components/MissionListener';
import { isMemberFacingRole } from './navigation-access';

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
  const isAdminExperience = pathname.startsWith('/admin') || pathname.startsWith('/superadmin');
  const adminHomeHref = pathname.startsWith('/superadmin') ? '/superadmin' : '/admin';
  const branding = extractBranding(tenant);

  if (isOnboardingPath || isWizardPath) {
    return (
      <div className="min-h-screen bg-[var(--color-surface)]">
        {children}
        <MissionListener />
      </div>
    );
  }

  if (['leader', 'operator'].includes(user.role) && pathname.startsWith('/admin')) {
    return <TeamAdminShell userName={user.name} tenantName={tenant?.name ?? 'Tenant'}>{children}</TeamAdminShell>;
  }

  // Platform administration is intentionally a different shell and namespace.
  if (user.role === 'platform_admin' && pathname.startsWith('/superadmin')) {
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
        showWorkspaceNavigation={!isAdminExperience}
        homeHref={isAdminExperience ? adminHomeHref : '/dashboard'}
      />
      <main className="mx-auto min-w-0 max-w-[1440px] p-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] lg:p-6 xl:pb-6">
        {children}
      </main>
      {isMemberFacingRole(user.role) ? (
        <MobileTabBar
          activationMode={!onboarding.completed}
          className="xl:hidden"
        />
      ) : null}
      <MissionListener />
    </div>
  );
}

function TeamAdminShell({ userName, tenantName, children }: { userName: string; tenantName: string; children: ReactNode }) {
  const links = [
    ['/admin', 'Overview'],
    ['/admin/team', 'Team'],
    ['/admin/members', 'Members'],
    ['/admin/approvals', 'Approvals'],
    ['/admin/settings', 'Settings'],
  ] as const;
  return (
    <div className="min-h-screen bg-[var(--color-surface)]">
      <header className="flex items-center justify-between border-b border-[var(--color-border)] bg-white px-4 py-3 lg:px-6">
        <div><span className="mr-2 rounded bg-slate-900 px-2 py-1 text-xs font-bold tracking-widest text-white">ADMIN</span><span className="text-sm text-[var(--color-text-muted)]">{tenantName}</span></div>
        <span className="text-sm text-[var(--color-text-muted)]">{userName}</span>
      </header>
      <nav aria-label="Tenant administration navigation" className="flex gap-1 overflow-x-auto border-b border-[var(--color-border)] bg-white px-3 py-2 [scrollbar-width:none]">
        {links.map(([href, label]) => <Link key={href} href={href} className="min-h-11 shrink-0 rounded-md px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">{label}</Link>)}
      </nav>
      <main className="mx-auto max-w-[1440px] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] lg:p-6">{children}</main>
    </div>
  );
}

function PlatformAdminShell({ userName, pathname, children }: { userName: string; pathname: string; children: ReactNode }) {
  const t = useTranslations('platformAdmin');

  const breadcrumbItems = useMemo(() => {
    const items = [{ label: 'PLATFORM', href: '/superadmin' }];
    const segments = pathname.replace('/superadmin', '').split('/').filter(Boolean);

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

    let currentPath = '/superadmin';
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
        <div className="flex min-h-10 shrink-0 items-center overflow-x-auto border-b border-[var(--color-border)] bg-white px-4 xl:px-6">
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <nav aria-label="Mobile platform administration navigation" className="flex shrink-0 gap-1 overflow-x-auto border-b border-slate-700 bg-slate-900 px-3 py-2 text-white [scrollbar-width:none] xl:hidden">
          {[
            ['/superadmin', 'Platform'],
            ['/superadmin/tenants', 'Tenants'],
            ['/superadmin/users', 'Users'],
            ['/superadmin/health', 'Health'],
            ['/superadmin/audit-logs', 'Audit'],
          ].map(([href, label]) => <Link key={href} href={href} aria-current={pathname === href ? 'page' : undefined} className="min-h-11 shrink-0 rounded-md px-3 py-2 text-sm font-semibold hover:bg-slate-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white">{label}</Link>)}
        </nav>
        <main className="flex-1 overflow-y-auto bg-[var(--color-surface)] p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] xl:p-8">
          {children}
        </main>
      </div>
      <MissionListener />
    </div>
  );
}

export { AppShell };
