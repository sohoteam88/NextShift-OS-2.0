'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronUp, MessageSquare } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/cn';
import type { LeaderDashboardMemberPerformance } from '../types';

type SortKey =
  | 'name'
  | 'leads_30d'
  | 'conversions_30d'
  | 'content_30d'
  | 'training_pct'
  | 'action_streak'
  | 'last_active';

type Props = {
  members: LeaderDashboardMemberPerformance[];
};

function daysInactive(date: string | null) {
  if (!date) return 999;
  return Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
}

function statusTone(member: LeaderDashboardMemberPerformance) {
  if (member.status_flag === 'active') return 'success';
  if (member.status_flag === 'cooling') return 'warning';
  return 'danger';
}

export function TeamPerformanceTable({ members }: Props) {
  const t = useTranslations('dashboard');
  const router = useRouter();
  const [sortKey, setSortKey] = React.useState<SortKey>('conversions_30d');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  const sorted = React.useMemo(() => {
    const next = [...members];
    next.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      const value = (member: LeaderDashboardMemberPerformance) => {
        switch (sortKey) {
          case 'name':
            return member.name.toLowerCase();
          case 'leads_30d':
            return member.leads_30d;
          case 'conversions_30d':
            return member.conversions_30d;
          case 'content_30d':
            return member.content_30d;
          case 'training_pct':
            return member.training_pct;
          case 'action_streak':
            return member.action_streak;
          case 'last_active':
            return member.last_active ? new Date(member.last_active).getTime() : 0;
          default:
            return 0;
        }
      };
      const av = value(a);
      const bv = value(b);
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * direction;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * direction;
      return 0;
    });
    return next;
  }, [members, sortDirection, sortKey]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'name' ? 'asc' : 'desc');
  }

  const header = (label: string, key: SortKey) => {
    const active = sortKey === key;
    return (
      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">
        <button type="button" className="inline-flex items-center gap-1" onClick={() => toggleSort(key)}>
          <span>{label}</span>
          {active ? sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" /> : <span className="h-3.5 w-3.5" />}
        </button>
      </th>
    );
  };

  return (
    <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('memberPerformance')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('memberPerformanceHelp')}</p>
        </div>
        <span className="text-sm text-[var(--color-text-muted)]">{t('showingMembers', { count: sorted.length, total: members.length })}</span>
      </div>

      <div className="space-y-3 md:hidden">
        {sorted.map((member) => {
          const tone = statusTone(member);
          return (
            <div
              key={member.id}
              className={cn(
                'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm',
                tone === 'warning' && 'bg-amber-50/50',
                tone === 'danger' && 'bg-red-50/50',
              )}
              onClick={() => router.push(`/admin/team/members?member=${member.id}`)}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatar_url} size="sm" />
                  <div>
                    <p className="font-medium text-[var(--color-text)]">{member.name}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">{member.role}</p>
                  </div>
                </div>
                <Badge variant={tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'success'}>
                  {tone === 'danger' ? '🔴' : tone === 'warning' ? '🟡' : '🟢'}
                </Badge>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
                <Metric label={t('leads30d')} value={String(member.leads_30d)} />
                <Metric label={t('conversions30d')} value={String(member.conversions_30d)} />
                <Metric label={t('content30d')} value={String(member.content_30d)} />
                <Metric label={t('trainingPct')} value={`${member.training_pct}%`} />
                <Metric label={t('actionStreak')} value={`🔥${member.action_streak}`} />
                <Metric label={t('lastActive')} value={member.last_active ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(member.last_active)) : '—'} />
              </div>
              <div className="mt-4 flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  className="flex-1"
                  icon={<MessageSquare className="h-4 w-4" />}
                  onClick={(event) => {
                    event.stopPropagation();
                    if (!member.phone) {
                      router.push(`/admin/team/members?member=${member.id}`);
                      return;
                    }
                    window.open(`https://wa.me/${member.phone.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer');
                  }}
                >
                  WhatsApp
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="bg-[var(--color-surface)]">
              <tr>
                {header(t('member'), 'name')}
                {header(t('leads30d'), 'leads_30d')}
                {header(t('conversions30d'), 'conversions_30d')}
                {header(t('content30d'), 'content_30d')}
                {header(t('trainingPct'), 'training_pct')}
                {header(t('actionStreak'), 'action_streak')}
                {header(t('lastActive'), 'last_active')}
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">{t('statusFlag')}</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">{t('quickActions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {sorted.map((member) => {
                const tone = statusTone(member);
                return (
                  <tr
                    key={member.id}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-[var(--color-surface)]',
                      tone === 'warning' && 'bg-amber-50/50',
                      tone === 'danger' && 'bg-red-50/50',
                    )}
                    onClick={() => router.push(`/admin/team/members?member=${member.id}`)}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} src={member.avatar_url} size="sm" />
                        <div>
                          <p className="font-medium text-[var(--color-text)]">{member.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{member.role}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{member.leads_30d}</td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{member.conversions_30d}</td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{member.content_30d}</td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{member.training_pct}%</td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">🔥{member.action_streak}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {member.last_active ? new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(member.last_active)) : '—'}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={tone === 'danger' ? 'danger' : tone === 'warning' ? 'warning' : 'success'}>
                        {tone === 'danger' ? '🔴' : tone === 'warning' ? '🟡' : '🟢'}
                        <span className="ml-1">{daysInactive(member.last_active) >= 999 ? '—' : `${daysInactive(member.last_active)}d`}</span>
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<MessageSquare className="h-4 w-4" />}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!member.phone) {
                            router.push(`/admin/team/members?member=${member.id}`);
                            return;
                          }
                          window.open(
                            `https://wa.me/${member.phone.replace(/\D/g, '')}`,
                            '_blank',
                            'noopener,noreferrer',
                          );
                        }}
                      >
                        WhatsApp
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2">
      <p className="text-[11px] uppercase tracking-wide text-[var(--color-text-muted)]">{label}</p>
      <p className="mt-1 font-semibold text-[var(--color-text)]">{value}</p>
    </div>
  );
}
