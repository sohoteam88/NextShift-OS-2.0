'use client';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { AlertTriangle, ArrowRight, BarChart3, CheckCircle2, CircleDollarSign, Clock3, Flame, LayoutTemplate, Users } from 'lucide-react';
import type { WorkspaceAttention, WorkspaceCommandData } from '@/modules/admin/services/workspaceHealthService';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { useFormatters, scoreTone, severityTone } from './helpers';

function AttentionPanel({ items }: { items: WorkspaceAttention[] }) {
  const t = useTranslations('admin');
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div><h2 className="text-base font-semibold text-[var(--color-text)]">{t('needsAttention')}</h2><p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('needsAttentionHelp')}</p></div>
        <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
      </div>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">{t('noUrgentIssues')}</div> :
          items.map((item) => (
            <Link key={item.label} href={item.href} className={`flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-3 text-sm transition-colors hover:bg-white ${severityTone(item.severity)}`}>
              <span className="font-medium">{item.value} {item.label}</span><ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ))}
      </div>
    </section>
  );
}

export function AdminOverview({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  const { formatCurrency } = useFormatters();
  const topMetrics = [
    { label: t('membersMetric'), value: data.overview.totalMembers, helper: t('membersMetricHelp'), icon: Users },
    { label: t('activeThisWeekMetric'), value: data.overview.activeThisWeek, helper: t('activeThisWeekMetricHelp'), icon: Flame },
    { label: t('funnelsMetric'), value: data.overview.funnels, helper: t('funnelsMetricHelp'), icon: LayoutTemplate },
    { label: t('leadsMetric'), value: data.overview.leads, helper: t('leadsMetricHelp'), icon: BarChart3 },
  ];
  const revenueMetrics = [
    { label: t('appointmentsMetric'), value: data.overview.appointments, helper: t('appointmentsMetricHelp'), icon: Clock3 },
    { label: t('customersMetric'), value: data.overview.customers, helper: t('customersMetricHelp'), icon: CheckCircle2 },
    { label: t('teamMembersMetric'), value: data.overview.teamMembers, helper: t('teamMembersMetricHelp'), icon: Users },
    { label: t('revenueMetric'), value: formatCurrency(data.overview.revenue), helper: t('revenueMetricHelp', { rate: data.overview.conversionRate }), icon: CircleDollarSign },
  ];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('commandCenter')} title={t('workspaceOverview')} description={t('workspaceOverviewHelp')} action={<Link href="/admin/operations" className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white">{t('todayTasks')} <ArrowRight className="h-4 w-4" /></Link>} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{topMetrics.map((item) => <MetricCard key={item.label} {...item} />)}</section>
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">{revenueMetrics.map((item) => <MetricCard key={item.label} {...item} />)}</section>
      <section className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AttentionPanel items={data.attention} />
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold text-[var(--color-text)]">{t('workspaceHealth')}</h2>
          <div className="mt-4 flex items-end gap-3">
            <span className={`inline-flex rounded-full border px-3 py-1 text-sm font-semibold ${scoreTone(data.overview.healthScore)}`}>{data.overview.healthScore}/100</span>
            <p className="text-sm text-[var(--color-text-muted)]">{t('workspaceHealthHelp')}</p>
          </div>
          <div className="mt-5 space-y-3">
            {data.journey.slice(0, 5).map((stage) => (
              <div key={stage.id}>
                <div className="flex justify-between text-sm"><span className="font-medium text-[var(--color-text)]">{stage.label}</span><span className="text-[var(--color-text-muted)]">{stage.users} {t('usersInStage')}</span></div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.min(100, stage.users * 12)}%` }} /></div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <section className="grid gap-4 lg:grid-cols-3">
        {[
          { href: '/admin/members', title: t('memberHealthCenter'), value: data.members.filter((m) => m.needsHelp).length, label: t('needHelp') },
          { href: '/admin/funnels', title: t('funnelHealthCenter'), value: data.funnels.filter((f) => f.inactive).length, label: t('withoutTraffic') },
          { href: '/admin/beta', title: t('betaTitle'), value: data.overview.activeThisWeek, label: t('activatedThisWeek') },
        ].map((card) => (
          <Link key={card.href} href={card.href} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm transition-colors hover:bg-[var(--color-surface)]">
            <div className="flex items-center justify-between"><h2 className="font-semibold text-[var(--color-text)]">{card.title}</h2><ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" /></div>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{card.value}</p><p className="text-sm text-[var(--color-text-muted)]">{card.label}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}
