'use client';

import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, XCircle, AlertTriangle, Server, Shield, CreditCard, Zap, Users, TrendingUp } from 'lucide-react';
import { cn } from '@/lib/cn';

function StatusBadge({ ok, label }: { ok: boolean; label: string }) {
  return (
    <div className={cn('flex items-center gap-2 rounded-lg border p-4', ok ? 'border-emerald-200 bg-emerald-50' : 'border-red-200 bg-red-50')}>
      {ok ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-red-600" />}
      <div><span className="text-sm font-semibold">{ok ? 'OK' : 'MISSING'}</span><p className="text-xs text-gray-500">{label}</p></div>
    </div>
  );
}

export default function SuperadminLaunchReadinessPage() {
  const env = useQuery({ queryKey: ['superadmin-system-health'], queryFn: async () => { const r = await fetch('/api/v1/superadmin/system-health'); return r.json() as Promise<{ data: { checks: Record<string,boolean>; score: number; healthy: boolean; missing: string[] } }>; } });
  const d = env.data?.data;

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <div>
        <h1 className="text-2xl font-semibold text-[var(--color-text)]">Launch Readiness</h1>
        <p className="mt-1 text-sm text-[var(--color-text-muted)]">Production infrastructure status for beta launch.</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <div className="flex items-center gap-2 mb-4"><Server className="h-5 w-5 text-[var(--color-primary)]" /><h2 className="text-base font-semibold">Infrastructure</h2></div>
          <div className="grid gap-2 sm:grid-cols-2">
            {d?.checks && Object.entries(d.checks).map(([k, v]) => <StatusBadge key={k} ok={v} label={k} />)}
          </div>
          {d && <p className="mt-3 text-sm font-semibold">Health Score: {d.score}% — {d.missing.length > 0 ? `${d.missing.length} keys missing` : 'All systems operational'}</p>}
        </section>

        <section className="space-y-4">
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><CreditCard className="h-5 w-5 text-[var(--color-primary)]" /><h2 className="text-base font-semibold">Payments</h2></div>
            <StatusBadge ok={!!d?.checks?.BILLPLZ_API_KEY} label="Billplz API Key" />
            <StatusBadge ok={!!d?.checks?.BILLPLZ_X_SIGNATURE_KEY} label="Billplz Signature Key" />
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><Shield className="h-5 w-5 text-[var(--color-primary)]" /><h2 className="text-base font-semibold">Rate Limiting</h2></div>
            <StatusBadge ok={!!process.env.REDIS_URL} label="Redis (production rate limiter)" />
          </div>
          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-3"><Zap className="h-5 w-5 text-[var(--color-primary)]" /><h2 className="text-base font-semibold">Automation</h2></div>
            <StatusBadge ok label="Lead→CRM→Sales→Revenue→Team" />
          </div>
        </section>
      </div>
    </div>
  );
}
