'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Check, RefreshCw, X } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { relativeTime } from '@/lib/relative-time';

type Role = 'member' | 'leader' | 'operator' | 'platform_admin';

type PendingMember = {
  id: string;
  name: string;
  email: string;
  phone?: string | null;
  role: string;
  status: string;
  languagePreference: string;
  createdAt: string;
  sponsor?: { id: string; name: string } | null;
  tenant?: { id: string; name: string; maxMembers: number } | null;
};

export function MemberApprovalQueue({ role }: { role: Role }) {
  const t = useTranslations('member');
  const common = useTranslations('common');
  const qc = useQueryClient();

  const pendingQuery = useQuery({
    queryKey: ['member-pending'],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/pending');
      if (!res.ok) throw new Error('Failed to load pending members');
      return res.json() as Promise<{ data: PendingMember[]; meta: { total: number } }>;
    },
    enabled: role !== 'member',
    refetchInterval: 30_000,
  });

  const approveMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const res = await fetch(`/api/v1/member/${memberId}/approve`, { method: 'POST' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to approve member');
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['member-pending'] });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ memberId, reason }: { memberId: string; reason?: string }) => {
      const res = await fetch(`/api/v1/member/${memberId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
      });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to reject member');
      }
      return res.json();
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['member-pending'] });
    },
  });

  async function handleReject(memberId: string, name: string) {
    const reason = window.prompt(t('rejectReasonPrompt', { name })) ?? '';
    await rejectMutation.mutateAsync({ memberId, reason: reason.trim() || undefined });
  }

  const members = pendingQuery.data?.data ?? [];

  if (role === 'member') {
    return (
      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <p className="text-sm text-[var(--color-text-muted)]">{t('noApprovalPermission')}</p>
      </section>
    );
  }

  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('approvalsTitle')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">
            {t('pendingCount', { count: pendingQuery.data?.meta.total ?? 0 })}
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          icon={<RefreshCw className="h-4 w-4" />}
          onClick={() => pendingQuery.refetch()}
        >
          {common('retry')}
        </Button>
      </div>

      {members.length === 0 ? (
        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] p-6 text-sm text-[var(--color-text-muted)]">
          {t('noPendingMembers')}
        </div>
      ) : (
        <div className="space-y-3">
          {members.map((member) => (
            <article
              key={member.id}
              className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-base font-semibold text-[var(--color-text)]">{member.name}</h3>
                    <Badge variant="warning">{member.status}</Badge>
                  </div>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {t('invitedBy', { name: member.sponsor?.name ?? '—' })} · {relativeTime(member.createdAt)}
                  </p>
                  <p className="text-sm text-[var(--color-text)]">
                    📧 {member.email}
                    {member.phone ? ` · 📱 ${member.phone}` : ''}
                  </p>
                  <p className="text-xs text-[var(--color-text-muted)]">
                    {member.tenant?.name ?? ''} · {member.languagePreference}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    loading={approveMutation.isPending}
                    icon={<Check className="h-4 w-4" />}
                    onClick={() => approveMutation.mutate(member.id)}
                  >
                    {t('approveMember')}
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    loading={rejectMutation.isPending}
                    icon={<X className="h-4 w-4" />}
                    onClick={() => handleReject(member.id, member.name)}
                  >
                    {t('rejectMember')}
                  </Button>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
