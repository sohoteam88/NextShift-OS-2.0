'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { useTranslations, useLocale } from 'next-intl';
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  BarChart3,
  Brain,
  Building2,
  CheckCircle2,
  CircleDollarSign,
  Clock,
  ExternalLink,
  Gauge,
  LineChart,
  LockKeyhole,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Users,
  Zap,
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

function priorityTone(priority: FounderAlertPriority) {
  if (priority === 'Critical') return 'bg-rose-600 text-white';
  if (priority === 'High') return 'bg-orange-100 text-orange-700';
  if (priority === 'Medium') return 'bg-amber-100 text-amber-700';
  return 'bg-emerald-100 text-emerald-700';
}

function toTrackingId(value: string) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'item';
}

function trackAdminDashboardUsage(eventType: 'view' | 'click', targetId: string, targetKind: 'dashboard' | 'card' | 'action' | 'queue', section: string) {
  const payload = JSON.stringify({
    eventType,
    targetId,
    targetKind,
    section,
    path: '/platform-admin',
  });

  if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
    navigator.sendBeacon('/api/v1/platform-admin/usage', new Blob([payload], { type: 'application/json' }));
    return;
  }

  void fetch('/api/v1/platform-admin/usage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: payload,
    keepalive: true,
  }).catch(() => {});
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
  const { number, currency } = useFormatters();
  const criticalAlerts = data.alerts.filter((alert) => alert.priority === 'Critical');
  const highAlerts = data.alerts.filter((alert) => alert.priority === 'High');
  const atRiskTenants = data.tenants.filter((tenant) => tenant.churnRisk === 'Critical' || tenant.churnRisk === 'High');
  const inactiveTenants = Math.max(0, data.summary.totalTenants - data.summary.activeTenants);
  const launchScore = Math.max(0, Math.min(100, Math.round((data.growth.thirtyDays.activationPercent + data.growth.thirtyDays.leadPercent + data.growth.thirtyDays.customerPercent) / 3)));
  const platformStatus = criticalAlerts.length > 0 ? t('v3Critical') : highAlerts.length > 0 || atRiskTenants.length > 0 ? t('v3Watch') : t('v3Operational');
  const platformTone = criticalAlerts.length > 0 ? 'border-rose-200 bg-rose-50 text-rose-700' : highAlerts.length > 0 || atRiskTenants.length > 0 ? 'border-amber-200 bg-amber-50 text-amber-700' : 'border-emerald-200 bg-emerald-50 text-emerald-700';
  const queue = [
    ...data.alerts
      .filter((alert) => alert.priority !== 'Low')
      .slice(0, 4)
      .map((alert) => ({ id: toTrackingId(`${alert.priority}-${alert.title}`), title: alert.title, description: alert.description, priority: alert.priority, href: alert.href })),
    ...(atRiskTenants.length > 0 ? [{ id: 'tenant-risk-review', title: t('v3ReviewTenantRisk'), description: t('v3ReviewTenantRiskHelp', { count: atRiskTenants.length }), priority: 'High' as FounderAlertPriority, href: '/platform-admin/tenant-health' }] : []),
    ...(data.summary.grossMargin > 0 && data.summary.grossMargin < 65 ? [{ id: 'ai-margin-review', title: t('v3ReviewAiMargin'), description: t('v3ReviewAiMarginHelp', { margin: data.summary.grossMargin }), priority: 'Medium' as FounderAlertPriority, href: '/platform-admin/ai-profitability' }] : []),
  ].slice(0, 5);
  const visibleQueue = queue.length > 0 ? queue : [{ id: 'stable-review', title: t('v3NoImmediateAction'), description: t('v3NoImmediateActionHelp'), priority: 'Low' as FounderAlertPriority, href: '/platform-admin/health' }];

  useEffect(() => {
    trackAdminDashboardUsage('view', 'platform-admin-v3', 'dashboard', 'homepage');
  }, []);

  function onTrackClick(targetId: string, targetKind: 'card' | 'action' | 'queue', section: string) {
    trackAdminDashboardUsage('click', targetId, targetKind, section);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        eyebrow={t('platformOperatingSystem')}
        title={t('v3Title')}
        description={t('v3Help')}
        action={(
          <div className={`inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-3 py-2 text-sm font-semibold ${platformTone}`}>
            <Activity className="h-4 w-4" />
            {platformStatus}
          </div>
        )}
      />

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)]">
        <div className="grid gap-4 md:grid-cols-2">
          <Link
            href="/platform-admin/health"
            onClick={() => onTrackClick('platform-health', 'card', 'primary-card')}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('v3PlatformHealth')}</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">{platformStatus}</p>
              </div>
              <Gauge className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2 text-xs text-[var(--color-text-muted)]">
              <span>{t('activeTenants')}: <strong className="text-[var(--color-text)]">{number(data.summary.activeTenants)}</strong></span>
              <span>{t('activeUsers')}: <strong className="text-[var(--color-text)]">{number(data.summary.activeUsers)}</strong></span>
              <span>{t('v3Alerts')}: <strong className="text-[var(--color-text)]">{criticalAlerts.length + highAlerts.length}</strong></span>
            </div>
          </Link>

          <Link
            href="/platform-admin/growth"
            onClick={() => onTrackClick('launch-metrics', 'card', 'primary-card')}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('v3LaunchMetrics')}</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">{launchScore}%</p>
              </div>
              <Rocket className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div className="mt-4 h-2 rounded-full bg-slate-100">
              <div className="h-2 rounded-full bg-blue-600" style={{ width: `${launchScore}%` }} />
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">{t('v3LaunchMetricsHelp')}</p>
          </Link>

          <Link
            href="/platform-admin/audit-logs"
            onClick={() => onTrackClick('security-risk', 'card', 'primary-card')}
            className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('v3SecurityRisk')}</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">{atRiskTenants.length + inactiveTenants}</p>
              </div>
              <ShieldAlert className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <p className="mt-3 text-xs text-[var(--color-text-muted)]">{t('v3SecurityRiskHelp', { tenants: atRiskTenants.length, inactive: inactiveTenants })}</p>
          </Link>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-[var(--color-text-muted)]">{t('v3RevenueControl')}</p>
                <p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">{currency(data.summary.mrr)}</p>
              </div>
              <CircleDollarSign className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-[var(--color-text-muted)]">
              <span>{t('grossMargin')}: <strong className="text-[var(--color-text)]">{data.summary.grossMargin}%</strong></span>
              <span>{t('aiCost')}: <strong className="text-[var(--color-text)]">{currency(data.summary.aiCost)}</strong></span>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm md:col-span-2">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-base font-semibold text-[var(--color-text)]">{t('v3QuickActions')}</h2>
              <Zap className="h-5 w-5 text-[var(--color-primary)]" />
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
              {[
                { id: 'review-tenants', href: '/platform-admin/tenant-health', label: t('reviewTenantUsage'), icon: Building2 },
                { id: 'check-ai-spend', href: '/platform-admin/ai-profitability', label: t('checkAiSpend'), icon: Brain },
                { id: 'open-audit-logs', href: '/platform-admin/audit-logs', label: t('openAuditLogs'), icon: LockKeyhole },
                { id: 'system-health', href: '/platform-admin/health', label: t('systemHealth'), icon: Gauge },
              ].map((action) => {
                const Icon = action.icon;
                return (
                  <Link
                    key={action.id}
                    href={action.href}
                    onClick={() => onTrackClick(action.id, 'action', 'quick-actions')}
                    className="flex min-h-12 items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
                  >
                    <span className="flex items-center gap-2"><Icon className="h-4 w-4 text-[var(--color-primary)]" />{action.label}</span>
                    <ExternalLink className="h-4 w-4 text-[var(--color-text-muted)]" />
                  </Link>
                );
              })}
            </div>
          </div>
        </div>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">{t('v3ActionQueue')}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('v3ActionQueueHelp')}</p>
            </div>
            <Clock className="h-5 w-5 text-[var(--color-primary)]" />
          </div>
          <div className="mt-4 divide-y divide-[var(--color-border)]">
            {visibleQueue.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => onTrackClick(item.id, 'queue', 'action-queue')}
                className="flex items-start justify-between gap-3 py-3 hover:bg-[var(--color-surface)]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${priorityTone(item.priority)}`}>{item.priority}</span>
                    <span className="text-sm font-semibold text-[var(--color-text)]">{item.title}</span>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">{item.description}</p>
                </div>
                <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-[var(--color-text-muted)]" />
              </Link>
            ))}
          </div>
        </section>
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
