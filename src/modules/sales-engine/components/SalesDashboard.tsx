'use client';

import Link from 'next/link';
import { ArrowRight, HelpCircle, LockKeyhole } from 'lucide-react';
import { useSalesEngine } from '../hooks/useSalesEngine';
import { cn } from '@/lib/cn';

export function SalesDashboard() {
  const engine = useSalesEngine();
  const fmt = (n: number) => n.toLocaleString();
  const rm = (n: number) => `RM ${fmt(n)}`;

  if (engine.isLocked) {
    return (
      <div className="mx-auto max-w-2xl py-16 px-4">
        <div className="rounded-[var(--radius-lg)] border border-dashed border-amber-200 bg-amber-50 p-8 text-center">
          <LockKeyhole className="mx-auto h-8 w-8 text-amber-600" />
          <h1 className="mt-3 text-xl font-semibold text-[var(--color-text)]">销售中心尚未解锁</h1>
          <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-[var(--color-text-muted)]">{engine.lockReason}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            <Link href="/crm" className="inline-flex items-center gap-2 rounded-[var(--radius-md)] bg-amber-600 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-700">
              打开 CRM <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/journey" className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-amber-200 bg-white px-4 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-100">
              查看 Journey
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">成交管理</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">销售中心</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">把有兴趣的潜在客户推进到咨询、方案和成交。</p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        {[
          { label: '已发方案', value: fmt(engine.stats.proposalsSent), color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: '已查看', value: fmt(engine.stats.proposalsViewed), color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: '跟进中', value: fmt(engine.stats.closing), color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: '已成交', value: fmt(engine.stats.won), color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: '未成交', value: fmt(engine.stats.lost), color: 'text-red-600', bg: 'bg-red-50' },
        ].map(s => (
          <div key={s.label} className={cn('rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-3 shadow-sm', s.bg)}>
            <p className={cn('text-xl font-semibold', s.color)}>{s.value}</p>
            <p className="text-xs text-gray-500">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Revenue Summary */}
      <div className="grid gap-5 md:grid-cols-3">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">成交收入</h2>
          <p className="text-2xl font-bold text-[var(--color-text)]">{rm(engine.stats.revenue)}</p>
          <div className="mt-2 space-y-1 text-xs text-[var(--color-text-muted)]">
            <p>每位潜在客户收入: {rm(engine.stats.revenuePerLead)}</p>
            <p>平均订单: {rm(engine.stats.averageOrderValue)}</p>
            <p>成交率: {engine.stats.closeRate}%</p>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">收入预测</h2>
          <p className="text-sm text-[var(--color-text-muted)]">下个月</p>
          <p className="text-xl font-bold text-emerald-600">{rm(engine.forecast.nextMonth)}</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">未来 3 个月</p>
          <p className="text-xl font-bold text-emerald-600">{rm(engine.forecast.threeMonths)}</p>
        </section>

        {engine.showFeatures && (
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold mb-3">异议回应</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">常见顾虑和回应框架，帮助你把对话推进到下一步。</p>
            <div className="text-xs space-y-1">
              {['太贵了', '没有时间', '需要考虑', '需要家人同意'].map(o => (
                <div key={o} className="flex items-center gap-2"><HelpCircle className="h-3 w-3 text-amber-500" />{o}</div>
              ))}
            </div>
            <Link href="/crm" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">查看客户跟进 <ArrowRight className="h-3 w-3" /></Link>
          </section>
        )}
      </div>
    </div>
  );
}
