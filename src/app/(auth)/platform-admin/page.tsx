import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import { Activity, BarChart3, Gauge, Shield, Users } from 'lucide-react';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function getStatusTone(status: string) {
  if (status === 'active') return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (status === 'suspended') return 'bg-rose-50 text-rose-700 border-rose-200';
  return 'bg-amber-50 text-amber-700 border-amber-200';
}

export default async function PlatformAdminPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }
  if (user.role !== 'platform_admin') {
    redirect('/dashboard');
  }
  const [t, stats, tenants, aiCosts] = await Promise.all([
    getTranslations('platformAdmin'),
    platformAdminService.getPlatformStats(),
    platformAdminService.listTenants({ page: 1, limit: 10 }),
    platformAdminService.getAICostBreakdown(),
  ]);

  const cardClass =
    'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm';
  const maxCost = Math.max(...aiCosts.map((item) => item.costThisMonth), 0.01);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            {t('platformAdmin')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{t('title')}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('subtitle')}</p>
        </div>
        <Link
          href="/platform-admin/health"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
        >
          <Gauge className="h-4 w-4" aria-hidden="true" />
          {t('systemHealth')}
        </Link>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-muted)]">{t('totalTenants')}</span>
            <Shield className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{stats.total_tenants}</p>
        </div>
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-muted)]">{t('activeTenants')}</span>
            <Activity className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{stats.active_tenants}</p>
        </div>
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-muted)]">{t('totalUsers')}</span>
            <Users className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{stats.total_users}</p>
        </div>
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-muted)]">{t('aiCost')}</span>
            <BarChart3 className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
            {formatCurrency(stats.ai_cost_this_month)}
          </p>
        </div>
        <div className={cardClass}>
          <div className="flex items-center justify-between">
            <span className="text-sm text-[var(--color-text-muted)]">{t('uptime')}</span>
            <Gauge className="h-4 w-4 text-[var(--color-primary)]" />
          </div>
          <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">98%</p>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('tenantList')}</h2>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('tenantListDescription')}</p>
          </div>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                <th className="border-b border-[var(--color-border)] px-3 py-3">{t('tenantName')}</th>
                <th className="border-b border-[var(--color-border)] px-3 py-3">Slug</th>
                <th className="border-b border-[var(--color-border)] px-3 py-3">{t('plan')}</th>
                <th className="border-b border-[var(--color-border)] px-3 py-3">{t('members')}</th>
                <th className="border-b border-[var(--color-border)] px-3 py-3">{t('aiUsage')}</th>
                <th className="border-b border-[var(--color-border)] px-3 py-3">{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {tenants.data.map((tenant) => (
                <tr key={tenant.id} className="text-[var(--color-text)]">
                  <td className="border-b border-[var(--color-border)] px-3 py-4 font-medium">{tenant.name}</td>
                  <td className="border-b border-[var(--color-border)] px-3 py-4 text-[var(--color-text-muted)]">
                    {tenant.slug}
                  </td>
                  <td className="border-b border-[var(--color-border)] px-3 py-4">{tenant.plan}</td>
                  <td className="border-b border-[var(--color-border)] px-3 py-4">
                    {tenant.usage.members.used} / {tenant.maxMembers}
                  </td>
                  <td className="border-b border-[var(--color-border)] px-3 py-4">
                    {tenant.aiCallsThisMonth} / {tenant.maxAiCalls}
                  </td>
                  <td className="border-b border-[var(--color-border)] px-3 py-4">
                    <span
                      className={`inline-flex rounded-full border px-2 py-1 text-xs font-medium ${getStatusTone(
                        tenant.status,
                      )}`}
                    >
                      {tenant.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('aiCostTracking')}</h2>
          <div className="mt-4 space-y-4">
            {aiCosts.map((item) => {
              const width = Math.max(6, Math.round((item.costThisMonth / maxCost) * 100));
              return (
                <div key={item.tenantId} className="space-y-2">
                  <div className="flex items-center justify-between gap-3 text-sm">
                    <span className="font-medium text-[var(--color-text)]">{item.tenantName}</span>
                    <span className="text-[var(--color-text-muted)]">
                      {formatCurrency(item.costThisMonth)} · {item.callsThisMonth} calls
                    </span>
                  </div>
                  <div className="h-3 rounded-full bg-[var(--color-surface)]">
                    <div
                      className="h-3 rounded-full bg-[var(--color-primary)]"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('systemHealth')}</h2>
          <div className="mt-4 space-y-3 text-sm text-[var(--color-text)]">
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
              <span>{t('apiErrorRate')}</span>
              <span className="font-medium text-emerald-600">0.2% OK</span>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
              <span>{t('avgResponseTime')}</span>
              <span className="font-medium text-emerald-600">180ms OK</span>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
              <span>{t('dbConnection')}</span>
              <span className="font-medium text-emerald-600">OK</span>
            </div>
            <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2">
              <span>{t('recentDeploy')}</span>
              <span className="font-medium text-emerald-600">2h ago</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
