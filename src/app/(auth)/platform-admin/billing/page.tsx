import { redirect } from 'next/navigation';
import { DollarSign, TrendingUp, Zap, Building2 } from 'lucide-react';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';

function fmt$(v: number) {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 }).format(v);
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
  const maxCost = Math.max(...aiCosts.map((t) => t.costThisMonth), 0.01);

  const cardClass = 'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Billing & Costs</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Month-to-date AI infrastructure costs across all tenants
        </p>
      </div>

      {/* Summary cards */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Total AI Cost (MTD)', value: fmt$(totalAiCost), icon: DollarSign },
          { label: 'Total API Calls',     value: stats.ai_calls_this_month.toLocaleString(), icon: Zap },
          { label: 'Avg Cost / Tenant',   value: fmt$(avgCostPerTenant), icon: TrendingUp },
          { label: 'Active Tenants',      value: activeTenants, icon: Building2 },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className={cardClass}>
            <div className="flex items-center justify-between">
              <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
              <Icon className="h-4 w-4 text-[var(--color-primary)]" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
          </div>
        ))}
      </section>

      {/* Per-tenant cost breakdown */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[var(--color-text)]">Cost by Tenant (MTD)</h2>
        {aiCosts.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">No AI usage recorded this month.</p>
        ) : (
          <div className="space-y-3">
            {aiCosts.map((tenant) => {
              const barWidth = Math.max(4, Math.round((tenant.costThisMonth / maxCost) * 100));
              const pct = totalAiCost > 0 ? Math.round((tenant.costThisMonth / totalAiCost) * 100) : 0;
              return (
                <div key={tenant.tenantId} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[var(--color-text)]">{tenant.tenantName}</span>
                      <span className="rounded-full bg-[var(--color-surface)] px-1.5 py-0.5 text-[10px] capitalize text-[var(--color-text-muted)]">
                        {tenant.plan}
                      </span>
                    </div>
                    <div className="flex shrink-0 items-center gap-4 text-xs text-[var(--color-text-muted)]">
                      <span>{tenant.callsThisMonth} calls</span>
                      <span className="font-semibold text-[var(--color-text)]">{fmt$(tenant.costThisMonth)}</span>
                      <span className="w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-surface)]">
                    <div className="h-2 rounded-full bg-[var(--color-primary)]" style={{ width: `${barWidth}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Plan distribution */}
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <h2 className="mb-4 text-base font-semibold text-[var(--color-text)]">Tenant Plan Mix</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(stats.tenants_by_plan).map(([plan, count]) => (
            <div key={plan} className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 text-center">
              <p className="text-2xl font-bold text-[var(--color-text)]">{count}</p>
              <p className="mt-1 text-sm capitalize text-[var(--color-text-muted)]">{plan}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
