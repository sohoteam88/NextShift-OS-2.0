'use client';
import { useTranslations } from 'next-intl';
import type { WorkspaceCommandData, WorkspaceMemberHealth } from '@/modules/admin/services/workspaceHealthService';
import { PageHeader } from '@/components/ui/PageHeader';
import { useFormatters, scoreTone } from './helpers';

function MemberRow({ member }: { member: WorkspaceMemberHealth }) {
  const t = useTranslations('admin');
  const { formatDate } = useFormatters();
  return (
    <tr className="hover:bg-[var(--color-surface)]">
      <td className="border-b border-[var(--color-border)] px-4 py-3"><p className="font-medium text-[var(--color-text)]">{member.name}</p><p className="text-xs text-[var(--color-text-muted)]">{member.email}</p></td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">{member.role}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3"><div className="h-2 w-28 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-[var(--color-primary)]" style={{ width: `${member.journeyProgress}%` }} /></div><p className="mt-1 text-xs text-[var(--color-text-muted)]">{member.journeyProgress}% · {member.currentStage}</p></td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">{member.currentFunnel}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-[var(--color-text-muted)]">{formatDate(member.lastActiveAt)}</td>
      <td className="border-b border-[var(--color-border)] px-4 py-3"><span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${scoreTone(member.healthScore)}`}>{t('healthScore', { score: member.healthScore })}</span></td>
      <td className="border-b border-[var(--color-border)] px-4 py-3 text-sm">{member.needsHelp ? <span className="text-amber-700">{t('needsAttentionStatus')}</span> : <span className="text-emerald-700">{t('okStatus')}</span>}</td>
    </tr>
  );
}

export function AdminMembersCenter({ data }: { data: WorkspaceCommandData }) {
  const t = useTranslations('admin');
  const headers = [t('memberCol'), t('roleCol'), t('journeyProgressCol'), t('currentFunnelCol'), t('lastActiveCol'), t('healthCol'), t('needsHelpCol')];
  return (
    <div className="space-y-6">
      <PageHeader eyebrow={t('operations')} title={t('membersTitle')} description={t('membersHelp')} />
      <div className="overflow-x-auto rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <table className="min-w-full text-left text-sm">
          <thead className="text-xs text-[var(--color-text-muted)]"><tr>{headers.map((h) => <th key={h} className="border-b border-[var(--color-border)] px-4 py-3">{h}</th>)}</tr></thead>
          <tbody>{data.members.map((member) => <MemberRow key={member.id} member={member} />)}</tbody>
        </table>
      </div>
    </div>
  );
}
