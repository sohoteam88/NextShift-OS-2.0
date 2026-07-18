import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { Activity, BarChart3, CircleDollarSign, Flame, TrendingUp, Users, Zap } from 'lucide-react';

async function getFounderData() {
  try {
    // Server-side fetch to internal API
    const { getAuthUser } = await import('@/modules/auth/services/auth-service');
    const user = await getAuthUser();
    if (!user) return null;
    const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/v1/superadmin/founder`, {
      headers: { Cookie: '' }, // Auth handled by middleware
    });
    if (!res.ok) return null;
    return (await res.json()).data;
  } catch {
    return null;
  }
}

export default async function SuperadminFounderDashboardPage() {
  // For server rendering, we call the service directly instead of fetch
  const { platformOperatingService } = await import('@/modules/admin/services/platformOperatingService');
  const { platformAdminService } = await import('@/modules/admin/services/platform-admin-service');
  const [data, stats] = await Promise.all([
    platformOperatingService.getOperatingData(),
    platformAdminService.getPlatformStats(),
  ]);

  const fmt = (n: number) => n.toLocaleString('en-MY');
  const ringgit = (n: number) => `RM ${n.toLocaleString('en-MY')}`;

  return (
    <div className="space-y-6 pb-12">
      <PageHeader eyebrow="Founder" title="Platform Overview" description="Key metrics at a glance — refresh for latest data." />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Daily Signups" value={fmt(data.growth.today.newUsers)} icon={Users} />
        <MetricCard label="Active This Week" value={fmt(data.summary.activeUsers)} icon={Flame} />
        <MetricCard label="Total Users" value={fmt(data.summary.totalUsers)} icon={Users} />
        <MetricCard label="Activation Rate" value={`${Math.round((data.summary.activeUsers / Math.max(1, data.summary.totalUsers)) * 100)}%`} icon={TrendingUp} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="MRR" value={ringgit(data.revenue.mrr)} icon={CircleDollarSign} />
        <MetricCard label="ARR" value={ringgit(data.revenue.arr)} icon={CircleDollarSign} />
        <MetricCard label="ARPU" value={ringgit(data.revenue.arpu)} icon={CircleDollarSign} />
        <MetricCard label="Growth Rate" value={`${data.revenue.growthPercent}%`} icon={TrendingUp} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="AI Calls (Month)" value={fmt(data.ai.calls)} icon={Zap} />
        <MetricCard label="AI Cost (Month)" value={ringgit(data.ai.cost)} icon={Zap} />
        <MetricCard label="Funnels Created" value={fmt(stats.total_funnels)} icon={BarChart3} />
        <MetricCard label="Leads Total" value={fmt(stats.total_leads)} icon={Activity} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label="Active Tenants" value={fmt(data.summary.activeTenants)} icon={Flame} />
        <MetricCard label="Churn Risk" value={fmt(data.tenants.filter((t: any) => t.churnRisk === 'High' || t.churnRisk === 'Critical').length)} helper="High/Critical risk tenants" icon={Activity} />
        <MetricCard label="Gross Margin" value={`${data.summary.grossMargin}%`} icon={CircleDollarSign} />
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Growth Windows</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {[
            { label: 'Today', ...data.growth.today },
            { label: '7 Days', ...data.growth.sevenDays },
            { label: '30 Days', ...data.growth.thirtyDays },
            { label: '90 Days', ...data.growth.ninetyDays },
          ].map((w: any) => (
            <div key={w.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="text-sm font-semibold">{w.label}</p>
              <p className="text-xs text-[var(--color-text-muted)]">+{w.newUsers} users · +{w.newTenants} tenants</p>
              <div className="mt-2 space-y-1 text-xs">
                <div className="flex justify-between"><span>Activation</span><span className="font-semibold">{w.activationPercent}%</span></div>
                <div className="flex justify-between"><span>Content</span><span className="font-semibold">{w.contentPercent}%</span></div>
                <div className="flex justify-between"><span>Lead</span><span className="font-semibold">{w.leadPercent}%</span></div>
                <div className="flex justify-between"><span>Customer</span><span className="font-semibold">{w.customerPercent}%</span></div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)] mb-4">Revenue Plan Distribution</h2>
        <div className="grid gap-4 md:grid-cols-4">
          {data.revenue.planDistribution.map((p: any) => (
            <div key={p.plan} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
              <p className="text-sm font-medium capitalize">{p.plan}</p>
              <p className="text-xs text-[var(--color-text-muted)]">{p.tenants} tenants</p>
              <p className="mt-1 text-sm font-semibold">{ringgit(p.revenue)}</p>
            </div>
          ))}
        </div>
      </section>

      {data.alerts.length > 0 && (
        <section className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-5 shadow-sm">
          <h2 className="text-base font-semibold text-amber-800 mb-3">⚠️ Alerts ({data.alerts.length})</h2>
          <div className="space-y-2">
            {data.alerts.map((a: any, i: number) => (
              <div key={i} className="flex items-center justify-between rounded-[var(--radius-md)] border border-amber-200 bg-white px-3 py-2 text-sm">
                <div><span className="font-medium">{a.title}:</span> <span className="text-[var(--color-text-muted)]">{a.description}</span></div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${a.priority === 'Critical' ? 'bg-red-100 text-red-700' : a.priority === 'High' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-600'}`}>{a.priority}</span>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
