'use client';

import Link from 'next/link';
import type { ElementType } from 'react';
import { ArrowRight, BarChart3, CalendarCheck, Flame, MessageCircle, Sparkles, Target, Users } from 'lucide-react';
import { AiRecommendationPanel } from './AiRecommendationPanel';
import { TodaysActionCard } from './TodaysActionCard';
import { DNAHealthCard } from '@/modules/brand-dna/components/DNAHealthCard';
import { FunnelOperatingCenter } from '@/components/funnel-operating-system/FunnelOperatingCenter';

type Locale = 'zh' | 'en' | 'ms';

type Props = {
  userName?: string;
  locale?: Locale;
};

function copy(locale: Locale) {
  if (locale === 'en') {
    return {
      title: 'Funnel Operating Center',
      subtitle: 'Build the business through one funnel, one bottleneck, and one next action.',
      mission: "Today's Mission",
      health: 'Business Health',
      next: 'Next Best Action',
      leads: 'Hot Leads',
      activity: 'Recent Activity',
      summary: 'AI CEO Summary',
      openJourney: 'Open Journey',
      leadText: 'Review follow-ups and move qualified leads forward.',
      activityText: 'Content, funnel, and CRM activity will appear here as the operating feed matures.',
      summaryText: 'Focus on one output today: publish one useful asset, capture one lead, or follow up with one prospect.',
    };
  }

  if (locale === 'ms') {
    return {
      title: 'Pusat Operasi Funnel',
      subtitle: 'Bina bisnes melalui satu funnel, satu bottleneck dan satu tindakan seterusnya.',
      mission: 'Misi Hari Ini',
      health: 'Kesihatan Bisnes',
      next: 'Tindakan Terbaik Seterusnya',
      leads: 'Prospek Panas',
      activity: 'Aktiviti Terkini',
      summary: 'Ringkasan AI CEO',
      openJourney: 'Buka Perjalanan',
      leadText: 'Semak susulan dan gerakkan prospek yang layak ke depan.',
      activityText: 'Aktiviti kandungan, funnel dan CRM akan muncul di sini.',
      summaryText: 'Fokus pada satu hasil hari ini: terbitkan aset, dapatkan prospek, atau susul satu prospek.',
    };
  }

  return {
    title: '漏斗运营中心',
    subtitle: '围绕一个漏斗、一个瓶颈、一个下一步来建立业务。',
    mission: '今日任务',
    health: '业务健康',
    next: '下一步最佳行动',
    leads: '高温潜在客户',
    activity: '近期动态',
    summary: 'AI CEO 总结',
    openJourney: '打开旅程',
    leadText: '查看需要跟进的潜在客户，把合格对象推进到下一阶段。',
    activityText: '内容、漏斗和 CRM 动态会集中显示在这里。',
    summaryText: '今天只专注一个产出：发布一个内容、收集一个线索，或跟进一个潜在客户。',
  };
}

function MetricCard({ label, value, icon: Icon }: { label: string; value: string; icon: ElementType }) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
        <Icon className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}

export function MemberDashboard({ locale = 'zh' }: Props) {
  const t = copy(locale);

  return (
    <div className="mx-auto max-w-6xl space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">
            NextShift OS
          </p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">{t.title}</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t.subtitle}</p>
        </div>
        <Link
          href="/journey"
          className="inline-flex h-10 items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-semibold text-white shadow-sm"
        >
          {t.openJourney}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>

      <FunnelOperatingCenter locale={locale} />

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.25fr)_minmax(320px,0.75fr)]">
        <div className="space-y-5">
          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{t.mission}</h2>
            </div>
            <TodaysActionCard locale={locale} />
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{t.next}</h2>
            </div>
            <AiRecommendationPanel locale={locale} />
          </section>
        </div>

        <aside className="space-y-5">
          <section>
            <h2 className="mb-3 text-lg font-semibold text-[var(--color-text)]">{t.health}</h2>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-1">
              <DNAHealthCard locale={locale} />
              <MetricCard label="Content" value="0/3" icon={CalendarCheck} />
              <MetricCard label="Leads" value="0" icon={Users} />
              <MetricCard label="Pipeline" value="0%" icon={BarChart3} />
            </div>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{t.leads}</h2>
            </div>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{t.leadText}</p>
            <Link href="/crm" className="mt-4 inline-flex text-sm font-semibold text-[var(--color-primary)]">
              CRM <ArrowRight className="ml-1 h-4 w-4" aria-hidden="true" />
            </Link>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-[var(--color-primary)]" aria-hidden="true" />
              <h2 className="text-lg font-semibold text-[var(--color-text)]">{t.summary}</h2>
            </div>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{t.summaryText}</p>
          </section>

          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <h2 className="text-lg font-semibold text-[var(--color-text)]">{t.activity}</h2>
            <p className="mt-3 text-sm text-[var(--color-text-muted)]">{t.activityText}</p>
          </section>
        </aside>
      </div>
    </div>
  );
}
