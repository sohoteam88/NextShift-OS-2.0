'use client';

import * as React from 'react';
import { ArrowUpRight, MessageSquare, UserCircle2 } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/relative-time';
import type { TeamMemberNode, TeamMemberRow } from '../types';

type TeamMemberLike = TeamMemberNode | TeamMemberRow;

type Props = {
  member: TeamMemberLike;
  className?: string;
  compact?: boolean;
  selected?: boolean;
  onViewDetails?: () => void;
  onSendMessage?: () => void;
};

function statusVariant(status: string) {
  if (status === 'active') return 'success';
  if (status === 'pending') return 'warning';
  return 'default';
}

function statusBorder(status: string) {
  if (status === 'active') return 'border-emerald-200';
  if (status === 'pending') return 'border-amber-200';
  return 'border-slate-200';
}

function teamSize(member: TeamMemberLike) {
  if ('children' in member) return member.children.length;
  return member.direct_children_count;
}

function formatDate(date: string | null) {
  if (!date) return '—';
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(date));
}

export function TeamMemberCard({
  member,
  className,
  compact = false,
  selected = false,
  onViewDetails,
  onSendMessage,
}: Props) {
  const t = useTranslations('team');
  const size = teamSize(member);
  const conversionRate = member.lead_count > 0 ? Math.round((member.conversion_count / member.lead_count) * 100) : 0;
  const statusLabel = member.status === 'active' ? t('active') : member.status === 'pending' ? t('pending') : t('suspended');

  return (
    <div
      className={cn(
        'rounded-[var(--radius-lg)] border bg-white p-4 shadow-sm transition-shadow',
        statusBorder(member.status),
        selected ? 'ring-2 ring-[var(--color-primary)] ring-offset-2' : 'hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={member.name} src={member.avatar_url} size="md" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="truncate font-semibold text-[var(--color-text)]">{member.name}</p>
              <Badge variant={statusVariant(member.status)}>{statusLabel}</Badge>
            </div>
            <p className="truncate text-sm text-[var(--color-text-muted)]">{member.role} · {member.email}</p>
          </div>
        </div>

        {!compact && (
          <div className="text-right text-xs text-[var(--color-text-muted)]">
            <p>{t('joinedAt')}: {formatDate(member.joined_at)}</p>
            <p className="mt-1">{t('lastActive')}: {member.last_active_at ? relativeTime(member.last_active_at) : '—'}</p>
          </div>
        )}
      </div>

      <div className={cn('mt-4 grid gap-3', compact ? 'grid-cols-2' : 'grid-cols-2 md:grid-cols-3')}>
        <Stat label={t('leadCount')} value={String(member.lead_count)} />
        <Stat label={t('conversionCount')} value={`${member.conversion_count} (${conversionRate}%)`} />
        {!compact && <Stat label={t('contentCount')} value={`${member.content_count}`} />}
        {!compact && <Stat label={t('training')} value={`${member.training_completed}/${member.training_total}`} />}
        {!compact && <Stat label={t('actionStreak')} value={`${member.daily_action_streak} ${t('days')}`} />}
        <Stat label={t('teamSize')} value={String(size)} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {onViewDetails && (
          <Button
            variant="secondary"
            size="sm"
            icon={<ArrowUpRight className="h-4 w-4" />}
            onClick={onViewDetails}
          >
            {t('viewDetails')}
          </Button>
        )}
        {member.phone && onSendMessage && (
          <Button
            variant="secondary"
            size="sm"
            icon={<MessageSquare className="h-4 w-4" />}
            onClick={onSendMessage}
          >
            {t('sendMessage')}
          </Button>
        )}
        <div className="ml-auto flex items-center gap-1.5 text-xs text-[var(--color-text-muted)]">
          <UserCircle2 className="h-3.5 w-3.5" />
          <span>{t('status')}: {statusLabel}</span>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
