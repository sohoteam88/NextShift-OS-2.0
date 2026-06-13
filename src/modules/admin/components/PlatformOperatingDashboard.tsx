'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
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
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';

function useFormatters() {
  const locale = useLocale();
  return {
    number(value: number) {
      return new Intl.NumberFormat(locale).format(Math.round(value));
    },
    currency(value: number) {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MYR' }).format(value);
    },
  };
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

function Alerts({ data }: { data: PlatformOperatingData }) {
  const t = useTranslations('platformAdmin');
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text)]">{t('founderAlerts')}</h2>
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
  const t = useTranslations('platformAdmin');
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <h2 className="text-base font-semibold text-[var(--color-text)]">{t('ceoBriefing')}</h2>
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
  const t = useTranslations('platformAdmin');
  const { currency } = useFormatters();
  const metrics = [
    { label: t('mrr'), value: currency(data.summary.mrr), helper: 'Estimated monthly recurring revenue', icon: CircleDollarSign },
    { label: t('arr'), value: currency(data.summary.arr), helper: 'Annualized run rate', icon: LineChart },
    { label: t('activeTenants'), value: data.summary.activeTenants, helper: `${data.summary.totalTenants} total tenants`, icon: Building2 },
    { label: t('activeUsers'), value: data.summary.activeUsers, helper: `${data.summary.totalUsers} total users`, icon: Users },
    { label: t('aiCost'), value: currency(data.summary.aiCost), helper: 'This month estimate', icon: Brain },
    { label: t('grossMargin'), value: `${data.summary.grossMargin}%`, helper: 'Revenue minus AI cost', icon: ShieldCheck },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('platformOperatingSystem')} title={t('ceoTitle')} description={t('ceoHelp')} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{metrics.map((item) => <MetricCard key={item.label} {...item} />)}</section>
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Alerts data={data} />
        <Briefing data={data} />
      </section>
      <section className="grid gap-4 lg:grid-cols-4">
        {[
          { href: '/platform-admin/revenue', title: t('revenueIntel'), value: `${data.revenue.growthPercent}%`, helper: 'MRR growth estimate' },
          { href: '/platform-admin/tenant-health', title: t('tenantHealth'), value: data.tenants.filter((t) => t.churnRisk === 'High' || t.churnRisk === 'Critical').length, helper: 'at-risk tenants' },
          { href: '/platform-admin/ai-profitability', title: t('aiProfitabilityTitle'), value: `${data.ai.margin}%`, helper: 'AI margin' },
          { href: '/platform-admin/growth', title: t('growth'), value: `${data.summary.betaConversionRate}%`, helper: 'beta conversion' },
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
  const t = useTranslations('platformAdmin');
  const { currency } = useFormatters();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('platformOperatingSystem')} title={t('revenueTitle')} description={t('revenueHelp')} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard label={t('mrr')} value={currency(data.revenue.mrr)} icon={CircleDollarSign} />
        <MetricCard label={t('arr')} value={currency(data.revenue.arr)} icon={LineChart} />
        <MetricCard label="ARPU" value={currency(data.revenue.arpu)} icon={Users} />
        <MetricCard label="ARPT" value={currency(data.revenue.arpt)} icon={Building2} />
        <MetricCard label="Growth" value={`${data.revenue.growthPercent}%`} icon={BarChart3} />
      </section>
      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-[var(--color-text)]">{t('planDistribution')}</h2>
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
          <h2 className="font-semibold text-[var(--color-text)]">{t('forecastEngine')}</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <MetricCard label={t('days30')} value={currency(data.revenue.forecast30)} icon={LineChart} />
            <MetricCard label={t('days90')} value={currency(data.revenue.forecast90)} icon={LineChart} />
            <MetricCard label={t('days180')} value={currency(data.revenue.forecast180)} icon={LineChart} />
            <MetricCard label={t('days365')} value={currency(data.revenue.forecast365)} icon={LineChart} />
          </div>
        </div>
      </section>
    </div>
  );
}

export function TenantHealthCenter({ data }: { data: PlatformOperatingData }) {
  const t = useTranslations('platformAdmin');
  const { currency } = useFormatters();
  const headers = [t('tenantCol'), t('planCol'), t('usersCol'), t('funnelsCol'), t('leadsCol'), t('activityCol'), t('healthTitle'), t('revenueCol'), t('churnRiskCol')];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('platformOperatingSystem')} title={t('tenantHealthTitle')} description={t('tenantHealthHelp')} />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-[var(--color-text-muted)]">
            <tr>{headers.map((h) => <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>)}</tr>
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
  const t = useTranslations('platformAdmin');
  const { number, currency } = useFormatters();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('platformOperatingSystem')} title={t('aiProfitabilityTitle')} description={t('aiProfitabilityHelp')} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('aiCallsMetric')} value={number(data.ai.calls)} icon={Brain} />
        <MetricCard label={t('costMetric')} value={currency(data.ai.cost)} icon={CircleDollarSign} />
        <MetricCard label={t('revenueCol')} value={currency(data.ai.revenue)} icon={LineChart} />
        <MetricCard label={t('marginMetric')} value={`${data.ai.margin}%`} icon={ShieldCheck} />
        <MetricCard label={t('costPerTenant')} value={currency(data.ai.costPerTenant)} icon={Building2} />
        <MetricCard label={t('costPerUser')} value={currency(data.ai.costPerUser)} icon={Users} />
        <MetricCard label={t('mostExpensiveTenant')} value={data.ai.mostExpensiveTenant} icon={AlertTriangle} />
        <MetricCard label={t('mostEfficientTenant')} value={data.ai.mostEfficientTenant} icon={CheckCircle2} />
      </section>
    </div>
  );
}

export function GrowthDashboard({ data }: { data: PlatformOperatingData }) {
  const t = useTranslations('platformAdmin');
  const windows = [data.growth.today, data.growth.sevenDays, data.growth.thirtyDays, data.growth.ninetyDays];
  const windowLabels = [t('today'), t('days7'), t('days30Growth'), '90 Days'];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('platformOperatingSystem')} title={t('growthTitle')} description={t('growthHelp')} />
      <section className="grid gap-4 xl:grid-cols-4">
        {windows.map((window, i) => (
          <div key={window.label} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-[var(--color-text)]">{windowLabels[i]}</h2>
            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><span>{t('newUsers')}</span><span className="font-semibold">{window.newUsers}</span></div>
              <div className="flex justify-between"><span>{t('newTenants')}</span><span className="font-semibold">{window.newTenants}</span></div>
              <div className="flex justify-between"><span>{t('activation')}</span><span className="font-semibold">{window.activationPercent}%</span></div>
              <div className="flex justify-between"><span>{t('content')}</span><span className="font-semibold">{window.contentPercent}%</span></div>
              <div className="flex justify-between"><span>{t('lead')}</span><span className="font-semibold">{window.leadPercent}%</span></div>
              <div className="flex justify-between"><span>{t('customer')}</span><span className="font-semibold">{window.customerPercent}%</span></div>
              <div className="flex justify-between"><span>{t('member')}</span><span className="font-semibold">{window.memberPercent}%</span></div>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}

export function PlatformFunnelsDashboard({ data }: { data: PlatformOperatingData }) {
  const t = useTranslations('platformAdmin');
  const { currency } = useFormatters();
  const headers = [t('funnelNameCol'), t('leadsTableCol'), t('appointmentsTableCol'), t('customersTableCol'), t('membersTableCol'), t('revenueTableCol'), t('conversionTableCol')];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('platformOperatingSystem')} title={t('funnelIntelTitle')} description={t('funnelIntelHelp')} />
      <section className="grid gap-4 md:grid-cols-2">
        <MetricCard label={t('bestFunnel')} value={data.funnels.bestFunnel} helper="Highest conversion" icon={Workflow} />
        <MetricCard label={t('worstFunnel')} value={data.funnels.worstFunnel} helper="Lowest conversion" icon={AlertTriangle} />
      </section>
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-[var(--color-text-muted)]">
            <tr>{headers.map((h) => <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>)}</tr>
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
