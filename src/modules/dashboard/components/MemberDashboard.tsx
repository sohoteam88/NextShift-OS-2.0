'use client';

import * as React from 'react';
import Link from 'next/link';
import { ArrowRight, BarChart3, CircleDollarSign, FileText, Sparkles, Target, Users, Zap } from 'lucide-react';
import { AiRecommendationPanel } from './AiRecommendationPanel';
import { TodaysActionCard } from './TodaysActionCard';
import { JourneyProgress } from './JourneyProgress';
import { useMissionCurrent } from '@/modules/mission-engine/components/MissionCard';
import { useQuery } from '@tanstack/react-query';

type Locale = 'zh' | 'en' | 'ms';
type Props = { userName?: string; locale?: Locale };

function copy(locale: Locale) {
  if (locale === 'en') return { title: 'What should I do today?', subtitle: 'Focus on one action. Build momentum.', mission: "Today's Mission", aiCoach: 'AI Coach', journey: 'Journey Progress', openJourney: 'Open Journey', continueJourney: 'Continue Your Journey', startJourney: 'Start Your Journey', content: 'Content', leads: 'Leads', customers: 'Customers', revenue: 'Revenue' };
  if (locale === 'ms') return { title: 'Apa patut saya buat hari ini?', subtitle: 'Fokus satu tindakan. Bina momentum.', mission: 'Misi Hari Ini', aiCoach: 'Jurulatih AI', journey: 'Kemajuan Perjalanan', openJourney: 'Buka Perjalanan', continueJourney: 'Teruskan Perjalanan', startJourney: 'Mula Perjalanan', content: 'Kandungan', leads: 'Prospek', customers: 'Pelanggan', revenue: 'Hasil' };
  return { title: '今天我应该做什么？', subtitle: '专注一个行动。建立动力。', mission: '今日任务', aiCoach: 'AI 教练', journey: '旅程进度', openJourney: '打开旅程', continueJourney: '继续旅程', startJourney: '开始旅程', content: '内容', leads: '潜在客户', customers: '客户', revenue: '收入' };
}

function useQuickStats() {
  return useQuery({
    queryKey: ['dashboard-quick-stats'],
    queryFn: async () => {
      const res = await fetch('/api/v1/team/summary');
      if (!res.ok) return { content: 0, leads: 0, customers: 0, revenue: 0 };
      const json = await res.json() as { data?: any };
      const d = json.data ?? {};
      return {
        content: d.contentCount ?? d.content?.total ?? 0,
        leads: d.leadCount ?? d.leads?.total ?? 0,
        customers: d.customerCount ?? d.customers?.total ?? 0,
        revenue: d.revenue ?? d.mrr ?? 0,
      };
    },
    staleTime: 60_000,
  });
}

export function MemberDashboard({ locale = 'zh' }: Props) {
  const t = copy(locale);
  const q = useMissionCurrent();
  const stats = useQuickStats();
  const progress = q.data?.data?.progress;
  const hasStarted = (progress?.completedStages ?? 0) > 0;
  const fmt = (n: number) => n.toLocaleString();

  return (
    <div className="mx-auto max-w-3xl space-y-5 pb-8">
      {/* Hero — Dynamic CTA based on journey progress */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">NextShift OS</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{t.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t.subtitle}</p>
        </div>
        <Link
          href="/journey"
          className="inline-flex h-11 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
        >
          {hasStarted ? t.continueJourney : t.startJourney}
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {/* Quick Stats — Content, Leads, Customers, Revenue only */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: t.content, value: fmt(stats.data?.content ?? 0), icon: FileText },
          { label: t.leads, value: fmt(stats.data?.leads ?? 0), icon: Users },
          { label: t.customers, value: fmt(stats.data?.customers ?? 0), icon: Target },
          { label: t.revenue, value: `RM ${fmt(stats.data?.revenue ?? 0)}`, icon: CircleDollarSign },
        ].map((stat) => (
          <div key={stat.label} className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-3 shadow-sm text-center">
            <stat.icon className="mx-auto h-4 w-4 text-[var(--color-primary)]" />
            <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">{stat.value}</p>
            <p className="text-xs text-[var(--color-text-muted)]">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Journey Progress + AI Coach + Mission — compact single-column grid */}
      <div className="grid gap-5 md:grid-cols-[1fr_1fr]">
        <section className="space-y-3 md:col-span-2">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t.journey}</h2>
          </div>
          <JourneyProgress locale={locale} />
        </section>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t.aiCoach}</h2>
          </div>
          <AiRecommendationPanel locale={locale} />
        </section>
        <section className="space-y-3">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[var(--color-primary)]" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">{t.mission}</h2>
          </div>
          <TodaysActionCard locale={locale} />
        </section>
      </div>
    </div>
  );
}
