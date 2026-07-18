'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Badge } from '@/components/ui/Badge';
import { PageHeader } from '@/components/ui/PageHeader';

const STATUSES = ['open', 'acknowledged', 'in_progress', 'resolved', 'closed'] as const;
const STATUS_COLORS: Record<string, string> = { open: 'danger', acknowledged: 'warning', in_progress: 'info', resolved: 'success', closed: 'default' };

export default function SuperadminFeedbackPage() {
  const client = useQueryClient();
  const [status, setStatus] = React.useState('');
  const feedback = useQuery({
    queryKey: ['superadmin-feedback', status],
    queryFn: async () => {
      const url = new URL('/api/v1/superadmin/feedback', window.location.origin);
      if (status) url.searchParams.set('status', status);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Unable to load platform feedback');
      return response.json() as Promise<{ data: Array<{ id: string; type: string; message: string; tenantId: string; userId: string; status: string }> }>;
    },
  });
  const update = useMutation({
    mutationFn: async (input: { id: string; status: string }) => {
      const response = await fetch(`/api/v1/superadmin/feedback/${input.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: input.status }) });
      if (!response.ok) throw new Error('Unable to update platform feedback');
    },
    onSuccess: () => client.invalidateQueries({ queryKey: ['superadmin-feedback'] }),
  });
  return <div className="space-y-6 pb-12">
    <PageHeader eyebrow="Platform" title="Cross-tenant Feedback" description="Founder-only platform feedback operations." />
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => setStatus('')} className="rounded-full border px-3 py-1 text-xs">All</button>
      {STATUSES.map((entry) => <button type="button" key={entry} onClick={() => setStatus(entry)} className="rounded-full border px-3 py-1 text-xs">{entry}</button>)}
    </div>
    <div className="overflow-hidden rounded-lg border bg-white">
      {(feedback.data?.data ?? []).map((item) => <div key={item.id} className="grid gap-2 border-b p-4 md:grid-cols-[8rem_1fr_12rem]">
        <div><Badge>{item.type}</Badge><div className="mt-1 text-xs text-slate-500">{item.tenantId}</div></div>
        <p className="text-sm">{item.message}</p>
        <select aria-label={`Status for ${item.id}`} value={item.status} onChange={(event) => update.mutate({ id: item.id, status: event.target.value })} className="rounded border px-2 text-sm">
          {STATUSES.map((entry) => <option key={entry} value={entry}>{entry}</option>)}
        </select>
      </div>)}
      {feedback.isLoading ? <p className="p-6 text-sm text-slate-500">Loading…</p> : null}
      {!feedback.isLoading && feedback.data?.data.length === 0 ? <p className="p-6 text-sm text-slate-500">No feedback.</p> : null}
    </div>
  </div>;
}
