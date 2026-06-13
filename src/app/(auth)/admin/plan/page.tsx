import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getTranslations } from 'next-intl/server';
import { ArrowUpRight, BarChart3, CreditCard } from 'lucide-react';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { getTenantById } from '@/modules/tenant/services/tenant-resolution';
import { PLAN_TIERS } from '@/modules/tenant/constants/plans';
import { tenantService } from '@/modules/tenant/services/tenant-service';

function formatPercent(used: number, limit: number) {
  if (limit <= 0) return 0;
  return Math.min(100, Math.round((used / limit) * 100));
}

function formatCount(used: number, limit: number) {
  return `${used} / ${limit}`;
}

function usageBar(used: number, limit: number) {
  return `${Math.max(6, formatPercent(used, limit))}%`;
}

export default async function AdminPlanPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect('/login');
  }
  if (!['operator', 'platform_admin'].includes(user.role)) {
    redirect('/dashboard');
  }
  const [tenant, usage, t] = await Promise.all([
    getTenantById(user.tenantId),
    tenantService.getUsage(user.tenantId),
    getTranslations('platformAdmin'),
  ]);
  if (!tenant || !usage) {
    redirect('/login');
  }

  const planKey = (tenant.plan as keyof typeof PLAN_TIERS) in PLAN_TIERS ? (tenant.plan as keyof typeof PLAN_TIERS) : 'starter';
  const currentPlan = PLAN_TIERS[planKey];
  const planOrder: Array<keyof typeof PLAN_TIERS> = ['starter', 'growth', 'pro'];
  const planCards = planOrder.map((key) => {
    const plan = PLAN_TIERS[key];
    const isCurrent = key === planKey;
    return { key, plan, isCurrent };
  });

  const rows = [
    { label: t('members'), used: usage.members.used, limit: usage.members.limit },
    { label: t('aiCalls'), used: usage.ai_calls.used, limit: usage.ai_calls.limit },
    { label: t('funnels'), used: usage.funnels.used, limit: usage.funnels.limit },
    { label: t('storage'), used: usage.storage_mb.used, limit: usage.storage_mb.limit },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            {t('planManagement')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">
            {t('currentPlan')}: {currentPlan.name}
          </h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('planDescription')}</p>
        </div>
        <Link
          href="/admin"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
        >
          <BarChart3 className="h-4 w-4" aria-hidden="true" />
          {t('adminHub')}
        </Link>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('currentUsage')}</h2>
        <div className="mt-4 space-y-4">
          {rows.map((row) => (
            <div key={row.label} className="space-y-2">
              <div className="flex items-center justify-between gap-3 text-sm">
                <span className="font-medium text-[var(--color-text)]">{row.label}</span>
                <span className="text-[var(--color-text-muted)]">{formatCount(row.used, row.limit)}</span>
              </div>
              <div className="h-3 rounded-full bg-[var(--color-surface)]">
                <div
                  className="h-3 rounded-full bg-[var(--color-primary)]"
                  style={{ width: usageBar(row.used, row.limit) }}
                />
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('upgradeOptions')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('upgradeDescription')}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {planCards.map(({ key, plan, isCurrent }) => (
            <div
              key={key}
              className={`rounded-[var(--radius-lg)] border p-5 shadow-sm ${
                isCurrent
                  ? 'border-[var(--color-primary)] bg-blue-50/60 ring-1 ring-[var(--color-primary)]'
                  : 'border-[var(--color-border)] bg-white'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-xl font-semibold text-[var(--color-text)]">
                    {plan.name}
                  </h3>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">MYR RM{plan.price_myr}/month</p>
                </div>
                {isCurrent ? (
                  <span className="rounded-full bg-emerald-50 px-2 py-1 text-xs font-medium text-emerald-700">
                    {t('current')}
                  </span>
                ) : null}
              </div>

              <div className="mt-4 space-y-2 text-sm text-[var(--color-text)]">
                <div className="flex items-center justify-between">
                  <span>{t('members')}</span>
                  <span>{plan.max_members}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('aiCalls')}</span>
                  <span>{plan.max_ai_calls}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('funnels')}</span>
                  <span>{plan.max_funnels >= 999 ? t('unlimited') : plan.max_funnels}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>{t('storage')}</span>
                  <span>{plan.max_storage_mb / 1024} GB</span>
                </div>
              </div>

              <div className="mt-5">
                <button
                  type="button"
                  disabled={isCurrent}
                  className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)] disabled:cursor-not-allowed disabled:bg-[var(--color-text-muted)]"
                >
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                  {isCurrent ? t('current') : t('upgrade')}
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <CreditCard className="h-4 w-4" aria-hidden="true" />
          {t('contactSupport')}
        </div>
      </section>
    </div>
  );
}
