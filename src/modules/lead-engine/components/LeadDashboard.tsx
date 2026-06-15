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
        <h1 className="text-xl font-semibold text-[var(--color-text)]">Lead Engine</h1>
        <p className="mt-2 text-sm text-[var(--color-text-muted)]">{engine.lockReason}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Lead Generation</p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Lead Engine</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Convert attention into qualified prospects.</p>
      </div>

      {/* Lead Pipeline */}
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <h2 className="text-base font-semibold mb-4">Lead Pipeline</h2>
        <div className="grid grid-cols-5 gap-3 text-center text-sm">
          {[
            { label: 'Visitors', value: engine.pipeline.visitors, color: 'text-gray-600', bg: 'bg-gray-50' },
            { label: 'Leads', value: engine.pipeline.leads, color: 'text-blue-600', bg: 'bg-blue-50' },
            { label: 'Qualified', value: engine.pipeline.qualified, color: 'text-purple-600', bg: 'bg-purple-50' },
            { label: 'Appts', value: engine.pipeline.appointments, color: 'text-amber-600', bg: 'bg-amber-50' },
            { label: 'Customers', value: engine.pipeline.customers, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          ].map(s => (
            <div key={s.label} className={cn('rounded p-3', s.bg)}>
              <p className={cn('text-lg font-semibold', s.color)}>{s.value}</p>
              <p className="text-xs text-gray-500">{s.label}</p>
            </div>
          ))}
        </div>
        <p className="mt-2 text-xs text-[var(--color-text-muted)]">{engine.pipeline.conversionRate}% lead-to-customer conversion</p>
      </section>

      {/* Lead Scoring + Quick Actions */}
      <div className="grid gap-5 md:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <h2 className="text-base font-semibold mb-3">Lead Scoring</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between"><span>Magnet Download</span><span className="font-semibold text-blue-600">+20</span></div>
            <div className="flex justify-between"><span>Quiz Complete</span><span className="font-semibold text-blue-600">+30</span></div>
            <div className="flex justify-between"><span>WhatsApp Click</span><span className="font-semibold text-blue-600">+20</span></div>
            <div className="flex justify-between"><span>3+ Page Visits</span><span className="font-semibold text-blue-600">+15</span></div>
            <div className="flex justify-between"><span>Form Complete</span><span className="font-semibold text-blue-600">+25</span></div>
            <div className="flex justify-between"><span>Appt Request</span><span className="font-semibold text-emerald-600">+50</span></div>
          </div>
          <div className="mt-3 flex gap-3 text-xs">
            <span className="rounded bg-blue-50 px-2 py-1 text-blue-600">0–39 Cold</span>
            <span className="rounded bg-amber-50 px-2 py-1 text-amber-600">40–69 Warm</span>
            <span className="rounded bg-red-50 px-2 py-1 text-red-600">70+ Hot</span>
          </div>
        </section>

        <section className="space-y-3">
          <Link href="/lead-magnet" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
            <FileText className="h-5 w-5 text-[var(--color-primary)]" />
            <div className="flex-1"><span className="text-sm font-semibold">Create Lead Magnet</span><p className="text-xs text-[var(--color-text-muted)]">PDF, Checklist, Quiz, Mini Course</p></div>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/funnel-builder" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
            <Target className="h-5 w-5 text-[var(--color-primary)]" />
            <div className="flex-1"><span className="text-sm font-semibold">Build Landing Page</span><p className="text-xs text-[var(--color-text-muted)]">High-converting lead capture page</p></div>
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link href="/crm" className="flex items-center gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm hover:bg-[var(--color-surface)]">
            <Users className="h-5 w-5 text-[var(--color-primary)]" />
            <div className="flex-1"><span className="text-sm font-semibold">Manage Leads</span><p className="text-xs text-[var(--color-text-muted)]">CRM — view and qualify leads</p></div>
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>
      </div>
    </div>
  );
}
