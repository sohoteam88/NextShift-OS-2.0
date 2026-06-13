'use client';

import Link from 'next/link';
import { useTranslations, useLocale } from 'next-intl';
import {
  AlertTriangle,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  FileText,
  Flame,
  LayoutTemplate,
  ListChecks,
  Users,
} from 'lucide-react';
import type {
  WorkspaceAttention,
  WorkspaceCommandData,
  WorkspaceFunnelHealth,
  WorkspaceMemberHealth,
} from '@/modules/admin/services/workspaceHealthService';
import { PageHeader } from '@/components/ui/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';

function useFormatters() {
  const locale = useLocale();
  return {
    formatNumber(value: number) {
      return new Intl.NumberFormat(locale).format(value);
    },
    formatCurrency(value: number) {
      return new Intl.NumberFormat(locale, { style: 'currency', currency: 'MYR' }).format(value);
    },
    formatDate(value: string) {
      return new Date(value).toLocaleDateString(locale, { month: 'short', day: 'numeric' });
    },
  };
}

function scoreTone(score: number) {
  if (score > 80) return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (score >= 50) return 'bg-amber-50 text-amber-700 border-amber-200';
  return 'bg-rose-50 text-rose-700 border-rose-200';
}

function severityTone(severity: WorkspaceAttention['severity']) {
  if (severity === 'critical') return 'border-rose-200 bg-rose-50 text-rose-700';
  if (severity === 'high') return 'border-amber-200 bg-amber-50 text-amber-700';
  return 'border-slate-200 bg-slate-50 text-slate-600';
}

function AttentionPanel({ items }: { items: WorkspaceAttention[] }) {
  const t = useTranslations('admin');
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">{t('needsAttention')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('needsAttentionHelp')}</p>
        </div>
        <AlertTriangle className="h-5 w-5 text-amber-500" aria-hidden="true" />
      </div>
      <div className="mt-4 space-y-2">
        {items.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-emerald-200 bg-emerald-50 px-3 py-3 text-sm text-emerald-700">
            {t('noUrgentIssues')}
          </div>
        ) : (
          items.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className={`flex items-center justify-between rounded-[var(--radius-md)] border px-3 py-3 text-sm transition-colors hover:bg-white ${severityTone(item.severity)}`}
            >
              <span className="font-medium">{item.value} {item.label}</span>
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </Link>
          ))
        )}
      </div>
    </section>
  );
}

function MemberRow({ member }: { member: WorkspaceMemberHealth }) {
  const t = useTranslations('admin');
  const { formatDate } = useFormatters();
  return (
    <tr className="hover:bg-[var(--color-surface)]">
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        <p className="font-medium text-[var(--color-text)]">{member.name}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{member.email}</p>
      </td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">{member.role}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        <div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100">
          <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${member.journeyProgress}%` }} />
        </div>
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">{member.journeyProgress}% · {member.currentStage}</p>
      </td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">{member.currentFunnel}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">{formatDate(member.lastActiveAt)}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(member.healthScore)}`}>
          {t('healthScore', { score: member.healthScore })}
        </span>
      </td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-sm">
        {member.needsHelp ? <span className="text-amber-700">{t('needsAttentionStatus')}</span> : <span className="text-emerald-700">{t('okStatus')}</span>}
      </td>
    </tr>
  );
}

function FunnelRow({ funnel }: { funnel: WorkspaceFunnelHealth }) {
  const t = useTranslations('admin');
  return (
    <tr className="hover:bg-[var(--color-surface)]">
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        <p className="font-medium text-[var(--color-text)]">{funnel.title}</p>
        <p className="text-xs text-[var(--color-text-muted)]">{funnel.status}</p>
      </td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.published ? t('publishedStatus') : t('draftStatus')}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.views}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.conversions}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">{funnel.conversionRate}%</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(funnel.healthScore)}`}>
          {funnel.healthScore}
        </span>
      </td>
      <td className="border-b border-[var(--color-border)] px-4 py-3">
        {funnel.inactive ? <span className="text-amber-700">{t('noTraffic')}</span> : <span className="text-emerald-700">{t('activeStatus')}</span>}
      </td>
    </tr>
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
      <PageHeader
        eyebrow={t('commandCenter')}
        title={t('workspaceOverview')}
        description={t('workspaceOverviewHelp')}
        action={<Link href="/admin/operations" className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white">{t('todayTasks')} <ArrowRight className="h-4 w-4" /></Link>}
      />
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
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-[var(--color-text)]">{stage.label}</span>
                  <span className="text-[var(--color-text-muted)]">{stage.users} {t('usersInStage')}</span>
                </div>
                <div className="mt-1 h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${Math.min(100, stage.users * 12)}%` }} />
                </div>
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
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-[var(--color-text)]">{card.title}</h2>
              <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{card.value}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{card.label}</p>
          </Link>
        ))}
      </section>
    </div>
  );
}

export function AdminMembersCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  const headers = [t('memberCol'), t('roleCol'), t('journeyProgressCol'), t('currentFunnelCol'), t('lastActiveCol'), t('healthCol'), t('needsHelpCol')];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('membersTitle')} description={t('membersHelp')} />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-[var(--color-text-muted)]">
            <tr>{headers.map((h) => <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>{data.members.map((member) => <MemberRow key={member.id} member={member} />)}</tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminFunnelsCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  const headers = [t('funnelCol'), t('publishedCol'), t('viewsCol'), t('conversionsCol'), t('conversionRateCol'), t('healthCol'), t('statusCol')];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('funnelsTitle')} description={t('funnelsHelp')} />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-[var(--color-text-muted)]">
            <tr>{headers.map((h) => <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>)}</tr>
          </thead>
          <tbody>{data.funnels.map((funnel) => <FunnelRow key={funnel.id} funnel={funnel} />)}</tbody>
        </table>
      </div>
    </div>
  );
}

export function AdminJourneyCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('journeyTitle')} description={t('journeyHelp')} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        {data.journey.map((stage) => <MetricCard key={stage.id} label={stage.label} value={stage.users} helper={t('usersInStage')} icon={ListChecks} />)}
      </section>
    </div>
  );
}

export function AdminTeamCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('teamTitle')} description={t('teamHelp')} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('totalTeamMembers')} value={data.overview.teamMembers} helper={t('teamMembersMetricHelp')} icon={Users} />
        <MetricCard label={t('activeThisWeekMetric')} value={data.overview.activeThisWeek} helper={t('recentActivityHelper')} icon={Flame} />
        <MetricCard label={t('contentPublishedMetric')} value={data.content.publishingActivity} helper={t('contentPublishedMetricHelp')} icon={FileText} />
        <MetricCard label={t('leadsGeneratedMetric')} value={data.overview.leads} helper={t('leadsGeneratedMetricHelp')} icon={BarChart3} />
        <MetricCard label={t('appointmentsMetric')} value={data.overview.appointments} helper={t('appointmentsMetricHelp')} icon={Clock3} />
        <MetricCard label={t('customersMetric')} value={data.overview.customers} helper={t('customersMetricHelp')} icon={CheckCircle2} />
        <MetricCard label={t('recruitmentConversion')} value={`${data.overview.conversionRate}%`} helper={t('recruitmentConversionHelp')} icon={Users} />
      </section>
    </div>
  );
}

export function AdminContentCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  const platformNames = ['Facebook', 'Instagram', 'TikTok', 'XHS'];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('contentTitle')} description={t('contentHelp')} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label={t('postsGenerated')} value={data.content.postsGenerated} helper={t('contentPublishedMetricHelp')} icon={FileText} />
        <MetricCard label={t('videosGenerated')} value={data.content.videosGenerated} helper={t('contentPublishedMetricHelp')} icon={FileText} />
        <MetricCard label={t('publishingActivity')} value={data.content.publishingActivity} helper={t('publishingActivityHelp')} icon={CheckCircle2} />
        <MetricCard label={t('mostUsedPlatform')} value={data.content.platforms[0]?.label ?? t('none')} helper={t('itemsCount', { count: data.content.platforms[0]?.value ?? 0 })} icon={BarChart3} />
      </section>
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)]">{t('platforms')}</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-4">
          {platformNames.map((platform) => {
            const count = data.content.platforms.find((item) => item.label.toLowerCase() === platform.toLowerCase())?.value ?? 0;
            return <div key={platform} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3"><p className="font-medium">{platform}</p><p className="text-2xl font-semibold">{count}</p></div>;
          })}
        </div>
      </section>
    </div>
  );
}

export function AdminBillingCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  const { formatCurrency } = useFormatters();
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('billingTitle')} description={t('billingHelp')} />
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <MetricCard label={t('activePlans')} value={data.billing.activePlans} icon={CircleDollarSign} />
        <MetricCard label={t('trialsMetric')} value={data.billing.trials} icon={Clock3} />
        <MetricCard label={t('expiredMetric')} value={data.billing.expired} icon={AlertTriangle} />
        <MetricCard label={t('failedPayments')} value={data.billing.failedPayments} icon={AlertTriangle} />
        <MetricCard label={t('gracePeriodUsers')} value={data.billing.gracePeriodUsers} icon={Users} />
        <MetricCard label={t('mrrMetric')} value={formatCurrency(data.billing.mrr)} icon={CircleDollarSign} />
      </section>
    </div>
  );
}

export function AdminOperationsCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  const { formatDate } = useFormatters();
  const tasks = [
    ...data.attention.map((item) => ({ label: `${item.value} ${item.label}`, href: item.href })),
    { label: t('membersRequiringFollowUp', { count: data.members.filter((item) => item.needsHelp).length }), href: '/admin/members' },
    { label: t('funnelsRequiringAttention', { count: data.funnels.filter((item) => item.inactive).length }), href: '/admin/funnels' },
  ];

  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('operationsTitle')} description={t('operationsHelp')} />
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)]">{t('todayTasks')}</h2>
        <div className="mt-4 space-y-2">
          {tasks.map((task) => (
            <Link key={`${task.href}-${task.label}`} href={task.href} className="flex items-center justify-between rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-3 text-sm hover:bg-[var(--color-surface)]">
              <span>{task.label}</span>
              <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)]" />
            </Link>
          ))}
        </div>
      </section>
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold text-[var(--color-text)]">{t('recentActivity')}</h2>
        <div className="mt-4 space-y-3">
          {data.activity.length === 0 ? <p className="text-sm text-[var(--color-text-muted)]">{t('noRecentActivity')}</p> : data.activity.map((item) => (
            <div key={item.id} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-[var(--color-text)]">{item.label}</span>
              <span className="whitespace-nowrap text-[var(--color-text-muted)]">{formatDate(item.createdAt)}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
