import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Building2, DollarSign, TrendingUp, Zap } from 'lucide-react';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

function formatMoney(value: number) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: 2,
  }).format(value);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('en-US').format(value);
}

export default async function BillingPage() {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const [stats, aiCosts] = await Promise.all([
    platformAdminService.getPlatformStats(),
    platformAdminService.getAICostBreakdown(),
  ]);

  const totalAiCost = stats.ai_cost_this_month;
  const activeTenants = stats.active_tenants;
  const avgCostPerTenant = activeTenants > 0 ? totalAiCost / activeTenants : 0;
  const maxCost = Math.max(...aiCosts.map((tenant) => tenant.costThisMonth), 0.01);
  const totalPlans = Object.values(stats.tenants_by_plan).reduce((sum, count) => sum + count, 0);

  const summaryCards = [
    { label: '本月 AI 成本', value: formatMoney(totalAiCost), helper: '所有租户累计', icon: DollarSign },
    { label: 'API 调用', value: formatNumber(stats.ai_calls_this_month), helper: '本月总调用量', icon: Zap },
    { label: '平均成本 / 租户', value: formatMoney(avgCostPerTenant), helper: `${activeTenants} 个活跃租户`, icon: TrendingUp },
    { label: '活跃租户', value: activeTenants, helper: `总租户 ${stats.total_tenants}`, icon: Building2 },
  ];

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-[var(--color-text-muted)]">平台管理</p>
          <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">账单与成本</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            追踪本月 AI 成本、调用量和各租户的使用分布。
          </p>
        </div>
        <Link
          href="/platform-admin/ai-usage"
          className="inline-flex h-10 items-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
        >
          查看 AI 用量明细
        </Link>
      </div>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map(({ label, value, helper, icon: Icon }) => (
          <div key={label} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
              <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            </div>
            <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p>
          </div>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[1.35fr_0.75fr]">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">租户成本排行</h2>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">优先关注成本最高的租户。</p>
            </div>
            <span className="rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-1 text-xs text-[var(--color-text-muted)]">
              MTD
            </span>
          </div>

          {aiCosts.length === 0 ? (
            <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] px-4 py-10 text-center text-sm text-[var(--color-text-muted)]">
              本月还没有 AI 用量记录。
            </div>
          ) : (
            <div className="space-y-4">
              {aiCosts.map((tenant) => {
                const barWidth = Math.max(4, Math.round((tenant.costThisMonth / maxCost) * 100));
                const pct = totalAiCost > 0 ? Math.round((tenant.costThisMonth / totalAiCost) * 100) : 0;

                return (
                  <div key={tenant.tenantId} className="space-y-2">
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[var(--color-text)]">{tenant.tenantName}</p>
                        <p className="mt-0.5 text-xs text-[var(--color-text-muted)]">
                          {formatNumber(tenant.callsThisMonth)} 次调用 · <span className="capitalize">{tenant.plan}</span>
                        </p>
                      </div>
                      <div className="shrink-0 text-right">
                        <p className="text-sm font-semibold text-[var(--color-text)]">{formatMoney(tenant.costThisMonth)}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{pct}%</p>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[var(--color-surface)]">
                      <div
                        className="h-2 rounded-full bg-[var(--color-primary)]"
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--color-text)]">套餐分布</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">快速判断收入结构和升级机会。</p>
          <div className="mt-5 space-y-3">
            {Object.entries(stats.tenants_by_plan).map(([plan, count]) => {
              const pct = totalPlans > 0 ? Math.round((count / totalPlans) * 100) : 0;

              return (
                <div key={plan} className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium capitalize text-[var(--color-text)]">{plan}</span>
                    <span className="font-semibold text-[var(--color-text)]">{count}</span>
                  </div>
                  <div className="mt-2 h-1.5 rounded-full bg-white">
                    <div className="h-1.5 rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.max(4, pct)}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-[var(--color-text-muted)]">{pct}% 的租户</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
