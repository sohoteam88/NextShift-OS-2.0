'use client';

import * as React from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useTranslations } from 'next-intl';
import { Copy, MessageSquareShare, RefreshCw, Link2 } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { relativeTime } from '@/lib/relative-time';

type Role = 'member' | 'leader' | 'operator' | 'platform_admin';

type InviteItem = {
  code: string;
  url: string;
  used: boolean;
  expiresAt: string;
  createdAt: string;
  tenantName: string;
  sponsorName: string;
};

export function MemberInvitePanel({ role }: { role: Role }) {
  const t = useTranslations('member');
  const common = useTranslations('common');
  const qc = useQueryClient();

  const invitesQuery = useQuery({
    queryKey: ['member-invites'],
    queryFn: async () => {
      const res = await fetch('/api/v1/member/invite');
      if (!res.ok) throw new Error('Failed to load invites');
      return res.json() as Promise<{ data: InviteItem[] }>;
    },
    enabled: role !== 'member',
    refetchInterval: 30_000,
  });

  const createInvite = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/v1/member/invite', { method: 'POST' });
      if (!res.ok) {
        const payload = await res.json().catch(() => null);
        throw new Error(payload?.error?.message ?? 'Failed to create invite');
      }
      return res.json() as Promise<{ data: InviteItem }>;
    },
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['member-invites'] });
    },
  });

  const invite = invitesQuery.data?.data?.[0] ?? null;

  async function handleCopy(url: string) {
    await navigator.clipboard.writeText(url);
  }

  async function handleShare(url: string) {
    window.open(
      `https://wa.me/?text=${encodeURIComponent(url)}`,
      '_blank',
      'noopener,noreferrer',
    );
  }

  if (role === 'member') {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <p className="text-sm text-[var(--color-text-muted)]">{t('noInvitePermission')}</p>
      </div>
    );
  }

  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('inviteTitle')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('inviteHelp')}</p>
        </div>
        <Badge variant={invite ? 'success' : 'warning'}>{invite ? t('inviteGenerated') : t('noInviteYet')}</Badge>
      </div>

      {invite ? (
        <div className="space-y-4">
          <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
              {t('yourInviteLink')}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <code className="break-all rounded-[var(--radius-md)] bg-white px-3 py-2 text-sm text-[var(--color-text)]">
                {invite.url}
              </code>
              <Button variant="secondary" size="sm" icon={<Copy className="h-4 w-4" />} onClick={() => handleCopy(invite.url)}>
                {common('copy')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                icon={<MessageSquareShare className="h-4 w-4" />}
                onClick={() => handleShare(invite.url)}
              >
                {t('shareWhatsApp')}
              </Button>
              <Button
                variant="secondary"
                size="sm"
                loading={createInvite.isPending}
                icon={<RefreshCw className="h-4 w-4" />}
                onClick={() => createInvite.mutate()}
              >
                {t('generateNewLink')}
              </Button>
            </div>
            <div className="mt-3 flex flex-wrap gap-2 text-xs text-[var(--color-text-muted)]">
              <span>{t('validForDays')}</span>
              <span>•</span>
              <span>{relativeTime(invite.createdAt)}</span>
              <span>•</span>
              <span>{invite.sponsorName}</span>
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">{t('tenant')}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{invite.tenantName}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs font-medium text-[var(--color-text-muted)]">{t('activeInvites')}</p>
              <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{invitesQuery.data?.data.length ?? 0}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-[var(--color-text-muted)]">{t('noInviteYet')}</p>
          <Button
            loading={createInvite.isPending}
            onClick={() => createInvite.mutate()}
            icon={<Link2 className="h-4 w-4" />}
          >
            {t('generateNewLink')}
          </Button>
        </div>
      )}
    </section>
  );
}
