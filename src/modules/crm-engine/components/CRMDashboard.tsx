'use client';

import Link from 'next/link';
import { ArrowRight, BarChart3, CalendarCheck, Clock, Phone, Target, Trophy, Users } from 'lucide-react';
import { useCRMEngine } from '../hooks/useCRMEngine';
import { useDashboardMission } from '@/modules/dashboard/hooks/useDashboardMission';
import { cn } from '@/lib/cn';

export function CRMDashboard() {
  const engine = useCRMEngine();
  const { mission } = useDashboardMission();

  if (engine.isLocked) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <h1 className="text-xl font-semibold text-[var(--color-text)]">CRM Engine</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{engine.lockReason}</p>
      </div>
    );
  }

  const fmt = (n: number) => n.toLocaleString();
  const rm = (n: number) => `RM ${fmt(n)}`;

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Customer Conversion</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">CRM Engine</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Convert leads into customers with systematic follow-up.</p>
      </div>

      {/* Pipeline + Follow-ups */}
      <div className="grid gap-5 md:grid-cols-3">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm md:col-span-2">
          <h2 className="text-base font-semibold mb-3">Pipeline</h2>
          <div className="grid grid-cols-7 gap-1 text-center text-xs">
            {[
              { label: 'New', value: engine.stats.pipeline.new, color: 'bg-gray-100' },
              { label: 'Contacted', value: engine.stats.pipeline.contacted, color: 'bg-blue-50' },
              { label: 'Qualified', value: engine.stats.pipeline.qualified, color: 'bg-purple-50' },
              { label: 'Appt', value: engine.stats.pipeline.appointment, color: 'bg-amber-50' },
              { label: 'Proposal', value: engine.stats.pipeline.proposal, color: 'bg-orange-50' },
              { label: 'Customer', value: engine.stats.pipeline.customer, color: 'bg-emerald-50' },
              { label: 'Lost', value: engine.stats.pipeline.lost, color: 'bg-red-50' },
            ].map(s => (
              <div key={s.label} className={cn('rounded p-2', s.color)}>
                <p className="font-semibold text-sm">{s.value}</p>
                <p className="text-[10px] text-gray-500">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-[var(--color-text-muted)]">{engine.stats.pipeline.conversionRate}% conversion · {rm(engine.stats.pipeline.totalValue)} pipeline value</p>
        </section>

        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">Follow-Ups</h2>
          <div className="space-y-3 text-sm">
            <div className="flex items-center justify-between rounded bg-red-50 p-3">
              <span className="font-semibold text-red-600">{engine.stats.dueFollowUps} Due Today</span>
              <Clock className="h-4 w-4 text-red-400" />
            </div>
            <div className="flex items-center justify-between rounded bg-amber-50 p-3">
              <span className="font-semibold text-amber-600">{engine.stats.overdueFollowUps} Overdue</span>
              <CalendarCheck className="h-4 w-4 text-amber-400" />
            </div>
            <div className="flex items-center justify-between rounded bg-emerald-50 p-3">
              <span className="font-semibold text-emerald-600">{engine.stats.hotOpportunities} Hot</span>
              <Trophy className="h-4 w-4 text-emerald-400" />
            </div>
          </div>
          <Link href="/crm" className="mt-3 inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)]">Open CRM <ArrowRight className="h-3 w-3" /></Link>
        </section>
      </div>

      {/* Quick Actions */}
      <div className="grid gap-5 md:grid-cols-3">
        <Link href="/crm/pipeline" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
          <Target className="h-5 w-5 text-[var(--color-primary)]" /><span className="text-sm font-semibold">Pipeline Board</span>
        </Link>
        <Link href="/whatsapp-ai" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
          <Phone className="h-5 w-5 text-[var(--color-primary)]" /><span className="text-sm font-semibold">WhatsApp AI</span>
        </Link>
        <Link href="/crm" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
          <Users className="h-5 w-5 text-[var(--color-primary)]" /><span className="text-sm font-semibold">All Leads</span>
        </Link>
      </div>
    </div>
  );
}
