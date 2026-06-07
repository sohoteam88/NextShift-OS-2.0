'use client';
import { useRouter } from 'next/navigation';
import { Avatar } from '@/components/ui/Avatar';
import { Skeleton } from '@/components/ui/Skeleton';
import { LeadScoreBadge } from './LeadScoreBadge';
import { TagBadge } from './TagBadge';
import { type LeadRow } from '../hooks/use-leads';
import { relativeTime } from '@/lib/relative-time';

type Props = {
  leads: LeadRow[];
  loading?: boolean;
};

const skeletonRows = Array.from({ length: 5 });

export function LeadTable({ leads, loading }: Props) {
  const router = useRouter();

  if (loading) {
    return (
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white">
        <table className="w-full text-sm">
          <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            <tr>
              {['姓名', '标签', '评分', '阶段', '下次跟进', '来源', '电话', '负责人', '最近更新'].map((h) => (
                <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--color-border)]">
            {skeletonRows.map((_, i) => (
              <tr key={i}>
                {skeletonRows.slice(0, 7).map((__, j) => (
                  <td key={j} className="px-4 py-3"><Skeleton className="h-4 w-full" /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white">
      <table className="w-full text-sm">
        <thead className="border-b border-[var(--color-border)] bg-[var(--color-surface)]">
          <tr>
            {['姓名', '评分', '阶段', '来源', '电话', '负责人', '最近更新'].map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-medium text-[var(--color-text-muted)]">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--color-border)]">
          {leads.map((lead) => (
            <tr
              key={lead.id}
              className="cursor-pointer hover:bg-[var(--color-surface)] transition-colors"
              onClick={() => router.push(`/crm/${lead.id}`)}
            >
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  {lead.nextFollowup && new Date(lead.nextFollowup) < new Date() && (
                    <span className="h-2 w-2 shrink-0 rounded-full bg-[var(--color-danger)]" title="跟进已逾期" />
                  )}
                  <span className="font-medium text-[var(--color-text)]">{lead.name}</span>
                </div>
              </td>
              <td className="px-4 py-3">
                <div className="flex flex-wrap gap-1">
                  {lead.tags.slice(0, 2).map(({ tag }) => (
                    <TagBadge key={tag.id} name={tag.name} color={tag.color} />
                  ))}
                  {lead.tags.length > 2 && (
                    <span className="text-xs text-[var(--color-text-muted)]">+{lead.tags.length - 2}</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-3"><LeadScoreBadge score={lead.score} /></td>
              <td className="px-4 py-3 text-[var(--color-text-muted)]">{lead.pipelineStage}</td>
              <td className="px-4 py-3">
                {lead.nextFollowup ? (
                  <span className={new Date(lead.nextFollowup) < new Date() ? 'font-medium text-red-600' : 'text-[var(--color-text-muted)]'}>
                    {new Date(lead.nextFollowup).toLocaleDateString('zh-CN', { month: 'numeric', day: 'numeric' })}
                  </span>
                ) : (
                  <span className="text-[var(--color-text-muted)]">—</span>
                )}
              </td>
              <td className="px-4 py-3 text-[var(--color-text-muted)]">{lead.source ?? '—'}</td>
              <td className="px-4 py-3 text-[var(--color-text-muted)]">{lead.phone ?? '—'}</td>
              <td className="px-4 py-3">
                <div className="flex items-center gap-2">
                  <Avatar name={lead.owner.name} size="sm" />
                  <span className="text-[var(--color-text-muted)]">{lead.owner.name}</span>
                </div>
              </td>
              <td className="px-4 py-3 text-[var(--color-text-muted)]">{relativeTime(lead.updatedAt)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
