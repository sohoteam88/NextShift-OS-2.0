import Link from 'next/link';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  LineChart,
  ShieldCheck,
  Users,
  Workflow,
} from 'lucide-react';
import type { FounderAlertPriority, PlatformOperatingData, TenantHealthRecord } from '@/modules/admin/services/platformOperatingService';

function number(value: number) {
  return new Intl.NumberFormat('en-US').format(Math.round(value));
}

function currency(value: number) {
  return `RM${number(value)}`;
}

function scoreTone(score: number) {
  if (score > 80) return 'border-emerald-200 bg-emerald-50 text-emerald-700';
  if (score >= 50) return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-rose-200 bg-rose-50 text-rose-700';
}

function riskTone(risk: TenantHealthRecord['churnRisk']) {
  if (risk === 'Critical') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (risk === 'High') return 'border-orange-200 bg-orange-50 text-orange-700';
  if (risk === 'Medium') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-emerald-200 bg-emerald-50 text-emerald-700';
}

function alertTone(priority: FounderAlertPriority) {
  if (priority === 'Critical') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (priority === 'High') return 'border-orange-200 bg-orange-50 text-orange-700';
  if (priority === 'Medium') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function Header({ title, description }: { title: string; description: string }) {
  return (
    <div>
      <p className="text-sm font-medium text-[var(--color-text-muted)]">Platform Operating System</p>
      <h1 className="mt-1 text-2xl font-semibold text-[var(--color-text)]">{title}</h1>
      <p className="mt-1 max-w-3xl text-sm text-[var(--color-text-muted)]">{description}</p>
    </div>
  );
}

function Metric({ label, value, helper, icon: Icon }: { label: string; value: string | number; helper?: string; icon: React.ElementType }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
        <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
      </div>
      <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">{value}</p>
      {helper ? <p className="mt-1 text-xs text-[var(--color-text-muted)]">{helper}</p> : null}
    </div>
  );
}

function Alerts({ data }: { data: PlatformOperatingData }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text)]">Founder Alerts</h2>
        <AlertTriangle className="h-5 w-5 text-amber-500" />
      </div>
      <div className="mt-4 space-y-2">
        {data.alerts.map((alert) => (
          <Link key={`${alert.title}-${alert.href}`} href={alert.href} className={`block rounded-[var(--radius-md)] border px-3 py-3 text-sm ${alertTone(alert.priority)}`}>
            <div className="flex items-center justify-between gap-3">
              <span className="font-semibold">{alert.title}</span>
              <span className="text-xs">{alert.priority}</span>
            </div>
            <p className="mt-1 opacity-80">{alert.description}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function Briefing({ data }: { data: PlatformOperatingData }) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[var(--color-text)]">CEO Briefing</h2>
      <div className="mt-4 space-y-3">
        {data.briefing.map((line) => (
          <div key={line} className="flex gap-3 text-sm">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            <span className="text-[var(--color-text)]">{line}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

export function CeoDashboard({ data }: { data: PlatformOperatingData }) {
  const metrics = [
    { label: 'MRR', value: currency(data.summary.mrr), helper: 'Estimated monthly recurring revenue', icon: CircleDollarSign },
    { label: 'ARR', value: currency(data.summary.arr), helper: 'Annualized run rate', icon: LineChart },
    { label: 'Active Tenants', value: data.summary.activeTenants, helper: `${data.summary.totalTenants} total tenants`, icon: Building2 },
    { label: 'Active Users', value: data.summary.activeUsers, helper: `${data.summary.totalUsers} total users`, icon: Users },
    { label: 'AI Cost', value: currency(data.summary.aiCost), helper: 'This month estimate', icon: Brain },
    { label: 'Gross Margin', value: `${data.summary.grossMargin}%`, helper: 'Revenue minus AI cost', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <Header title="CEO Dashboard" description="Business health, revenue health, tenant health, AI profitability, beta conversion, and operational risks." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{metrics.map((item) => <Metric key={item.label} {...item} />)}</section>
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Alerts data={data} />
        <Briefing data={data} />
      </section>
      <section className="grid gap-4 lg:grid-cols-4">
        {[
          { href: '/platform-admin/revenue', title: 'Revenue Intelligence', value: `${data.revenue.growthPercent}%`, helper: 'MRR growth estimate' },
          { href: '/platform-admin/tenant-health', title: 'Tenant Health', value: data.tenants.filter((t) => t.churnRisk === 'High' || t.churnRisk === 'Critical').length, helper: 'at-risk tenants' },
          { href: '/platform-admin/ai-profitability', title: 'AI Profitability', value: `${data.ai.margin}%`, helper: 'AI margin' },
          { href: '/platform-admin/growth', title: 'Growth', value: `${data.summary.betaConversionRate}%`, helper: 'beta conversion' },
        ].map((item) => (
          <Link key={item.href} href={item.href} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-semibold text-[var(--color-text)]">{item.title}</h2>
              <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{item.value}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{item.helper}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

export function RevenueDashboard({ data }: { data: PlatformOperatingData }) {
  return (
    <div className="space-y-6">
      <Header title="Revenue Intelligence" description="MRR, ARR, ARPU, ARPT, plan distribution, and revenue forecasts." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric label="MRR" value={currency(data.revenue.mrr)} icon={CircleDollarSign} />
        <Metric label="ARR" value={currency(data.revenue.arr)} icon={LineChart} />
        <Metric label="ARPU" value={currency(data.revenue.arpu)} icon={Users} />
        <Metric label="ARPT" value={currency(data.revenue.arpt)} icon={Building2} />
        <Metric label="Growth" value={`${data.revenue.growthPercent}%`} icon={BarChart3} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--color-text)]">Plan Distribution</h2>
          <div className="mt-4 space-y-3">
            {data.revenue.planDistribution.map((plan) => (
              <div key={plan.plan} className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--color-surface)] px-3 py-3 text-sm">
                <span className="capitalize">{plan.plan}</span>
                <span className="font-semibold">{plan.tenants} tenants · {currency(plan.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--color-text)]">Forecast Engine</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <Metric label="30 days" value={currency(data.revenue.forecast30)} icon={LineChart} />
            <Metric label="90 days" value={currency(data.revenue.forecast90)} icon={LineChart} />
            <Metric label="180 days" value={currency(data.revenue.forecast180)} icon={LineChart} />
            <Metric label="365 days" value={currency(data.revenue.forecast365)} icon={LineChart} />
          </div>
        </div>
      </section>
    </div>
  );
}

export function TenantHealthCenter({ data }: { data: PlatformOperatingData }) {
  return (
    <div className="space-y-6">
      <Header title="Tenant Health Center" description="Tenants sorted by health score so platform risk is visible first." />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-[var(--color-text-muted)]">
            <tr>{['Tenant', 'Plan', 'Users', 'Funnels', 'Leads', 'Activity', 'Health', 'Revenue', 'Churn Risk'].map((h) => <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {data.tenants.map((tenant) => (
              <tr key={tenant.id} className="hover:bg-[var(--color-surface)]">
                <td className="border-b border-[var(--color-border)] px-4 py-3"><p className="font-medium text-[var(--color-text)]">{tenant.name}</p><p className="text-xs text-[var(--color-text-muted)]">{tenant.slug}</p></td>
                <td className="border-b border-[var(--color-border)] px-4 py-3 capitalize">{tenant.plan}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">{tenant.users}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">{tenant.funnels}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">{tenant.leads}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">{tenant.activity}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3"><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(tenant.healthScore)}`}>{tenant.healthScore}</span></td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">{currency(tenant.revenue)}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3"><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${riskTone(tenant.churnRisk)}`}>{tenant.churnRisk}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function AiProfitabilityDashboard({ data }: { data: PlatformOperatingData }) {
  return (
    <div className="space-y-6">
      <Header title="AI Profitability Dashboard" description="AI calls, cost, revenue, margin, and tenant-level cost efficiency." />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <Metric label="AI Calls" value={number(data.ai.calls)} icon={Brain} />
        <Metric label="Cost" value={currency(data.ai.cost)} icon={CircleDollarSign} />
        <Metric label="Revenue" value={currency(data.ai.revenue)} icon={LineChart} />
        <Metric label="Margin" value={`${data.ai.margin}%`} icon={ShieldCheck} />
        <Metric label="Cost Per Tenant" value={currency(data.ai.costPerTenant)} icon={Building2} />
        <Metric label="Cost Per User" value={currency(data.ai.costPerUser)} icon={Users} />
        <Metric label="Most Expensive Tenant" value={data.ai.mostExpensiveTenant} icon={AlertTriangle} />
        <Metric label="Most Efficient Tenant" value={data.ai.mostEfficientTenant} icon={CheckCircle2} />
      </section>
    </div>
  );
}

export function GrowthDashboard({ data }: { data: PlatformOperatingData }) {
  const windows = [data.growth.today, data.growth.sevenDays, data.growth.thirtyDays, data.growth.ninetyDays];
  return (
    <div className="space-y-6">
      <Header title="Growth Dashboard" description="Activation, content, lead, customer, and member conversion across key timeframes." />
      <section className="grid gap-4 xl:grid-cols-4">
        {windows.map((window) => (
          <div key={window.label} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-[var(--color-text)]">{window.label}</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>New Users</span><span className="font-semibold">{window.newUsers}</span></div>
              <div className="flex justify-between"><span>New Tenants</span><span className="font-semibold">{window.newTenants}</span></div>
              <div className="flex justify-between"><span>Activation</span><span className="font-semibold">{window.activationPercent}%</span></div>
              <div className="flex justify-between"><span>Content</span><span className="font-semibold">{window.contentPercent}%</span></div>
              <div className="flex justify-between"><span>Lead</span><span className="font-semibold">{window.leadPercent}%</span></div>
              <div className="flex justify-between"><span>Customer</span><span className="font-semibold">{window.customerPercent}%</span></div>
              <div className="flex justify-between"><span>Member</span><span className="font-semibold">{window.memberPercent}%</span></div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export function PlatformFunnelsDashboard({ data }: { data: PlatformOperatingData }) {
  return (
    <div className="space-y-6">
      <Header title="Funnel Intelligence" description="Compare retail, recruitment, and upgrade funnel performance." />
      <section className="grid gap-4 md:grid-cols-2">
        <Metric label="Best Funnel" value={data.funnels.bestFunnel} helper="Highest conversion" icon={Workflow} />
        <Metric label="Worst Funnel" value={data.funnels.worstFunnel} helper="Lowest conversion" icon={AlertTriangle} />
      </section>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-[var(--color-text-muted)]">
            <tr>{['Funnel', 'Leads', 'Appointments', 'Customers', 'Members', 'Revenue', 'Conversion'].map((h) => <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>
            {data.funnels.rows.map((row) => (
              <tr key={row.type} className="hover:bg-[var(--color-surface)]">
                <td className="border-b border-[var(--color-border)] px-4 py-3 font-medium">{row.type}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">{row.leads}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">{row.appointments}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">{row.customers}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">{row.members}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">{currency(row.revenue)}</td>
                <td className="border-b border-[var(--color-border)] px-4 py-3">{row.conversion}%</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
