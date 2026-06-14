'use client';

import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { PageHeader } from '@/components/ui/PageHeader';
import { Badge } from '@/components/ui/Badge';

const STATUS_OPTIONS = ['open', 'acknowledged', 'in_progress', 'resolved', 'closed'] as const;
const TYPE_COLORS: Record<string, string> = { bug: 'danger', feature: 'info', ux: 'warning', general: 'default' };
const STATUS_COLORS: Record<string, string> = { open: 'danger', acknowledged: 'warning', in_progress: 'info', resolved: 'success', closed: 'default' };

export default function AdminFeedbackPage() {
  const qc = useQueryClient();
  const [filter, setFilter] = React.useState<string>('');

  const q = useQuery({
    queryKey: ['admin-feedback', filter],
    queryFn: async () => {
      const url = new URL('/api/v1/admin/feedback', window.location.origin);
      if (filter) url.searchParams.set('status', filter);
      const r = await fetch(url.toString());
      if (!r.ok) throw new Error('Failed');
      return r.json() as Promise<{ data: any[]; meta: any }>;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await fetch(`/api/v1/admin/feedback/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-feedback'] }),
  });

  const items = q.data?.data ?? [];

  return (
    <div className="space-y-6 pb-12">
      <PageHeader eyebrow="Admin" title="Feedback Inbox" description="Review and manage user-submitted feedback." />
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFilter('')} className={`px-3 py-1 text-xs rounded-full border ${!filter ? 'bg-blue-600 text-white' : 'bg-white'}`}>All</button>
        {STATUS_OPTIONS.map(s => <button key={s} onClick={() => setFilter(s)} className={`px-3 py-1 text-xs rounded-full border capitalize ${filter === s ? 'bg-blue-600 text-white' : 'bg-white'}`}>{s.replace('_', ' ')}</button>)}
      </div>
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm overflow-hidden">
        {q.isLoading ? <div className="p-10 text-center text-sm text-gray-400">Loading...</div> : items.length === 0 ? <div className="p-10 text-center text-sm text-gray-400">No feedback yet.</div> : (
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-xs text-gray-500"><tr><th className="px-4 py-3 text-left">Type</th><th className="px-4 py-3 text-left">Message</th><th className="px-4 py-3 text-left">Tenant</th><th className="px-4 py-3 text-left">User</th><th className="px-4 py-3 text-left">Status</th><th className="px-4 py-3 text-right">Actions</th></tr></thead>
            <tbody>
              {items.map((item: any) => (
                <tr key={item.id} className="border-t hover:bg-gray-50">
                  <td className="px-4 py-3"><Badge variant={TYPE_COLORS[item.type] as any}>{item.type}</Badge></td>
                  <td className="px-4 py-3 max-w-xs truncate" title={item.message}>{item.message.slice(0, 100)}{item.message.length > 100 ? '...' : ''}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.tenant?.name ?? '—'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{item.user?.name ?? '—'}</td>
                  <td className="px-4 py-3"><Badge variant={STATUS_COLORS[item.status] as any}>{item.status}</Badge></td>
                  <td className="px-4 py-3 text-right">
                    <select value={item.status} onChange={(e) => updateMutation.mutate({ id: item.id, status: e.target.value })} className="h-8 rounded border px-2 text-xs">
                      {STATUS_OPTIONS.map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
