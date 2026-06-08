import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Activity, BarChart3, Building2, Shield, Users } from 'lucide-react';
import { getAuthUser } from '@/modules/auth/services/auth-service';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';
import { cn } from '@/lib/cn';

type Tab = 'overview' | 'tenants' | 'system';

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

const TABS: { id: Tab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tenants', label: 'Tenants' },
  { id: 'system', label: 'System' },
];

export default async function PlatformAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const user = await getAuthUser();
  if (!user) redirect('/login');
  if (user.role !== 'platform_admin') redirect('/dashboard');

  const params = await searchParams;
  const tab: Tab = (params.tab as Tab) ?? 'overview';

  const [stats, tenants, aiCosts] = await Promise.all([
    platformAdminService.getPlatformStats(),
    platformAdminService.listTenants({ page: 1, limit: 20 }),
    platformAdminService.getAICostBreakdown(),
  ]);

  const maxCost = Math.max(...aiCosts.map((item) => item.costThisMonth), 0.01);
  const cardClass = 'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Platform Overview</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">
          Cross-tenant stats, tenant management, and system status.
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-1 shadow-sm w-fit">
        {TABS.map((t) => (
          <Link
            key={t.id}
            href={`/platform-admin?tab=${t.id}`}
            className={cn(
              'rounded-[var(--radius-md)] px-4 py-1.5 text-sm font-medium transition-colors',
              tab === t.id
                ? 'bg-[var(--color-primary)] text-white shadow-sm'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {/* ── Tab: Overview ── */}
      {tab === 'overview' && (
        <>
          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            {[
              { label: 'Total Tenants',  value: stats.total_tenants,          icon: Shield },
              { label: 'Active Tenants', value: stats.active_tenants,         icon: Activity },
              { label: 'Total Users',    value: stats.total_users,            icon: Users },
              { label: 'AI Cost (MTD)',  value: formatCurrency(stats.ai_cost_this_month), icon: BarChart3 },
              { label: 'Uptime',         value: '98%',                        icon: Activity },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className={cardClass}>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
                  <Icon className="h-4 w-4 text-[var(--color-primary)]" />
                </div>
                <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{value}</p>
              </div>
            ))}
          </section>

          {/* AI Cost Breakdown */}
          <div className="grid gap-6 lg:grid-cols-[1.4fr_0.9fr]">
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-base font-semibold text-[var(--color-text)]">AI Cost by Tenant (MTD)</h2>
                <Link
                  href="/platform-admin/ai-usage"
                  className="text-xs text-[var(--color-primary)] hover:underline"
                >
                  Full report →
                </Link>
              </div>
              {aiCosts.length === 0 ? (
                <p className="text-sm text-[var(--color-text-muted)]">No AI usage this month.</p>
              ) : (
                <div className="space-y-4">
                  {aiCosts.slice(0, 8).map((item) => {
                    const width = Math.max(6, Math.round((item.costThisMonth / maxCost) * 100));
                    return (
                      <div key={item.tenantId} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3 text-sm">
                          <span className="font-medium text-[var(--color-text)]">{item.tenantName}</span>
                          <span className="text-[var(--color-text-muted)]">
                            {formatCurrency(item.costThisMonth)} · {item.callsThisMonth} calls
                          </span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-surface)]">
                          <div className="h-2 rounded-full bg-[var(--color-primary)]" style={{ width: `${width}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Plan distribution */}
            <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-base font-semibold text-[var(--color-text)]">Plan Distribution</h2>
              <div className="space-y-3">
                {Object.entries(stats.tenants_by_plan).map(([plan, count]) => (
                  <div key={plan} className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                    <span className="font-medium capitalize text-[var(--color-text)]">{plan}</span>
                    <span className="font-semibold text-[var(--color-primary)]">{count}</span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 text-sm text-[var(--color-text-muted)]">
                <div className="flex justify-between">
                  <span>Total Leads</span>
                  <span className="font-medium text-[var(--color-text)]">{stats.total_leads}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Funnels</span>
                  <span className="font-medium text-[var(--color-text)]">{stats.total_funnels}</span>
                </div>
                <div className="flex justify-between">
                  <span>AI Calls (MTD)</span>
                  <span className="font-medium text-[var(--color-text)]">{stats.ai_calls_this_month}</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* ── Tab: Tenants ── */}
      {tab === 'tenants' && (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">All Tenants</h2>
              <p className="mt-0.5 text-sm text-[var(--color-text-muted)]">{tenants.meta.total} tenants total</p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm">
              <thead>
                <tr className="text-xs uppercase tracking-wide text-[var(--color-text-muted)]">
                  {['Name', 'Slug', 'Plan', 'Members', 'AI Calls', 'AI Cost', 'Status'].map((h) => (
                    <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tenants.data.map((tenant) => (
                  <tr key={tenant.id} className="hover:bg-[var(--color-surface)]">
                    <td className="border-b border-[var(--color-border)] px-4 py-3 font-medium text-[var(--color-text)]">{tenant.name}</td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">{tenant.slug}</td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3 capitalize">{tenant.plan}</td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3">{tenant.usage.members.used} / {tenant.maxMembers}</td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3">{tenant.aiCallsThisMonth} / {tenant.maxAiCalls}</td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3 font-medium">{formatCurrency(tenant.aiCostThisMonth ?? 0)}</td>
                    <td className="border-b border-[var(--color-border)] px-4 py-3">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusTone(tenant.status)}`}>
                        {tenant.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── Tab: System ── */}
      {tab === 'system' && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'API Error Rate', value: '0.2%', status: 'ok' },
            { label: 'DB Connection',  value: 'OK',   status: 'ok' },
            { label: 'Avg Response',   value: '180ms', status: 'ok' },
            { label: 'Last Deploy',    value: '2h ago', status: 'ok' },
          ].map(({ label, value }) => (
            <div key={label} className={cardClass}>
              <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                {label}
              </div>
              <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
            </div>
          ))}
          <div className="col-span-full">
            <Link
              href="/platform-admin/health"
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] shadow-sm hover:bg-[var(--color-surface)]"
            >
              <Activity className="h-4 w-4" /> Full System Health →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
