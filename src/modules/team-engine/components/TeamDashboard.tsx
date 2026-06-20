'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, Copy, Crown, Users, UserPlus, TrendingUp, Target } from 'lucide-react';
import { useTeamEngine } from '../hooks/useTeamEngine';
import { cn } from '@/lib/cn';

export function TeamDashboard() {
  const engine = useTeamEngine();
  const fmt = (n: number) => n.toLocaleString();

  if (engine.isLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">团队成长中心</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{engine.lockReason}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <div>
        <p className="text-xs font-semibold text-[var(--color-text-muted)]">组织成长</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">团队成长中心</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">培养成员、发展领导者，让业务不只靠你一个人推动。</p>
      </div>

      {/* Team Pipeline */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold mb-4">团队管道</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center text-sm">
          {[
            { label: '潜在人选', value: engine.stats.prospects, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: '客户', value: engine.stats.customers, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: '成员', value: engine.stats.members, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: '活跃', value: engine.stats.activeMembers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: '领导者', value: engine.stats.leaders, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: '留存率', value: engine.stats.retention, suffix: '%', color: 'text-blue-600', bg: 'bg-blue-50' },
          ].map(s => (
            <div key={s.label} className={cn('rounded p-3', s.bg)}>
              <p className={cn('text-xl font-semibold', s.color)}>{fmt(s.value as number)}{(s as any).suffix ?? ''}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Onboarding + Quick Actions */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">成员上手流程</h2>
          {[
            '步骤 1: 品牌基础',
            '步骤 2: 内容系统',
            '步骤 3: 获客系统',
            '步骤 4: 客户跟进',
            '步骤 5: 销售转化',
          ].map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-sm py-1">
              <div className={cn('h-3 w-3 rounded-full', i < engine.onboarding.completedSteps ? 'bg-emerald-500' : i === engine.onboarding.completedSteps ? 'bg-blue-500' : 'bg-gray-200')} />
              <span className={i < engine.onboarding.completedSteps ? 'text-emerald-600' : i === engine.onboarding.completedSteps ? 'text-blue-600 font-medium' : 'text-gray-400'}>{s}</span>
            </div>
          ))}
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">完成度 {engine.onboarding.percentage}%</p>
        </section>

        <section className="space-y-3">
          <Link href="/team" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
            <Users className="h-5 w-5 text-[var(--color-primary)]" /><span className="text-sm font-semibold">团队看板</span>
          </Link>
          <Link href="/team/members" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
            <UserPlus className="h-5 w-5 text-[var(--color-primary)]" /><span className="text-sm font-semibold">邀请成员</span>
          </Link>
          {engine.showFull && (
            <Link href="/franchise" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
              <Copy className="h-5 w-5 text-[var(--color-primary)]" /><span className="text-sm font-semibold">复制系统中心</span>
            </Link>
          )}
        </section>
      </div>

      {/* Organization Metrics */}
      {engine.showFull && (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">组织数据</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-sm">
            <div className="rounded bg-gray-50 p-3"><p className="text-lg font-semibold">{fmt(engine.org.totalMembers)}</p><p className="text-xs text-gray-500">成员</p></div>
            <div className="rounded bg-emerald-50 p-3"><p className="text-lg font-semibold text-emerald-600">{fmt(engine.org.activeMembers)}</p><p className="text-xs text-gray-500">活跃</p></div>
            <div className="rounded bg-amber-50 p-3"><p className="text-lg font-semibold text-amber-600">{fmt(engine.org.leaders)}</p><p className="text-xs text-gray-500">领导者</p></div>
            <div className="rounded bg-blue-50 p-3"><p className="text-lg font-semibold text-blue-600">{engine.org.retentionRate}%</p><p className="text-xs text-gray-500">留存率</p></div>
            <div className="rounded bg-purple-50 p-3"><p className="text-lg font-semibold text-purple-600">{engine.org.duplicationRate}%</p><p className="text-xs text-gray-500">复制率</p></div>
          </div>
        </section>
      )}
    </div>
  );
}
