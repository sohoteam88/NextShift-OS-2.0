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
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Team Engine</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{engine.lockReason}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Organization Growth</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Team Engine</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Build beyond yourself. Develop leaders. Scale your organization.</p>
      </div>

      {/* Team Pipeline */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold mb-4">Team Pipeline</h2>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-3 text-center text-sm">
          {[
            { label: 'Prospects', value: engine.stats.prospects, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: 'Customers', value: engine.stats.customers, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Members', value: engine.stats.members, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Active', value: engine.stats.activeMembers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
            { label: 'Leaders', value: engine.stats.leaders, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Retention', value: engine.stats.retention, suffix: '%', color: 'text-blue-600', bg: 'bg-blue-50' },
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
          <h2 className="text-base font-semibold mb-3">Member Onboarding</h2>
          {[
            'Step 1: Brand Foundation',
            'Step 2: Content Engine',
            'Step 3: Lead Engine',
            'Step 4: CRM Engine',
            'Step 5: Sales Engine',
          ].map((s, i) => (
            <div key={s} className="flex items-center gap-2 text-sm py-1">
              <div className={cn('h-3 w-3 rounded-full', i < engine.onboarding.completedSteps ? 'bg-emerald-500' : i === engine.onboarding.completedSteps ? 'bg-blue-500' : 'bg-gray-200')} />
              <span className={i < engine.onboarding.completedSteps ? 'text-emerald-600' : i === engine.onboarding.completedSteps ? 'text-blue-600 font-medium' : 'text-gray-400'}>{s}</span>
            </div>
          ))}
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">{engine.onboarding.percentage}% complete</p>
        </section>

        <section className="space-y-3">
          <Link href="/team" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
            <Users className="h-5 w-5 text-[var(--color-primary)]" /><span className="text-sm font-semibold">Team Dashboard</span>
          </Link>
          <Link href="/team/members" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
            <UserPlus className="h-5 w-5 text-[var(--color-primary)]" /><span className="text-sm font-semibold">Invite Members</span>
          </Link>
          {engine.showFull && (
            <Link href="/franchise" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
              <Copy className="h-5 w-5 text-[var(--color-primary)]" /><span className="text-sm font-semibold">Duplication Center</span>
            </Link>
          )}
        </section>
      </div>

      {/* Organization Metrics */}
      {engine.showFull && (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">Organization</h2>
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center text-sm">
            <div className="rounded bg-gray-50 p-3"><p className="text-lg font-semibold">{fmt(engine.org.totalMembers)}</p><p className="text-xs text-gray-500">Members</p></div>
            <div className="rounded bg-emerald-50 p-3"><p className="text-lg font-semibold text-emerald-600">{fmt(engine.org.activeMembers)}</p><p className="text-xs text-gray-500">Active</p></div>
            <div className="rounded bg-amber-50 p-3"><p className="text-lg font-semibold text-amber-600">{fmt(engine.org.leaders)}</p><p className="text-xs text-gray-500">Leaders</p></div>
            <div className="rounded bg-blue-50 p-3"><p className="text-lg font-semibold text-blue-600">{engine.org.retentionRate}%</p><p className="text-xs text-gray-500">Retention</p></div>
            <div className="rounded bg-purple-50 p-3"><p className="text-lg font-semibold text-purple-600">{engine.org.duplicationRate}%</p><p className="text-xs text-gray-500">Duplication</p></div>
          </div>
        </section>
      )}
    </div>
  );
}
