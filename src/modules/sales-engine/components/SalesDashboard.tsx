'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, FileText, HelpCircle, Target, TrendingUp, Zap } from 'lucide-react';
import { useSalesEngine } from '../hooks/useSalesEngine';
import { cn } from '@/lib/cn';

export function SalesDashboard() {
  const engine = useSalesEngine();
  const fmt = (n: number) => n.toLocaleString();
  const rm = (n: number) => `RM ${fmt(n)}`;

  if (engine.isLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Sales Engine</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{engine.lockReason}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Revenue Generation</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Sales Engine</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Convert opportunities into revenue with structured sales processes.</p>
      </div>

      {/* Revenue KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-center">
        {[
          { label: 'Proposals', value: fmt(engine.stats.proposalsSent), color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Viewed', value: fmt(engine.stats.proposalsViewed), color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Closing', value: fmt(engine.stats.closing), color: 'text-amber-600', bg: 'bg-amber-50' },
          { label: 'Won', value: fmt(engine.stats.won), color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Lost', value: fmt(engine.stats.lost), color: 'text-red-600', bg: 'bg-red-50' },
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
          <h2 className="text-base font-semibold mb-3">Revenue</h2>
          <p className="text-2xl font-bold text-[var(--color-text)]">{rm(engine.stats.revenue)}</p>
          <div className="mt-2 space-y-1 text-xs text-[var(--color-text-muted)]">
            <p>Per Lead: {rm(engine.stats.revenuePerLead)}</p>
            <p>Avg Order: {rm(engine.stats.averageOrderValue)}</p>
            <p>Close Rate: {engine.stats.closeRate}%</p>
          </div>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">Forecast</h2>
          <p className="text-sm text-[var(--color-text-muted)]">Next Month</p>
          <p className="text-xl font-bold text-emerald-600">{rm(engine.forecast.nextMonth)}</p>
          <p className="text-sm text-[var(--color-text-muted)] mt-2">3 Months</p>
          <p className="text-xl font-bold text-emerald-600">{rm(engine.forecast.threeMonths)}</p>
        </section>

        {engine.showFeatures && (
          <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold mb-3">Objection Center</h2>
            <p className="text-xs text-[var(--color-text-muted)] mb-3">6 common objections with response frameworks.</p>
            <div className="text-xs space-y-1">
              {['Too Expensive', 'No Time', 'Need To Think', 'Spouse Approval'].map(o => (
                <div key={o} className="flex items-center gap-2"><HelpCircle className="h-3 w-3 text-amber-500" />{o}</div>
              ))}
            </div>
            <Link href="/lead-magnet" className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">View All Responses <ArrowRight className="h-3 w-3" /></Link>
          </section>
        )}
      </div>
    </div>
  );
}
