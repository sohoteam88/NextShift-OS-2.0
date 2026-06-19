'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, FileText, Target, Users, Zap } from 'lucide-react';
import { useLeadEngine } from '../hooks/useLeadEngine';
import { useDashboardMission } from '@/modules/dashboard/hooks/useDashboardMission';
import { cn } from '@/lib/cn';

export function LeadDashboard() {
  const engine = useLeadEngine();
  const { mission } = useDashboardMission();

  if (engine.isLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">引流系统</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{engine.lockReason}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">引流获客</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">引流系统</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">把关注转化成可跟进的潜在客户。</p>
      </div>

      {/* Lead Pipeline */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="mb-4 text-base font-semibold">引流管道</h2>
        <div className="grid grid-cols-5 gap-3 text-center text-sm">
          {[
            { label: '访客', value: engine.pipeline.visitors, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: '线索', value: engine.pipeline.leads, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: '已筛选', value: engine.pipeline.qualified, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: '预约', value: engine.pipeline.appointments, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: '客户', value: engine.pipeline.customers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className={cn('rounded p-3', s.bg)}>
              <p className={cn('text-lg font-semibold', s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">线索到客户转化率 {engine.pipeline.conversionRate}%</p>
      </section>

      {/* Lead Scoring + Quick Actions */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="mb-3 text-base font-semibold">线索评分</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>下载引流磁铁</span><span className="font-semibold text-blue-600">+20</span></div>
            <div className="flex justify-between"><span>完成测验</span><span className="font-semibold text-blue-600">+30</span></div>
            <div className="flex justify-between"><span>点击 WhatsApp</span><span className="font-semibold text-blue-600">+20</span></div>
            <div className="flex justify-between"><span>浏览 3 个以上页面</span><span className="font-semibold text-blue-600">+15</span></div>
            <div className="flex justify-between"><span>填写表单</span><span className="font-semibold text-blue-600">+25</span></div>
            <div className="flex justify-between"><span>请求预约</span><span className="font-semibold text-emerald-600">+50</span></div>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <span className="rounded bg-blue-50 px-2 py-1 text-blue-600">0–39 冷线索</span>
            <span className="rounded bg-amber-50 px-2 py-1 text-amber-600">40–69 温线索</span>
            <span className="rounded bg-red-50 px-2 py-1 text-red-600">70+ 热线索</span>
          </div>
        </section>

        <section className="space-y-3">
          <Link href="/lead-magnet" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
            <FileText className="h-5 w-5 text-[var(--color-primary)]" />
            <div className="flex-1"><span className="text-sm font-semibold">创建引流磁铁</span><p className="text-xs text-[var(--color-text-muted)]">PDF、清单、测验、微课程</p></div>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/funnel" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
            <Target className="h-5 w-5 text-[var(--color-primary)]" />
            <div className="flex-1"><span className="text-sm font-semibold">搭建落地页</span><p className="text-xs text-[var(--color-text-muted)]">高转化的获客页面</p></div>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/crm" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
            <Users className="h-5 w-5 text-[var(--color-primary)]" />
            <div className="flex-1"><span className="text-sm font-semibold">管理线索</span><p className="text-xs text-[var(--color-text-muted)]">CRM - 查看并筛选线索</p></div>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
