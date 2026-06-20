'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import {
  AlertCircle,
  ArrowRight,
  BarChart3,
  Brain,
  CheckCircle2,
  Clock3,
  FileText,
  Flame,
  LayoutTemplate,
  RefreshCw,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';

type Recommendation = {
  type: string;
  goal: string;
  reason: string;
  estimatedMinutes: number;
  actionLabel: string;
  actionHref: string;
  urgency: 'high' | 'medium' | 'low';
  context: {
    overdueFollowups: number;
    leadsThisWeek: number;
    contentThisWeek: number;
    actionsCompleted: number;
    actionsTotal: number;
    publishedFunnels: number;
  };
};

function useRecommendation() {
  return useQuery({
    queryKey: ['ai-coach-recommend'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/coach/recommend');
      if (!res.ok) throw new Error('Failed to load coach recommendation');
      return res.json() as Promise<{ data: Recommendation }>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

const URGENCY_STYLES = {
  high: {
    panel: 'border-red-200 bg-red-50',
    badge: 'bg-red-100 text-red-700',
    accent: 'text-red-600',
  },
  medium: {
    panel: 'border-blue-200 bg-blue-50',
    badge: 'bg-blue-100 text-blue-700',
    accent: 'text-blue-700',
  },
  low: {
    panel: 'border-[var(--color-border)] bg-white',
    badge: 'bg-gray-100 text-gray-700',
    accent: 'text-[var(--color-primary)]',
  },
};

function minutesLabel(minutes: number) {
  return `${minutes} min`;
}

function CoachSkeleton() {
  return (
    <div className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
        <Skeleton className="mb-5 h-5 w-28" />
        <Skeleton className="mb-3 h-9 w-3/4" />
        <Skeleton className="mb-2 h-4 w-full" />
        <Skeleton className="mb-6 h-4 w-2/3" />
        <Skeleton className="h-11 w-36" />
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <Skeleton className="mb-4 h-5 w-32" />
        <div className="space-y-3">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  );
}

function BusinessSnapshot({ ctx }: { ctx: Recommendation['context'] }) {
  const t = useTranslations('aiCoach');
  const actionRate = ctx.actionsTotal > 0 ? Math.round((ctx.actionsCompleted / ctx.actionsTotal) * 100) : 0;
  const areas = [
    {
      label: t('overdueFollowups'),
      value: ctx.overdueFollowups,
      href: '/crm?filter=overdue',
      icon: Users,
      alert: ctx.overdueFollowups > 0,
      helper: ctx.overdueFollowups > 0 ? t('needsFollowup') : t('clear'),
    },
    {
      label: t('weeklyLeads'),
      value: ctx.leadsThisWeek,
      href: '/crm',
      icon: TrendingUp,
      alert: ctx.leadsThisWeek === 0,
      helper: t('last7Days'),
    },
    {
      label: t('dailyActions'),
      value: `${ctx.actionsCompleted}/${ctx.actionsTotal}`,
      href: '/member/daily-actions',
      icon: Flame,
      alert: ctx.actionsTotal > 0 && ctx.actionsCompleted < ctx.actionsTotal,
      helper: `${actionRate}%`,
    },
    {
      label: t('weeklyContent'),
      value: ctx.contentThisWeek,
      href: '/ai',
      icon: FileText,
      alert: ctx.contentThisWeek === 0,
      helper: t('last7Days'),
    },
    {
      label: t('publishedFunnels'),
      value: ctx.publishedFunnels,
      href: '/funnel',
      icon: LayoutTemplate,
      alert: ctx.publishedFunnels === 0,
      helper: ctx.publishedFunnels > 0 ? t('active') : t('setupNeeded'),
    },
  ];

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-semibold text-[var(--color-text)]">{t('businessSnapshot')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('businessSnapshotHelp')}</p>
        </div>
        <BarChart3 className="h-5 w-5 text-[var(--color-text-muted)]" aria-hidden="true" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        {areas.map(({ label, value, href, icon: Icon, alert, helper }) => (
          <Link
            key={label}
            href={href}
            className={cn(
              'rounded-[var(--radius-md)] border p-4 transition-colors hover:border-[var(--color-primary)] hover:bg-blue-50',
              alert ? 'border-amber-200 bg-amber-50' : 'border-[var(--color-border)] bg-white',
            )}
          >
            <div className="flex items-center justify-between">
              <Icon className={cn('h-4 w-4', alert ? 'text-amber-600' : 'text-[var(--color-text-muted)]')} />
              <span className="text-xs text-[var(--color-text-muted)]">{helper}</span>
            </div>
            <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{label}</p>
          </Link>
        ))}
      </div>
    </section>
  );
}

function QuickWorkflow() {
  const t = useTranslations('aiCoach');
  const actions = [
    { label: t('addLead'), href: '/crm', icon: Users, helper: t('addLeadHelp') },
    { label: t('createContent'), href: '/content-engine', icon: FileText, helper: t('createContentHelp') },
    { label: t('buildFunnel'), href: '/funnel', icon: LayoutTemplate, helper: t('buildFunnelHelp') },
    { label: t('planContent'), href: '/content-engine', icon: Brain, helper: t('planContentHelp') },
  ];

  return (
    <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
      {actions.map(({ label, href, icon: Icon, helper }) => (
        <Link
          key={href}
          href={href}
          className="group rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm transition-colors hover:border-[var(--color-primary)] hover:bg-blue-50"
        >
          <div className="flex items-center justify-between">
            <Icon className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
            <ArrowRight className="h-4 w-4 text-[var(--color-text-muted)] transition-transform group-hover:translate-x-0.5" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-[var(--color-text)]">{label}</h3>
          <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{helper}</p>
        </Link>
      ))}
    </section>
  );
}

export default function AICoachPage() {
  const t = useTranslations('aiCoach');
  const { data, isLoading, isError, refetch, isFetching } = useRecommendation();
  const rec = data?.data;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
            {t('eyebrow')}
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{t('title')}</h1>
          <p className="mt-1 max-w-2xl text-sm text-[var(--color-text-muted)]">{t('subtitle')}</p>
        </div>
        <button
          type="button"
          onClick={() => refetch()}
          disabled={isFetching}
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-medium text-[var(--color-text)] shadow-sm transition-colors hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          <RefreshCw className={cn('h-4 w-4', isFetching && 'animate-spin')} aria-hidden="true" />
          {t('refresh')}
        </button>
      </div>

      {isLoading ? <CoachSkeleton /> : null}

      {isError ? (
        <div className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 text-red-600" aria-hidden="true" />
            <div>
              <h2 className="text-base font-semibold text-[var(--color-text)]">{t('errorTitle')}</h2>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('errorDescription')}</p>
            </div>
          </div>
        </div>
      ) : null}

      {!isLoading && rec ? (
        <section className="grid gap-4 lg:grid-cols-[1.25fr_0.75fr]">
          <div className={cn('rounded-[var(--radius-lg)] border p-6 shadow-sm', URGENCY_STYLES[rec.urgency].panel)}>
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
              <div className="inline-flex items-center gap-2 text-sm font-medium text-[var(--color-text-muted)]">
                <Target className={cn('h-4 w-4', URGENCY_STYLES[rec.urgency].accent)} aria-hidden="true" />
                {t('todayPriority')}
              </div>
              <span className={cn('rounded-full px-3 py-1 text-xs font-semibold', URGENCY_STYLES[rec.urgency].badge)}>
                {t(`urgency.${rec.urgency}`)}
              </span>
            </div>

            <h2 className="max-w-3xl text-3xl font-semibold leading-tight tracking-tight text-[var(--color-text)]">
              {rec.goal}
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">{rec.reason}</p>

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <Link
                href={rec.actionHref}
                className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary-hover)]"
              >
                {rec.actionLabel}
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </Link>
              <span className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-white/70 px-3 text-sm text-[var(--color-text-muted)]">
                <Clock3 className="h-4 w-4" aria-hidden="true" />
                {t('estimatedTime', { time: minutesLabel(rec.estimatedMinutes) })}
              </span>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-hidden="true" />
              <h2 className="text-base font-semibold text-[var(--color-text)]">{t('coachReadout')}</h2>
            </div>
            <div className="mt-4 space-y-3 text-sm text-[var(--color-text-muted)]">
              <p>{t('coachReadoutOne')}</p>
              <p>{t('coachReadoutTwo')}</p>
              <p>{t('coachReadoutThree')}</p>
            </div>
          </div>
        </section>
      ) : null}

      {rec?.context ? <BusinessSnapshot ctx={rec.context} /> : null}

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-base font-semibold text-[var(--color-text)]">{t('quickWorkflow')}</h2>
        </div>
        <QuickWorkflow />
      </div>
    </div>
  );
}
