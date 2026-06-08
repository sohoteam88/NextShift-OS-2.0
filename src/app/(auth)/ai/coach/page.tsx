'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  ArrowRight, Brain, Users, Flame, FileText,
  LayoutTemplate, TrendingUp, CheckCircle2,
} from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Data ─────────────────────────────────────────────────────────────────────

function useRecommendation() {
  return useQuery({
    queryKey: ['ai-coach-recommend'],
    queryFn: async () => {
      const res = await fetch('/api/v1/ai/coach/recommend');
      if (!res.ok) throw new Error('Failed');
      return res.json() as Promise<{ data: Recommendation }>;
    },
    staleTime: 5 * 60 * 1000,
  });
}

// ─── Urgency styles ───────────────────────────────────────────────────────────

const URGENCY_BORDER = { high: 'border-red-300', medium: 'border-blue-300', low: 'border-[var(--color-border)]' };
const URGENCY_BG    = { high: 'bg-red-50',       medium: 'bg-blue-50',      low: 'bg-white' };
const URGENCY_BADGE = { high: 'bg-red-100 text-red-700', medium: 'bg-blue-100 text-blue-700', low: 'bg-gray-100 text-gray-600' };
const URGENCY_LABEL = { high: '紧急', medium: '今日重点', low: '建议' };

// ─── Focus areas ──────────────────────────────────────────────────────────────

type FocusArea = { label: string; value: number | string; icon: React.ReactNode; href: string; alert?: boolean };

function FocusAreas({ ctx }: { ctx: Recommendation['context'] }) {
  const areas: FocusArea[] = [
    {
      label: '逾期跟进',
      value: ctx.overdueFollowups,
      icon: <Users className="h-4 w-4" />,
      href: '/crm?filter=overdue',
      alert: ctx.overdueFollowups > 0,
    },
    {
      label: '本周新客户',
      value: ctx.leadsThisWeek,
      icon: <TrendingUp className="h-4 w-4" />,
      href: '/crm',
    },
    {
      label: '今日行动',
      value: `${ctx.actionsCompleted}/${ctx.actionsTotal}`,
      icon: <Flame className="h-4 w-4" />,
      href: '/member',
    },
    {
      label: '本周内容',
      value: ctx.contentThisWeek,
      icon: <FileText className="h-4 w-4" />,
      href: '/ai',
    },
    {
      label: '发布漏斗',
      value: ctx.publishedFunnels,
      icon: <LayoutTemplate className="h-4 w-4" />,
      href: '/funnel',
    },
  ];

  return (
    <div>
      <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">你的业务快照</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-5">
        {areas.map((area) => (
          <Link
            key={area.label}
            href={area.href}
            className={`flex flex-col gap-2 rounded-[var(--radius-lg)] border p-4 shadow-sm transition-colors hover:border-[var(--color-primary)] hover:bg-blue-50 ${
              area.alert ? 'border-red-200 bg-red-50' : 'border-[var(--color-border)] bg-white'
            }`}
          >
            <span className={area.alert ? 'text-red-500' : 'text-[var(--color-text-muted)]'}>{area.icon}</span>
            <span className={`text-2xl font-semibold ${area.alert ? 'text-red-600' : 'text-[var(--color-text)]'}`}>
              {area.value}
            </span>
            <span className="text-xs text-[var(--color-text-muted)]">{area.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ─── Quick actions ────────────────────────────────────────────────────────────

const QUICK_ACTIONS = [
  { label: '添加潜在客户', href: '/crm', icon: <Users className="h-4 w-4" /> },
  { label: '生成内容', href: '/ai', icon: <FileText className="h-4 w-4" /> },
  { label: '漏斗生成器', href: '/ai/funnel-builder', icon: <LayoutTemplate className="h-4 w-4" /> },
  { label: '30天文案规划', href: '/ai/content-plan', icon: <Brain className="h-4 w-4" /> },
  { label: '今日行动', href: '/member', icon: <CheckCircle2 className="h-4 w-4" /> },
];

// ─── Main page ────────────────────────────────────────────────────────────────

export default function AICoachPage() {
  const { data, isLoading } = useRecommendation();
  const rec = data?.data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--color-primary)] text-white">
          <Brain className="h-5 w-5" />
        </div>
        <div>
          <h1 className="text-xl font-semibold text-[var(--color-text)]">AI 教练任务</h1>
          <p className="text-sm text-[var(--color-text-muted)]">根据你的实际数据，每天给出最重要的行动建议</p>
        </div>
      </div>

      {/* Today's recommendation */}
      {isLoading ? (
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-6 shadow-sm">
          <Skeleton className="mb-4 h-5 w-24" />
          <Skeleton className="mb-2 h-7 w-2/3" />
          <Skeleton className="mb-4 h-4 w-full" />
          <Skeleton className="h-10 w-32" />
        </div>
      ) : rec ? (
        <div className={`rounded-[var(--radius-lg)] border p-6 shadow-sm ${URGENCY_BORDER[rec.urgency]} ${URGENCY_BG[rec.urgency]}`}>
          <div className="mb-4 flex items-center justify-between">
            <span className="text-sm font-medium text-[var(--color-text-muted)]">今日最重要的任务</span>
            <span className={`rounded-full px-3 py-0.5 text-xs font-semibold ${URGENCY_BADGE[rec.urgency]}`}>
              {URGENCY_LABEL[rec.urgency]}
            </span>
          </div>

          <h2 className="mb-2 text-2xl font-bold text-[var(--color-text)]">{rec.goal}</h2>
          <p className="mb-1 text-sm text-[var(--color-text-muted)]">{rec.reason}</p>
          <p className="mb-5 text-xs text-[var(--color-text-muted)]">预计时间：{rec.estimatedMinutes} 分钟</p>

          <Link
            href={rec.actionHref}
            className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-[var(--color-primary-hover)]"
          >
            {rec.actionLabel} <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      ) : null}

      {/* Business snapshot */}
      {rec?.context && <FocusAreas ctx={rec.context} />}

      {/* Quick actions */}
      <div>
        <h2 className="mb-3 text-sm font-semibold text-[var(--color-text)]">快速开始</h2>
        <div className="flex flex-wrap gap-2">
          {QUICK_ACTIONS.map((qa) => (
            <Link
              key={qa.href}
              href={qa.href}
              className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] shadow-sm transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
            >
              {qa.icon}
              {qa.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
