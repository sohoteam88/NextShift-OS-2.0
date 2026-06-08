'use client';

import * as React from 'react';
import { ChevronDown, ChevronUp, Filter, Users } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { cn } from '@/lib/cn';
import { relativeTime } from '@/lib/relative-time';
import type { TeamMemberRow } from '../types';
import { TeamMemberCard } from './TeamMemberCard';

type SortKey =
  | 'name'
  | 'role'
  | 'lead_count'
  | 'conversion_rate'
  | 'content_count'
  | 'training'
  | 'daily_action_streak'
  | 'last_active_at';

type Props = {
  members: TeamMemberRow[];
  loading?: boolean;
  selectedId?: string | null;
  onSelect: (member: TeamMemberRow) => void;
};

const skeletonRows = Array.from({ length: 5 });

function inactiveTone(date: string | null) {
  if (!date) return 'normal';
  const diffDays = Math.floor((Date.now() - new Date(date).getTime()) / 86_400_000);
  if (diffDays >= 14) return 'critical';
  if (diffDays >= 7) return 'warning';
  return 'normal';
}

export function TeamMemberList({ members, loading = false, selectedId, onSelect }: Props) {
  const t = useTranslations('team');
  const [roleFilter, setRoleFilter] = React.useState('all');
  const [statusFilter, setStatusFilter] = React.useState('all');
  const [sortKey, setSortKey] = React.useState<SortKey>('last_active_at');
  const [sortDirection, setSortDirection] = React.useState<'asc' | 'desc'>('desc');

  const filteredMembers = React.useMemo(() => {
    return members.filter((member) => {
      if (roleFilter !== 'all' && member.role !== roleFilter) return false;
      if (statusFilter !== 'all' && member.status !== statusFilter) return false;
      return true;
    });
  }, [members, roleFilter, statusFilter]);

  const sortedMembers = React.useMemo(() => {
    const next = [...filteredMembers];
    next.sort((a, b) => {
      const direction = sortDirection === 'asc' ? 1 : -1;
      const getValue = (member: TeamMemberRow) => {
        switch (sortKey) {
          case 'name':
            return member.name.toLowerCase();
          case 'role':
            return member.role.toLowerCase();
          case 'lead_count':
            return member.lead_count;
          case 'conversion_rate':
            return member.lead_count > 0 ? member.conversion_count / member.lead_count : 0;
          case 'content_count':
            return member.content_count;
          case 'training':
            return member.training_completed / Math.max(member.training_total, 1);
          case 'daily_action_streak':
            return member.daily_action_streak;
          case 'last_active_at':
            return member.last_active_at ? new Date(member.last_active_at).getTime() : 0;
          default:
            return 0;
        }
      };
      const av = getValue(a);
      const bv = getValue(b);
      if (typeof av === 'string' && typeof bv === 'string') return av.localeCompare(bv) * direction;
      if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * direction;
      return 0;
    });
    return next;
  }, [filteredMembers, sortDirection, sortKey]);
  const statusLabel = (status: string) => (status === 'active' ? t('active') : status === 'pending' ? t('pending') : t('suspended'));

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDirection((current) => (current === 'asc' ? 'desc' : 'asc'));
      return;
    }
    setSortKey(key);
    setSortDirection(key === 'last_active_at' ? 'desc' : 'asc');
  }

  const headerCell = (label: string, key?: SortKey) => {
    if (!key) {
      return <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">{label}</th>;
    }

    const active = sortKey === key;
    return (
      <th className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">
        <button
          type="button"
          className="inline-flex items-center gap-1 text-left"
          onClick={() => handleSort(key)}
        >
          <span>{label}</span>
          {active ? (
            sortDirection === 'asc' ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />
          ) : (
            <span className="h-3.5 w-3.5" />
          )}
        </button>
      </th>
    );
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {['', '', '', ''].map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        </div>

        <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
          <table className="w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <tr>
                {['', '', '', '', '', '', '', ''].map((_, index) => (
                  <th key={index} className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {skeletonRows.map((_, index) => (
                <tr key={index}>
                  {Array.from({ length: 8 }).map((__, cellIndex) => (
                    <td key={cellIndex} className="px-4 py-3">
                      <Skeleton className="h-4 w-full" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm sm:flex-row sm:flex-wrap sm:items-center">
        <div className="inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
          <Filter className="h-4 w-4" />
          <span>{t('filters')}</span>
        </div>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)]"
        >
          <option value="all">{t('allRoles')}</option>
          <option value="operator">operator</option>
          <option value="leader">leader</option>
          <option value="member">member</option>
        </select>

        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="h-10 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm text-[var(--color-text)]"
        >
          <option value="all">{t('allStatus')}</option>
          <option value="active">{t('active')}</option>
          <option value="pending">{t('pending')}</option>
          <option value="suspended">{t('suspended')}</option>
        </select>

        <div className="text-sm text-[var(--color-text-muted)] sm:ml-auto">
          {t('showingMembers', { count: sortedMembers.length, total: members.length })}
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {sortedMembers.map((member) => {
          const tone = inactiveTone(member.last_active_at);
          const phone = member.phone;
          return (
            <div
              key={member.id}
              className={cn(
                tone === 'warning' && 'rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50/50',
                tone === 'critical' && 'rounded-[var(--radius-lg)] border border-red-200 bg-red-50/50',
              )}
            >
              <TeamMemberCard
                member={member}
                compact
                selected={selectedId === member.id}
                onViewDetails={() => onSelect(member)}
                onSendMessage={
                  phone
                    ? () => window.open(`https://wa.me/${phone.replace(/\D/g, '')}`, '_blank', 'noopener,noreferrer')
                    : undefined
                }
              />
            </div>
          );
        })}
      </div>

      <div className="hidden overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm md:block">
        <div className="overflow-x-auto">
          <table className="min-w-[1100px] w-full text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
              <tr>
                {headerCell(t('member'), 'name')}
                {headerCell(t('role'), 'role')}
                {headerCell(t('leadCount'), 'lead_count')}
                {headerCell(t('conversionRate'), 'conversion_rate')}
                {headerCell(t('contentCount'), 'content_count')}
                {headerCell(t('training'), 'training')}
                {headerCell(t('actionStreak'), 'daily_action_streak')}
                {headerCell(t('lastActive'), 'last_active_at')}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {sortedMembers.map((member) => {
                const tone = inactiveTone(member.last_active_at);
                return (
                  <tr
                    key={member.id}
                    onClick={() => onSelect(member)}
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-[var(--color-surface)]',
                      selectedId === member.id && 'bg-blue-50/60',
                      tone === 'warning' && 'bg-amber-50/50',
                      tone === 'critical' && 'bg-red-50/50',
                    )}
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <Avatar name={member.name} src={member.avatar_url} size="sm" />
                        <div>
                          <p className="font-medium text-[var(--color-text)]">{member.name}</p>
                          <p className="text-xs text-[var(--color-text-muted)]">{member.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="info">{member.role}</Badge>
                      <span className="ml-2 text-xs text-[var(--color-text-muted)]">{statusLabel(member.status)}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{member.lead_count}</td>
                    <td className="px-4 py-3">
                      <span className="font-medium text-[var(--color-text)]">
                        {member.lead_count > 0 ? Math.round((member.conversion_count / member.lead_count) * 100) : 0}%
                      </span>
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">{member.content_count}</td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">
                      {member.training_completed}/{member.training_total}
                    </td>
                    <td className="px-4 py-3 font-medium text-[var(--color-text)]">🔥{member.daily_action_streak}</td>
                    <td className="px-4 py-3 text-[var(--color-text-muted)]">
                      {member.last_active_at ? relativeTime(member.last_active_at) : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {sortedMembers.length === 0 && (
        <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-white p-6 text-sm text-[var(--color-text-muted)] shadow-sm">
          <div className="flex items-center gap-2 font-medium text-[var(--color-text)]">
            <Users className="h-4 w-4" />
            <span>{t('noMembers')}</span>
          </div>
          <p className="mt-2">{t('noMembersDesc')}</p>
        </div>
      )}
    </div>
  );
}
