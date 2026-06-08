'use client';
import { useRouter } from 'next/navigation';
import { Phone } from 'lucide-react';
import { Avatar } from '@/components/ui/Avatar';
import { LeadScoreBadge } from './LeadScoreBadge';
import { TagBadge } from './TagBadge';
import { type LeadRow } from '../hooks/use-leads';
import { relativeTime } from '@/lib/relative-time';

type Props = { lead: LeadRow };

export function LeadCard({ lead }: Props) {
  const router = useRouter();

  return (
    <div
      className="cursor-pointer rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
      onClick={() => router.push(`/crm/${lead.id}`)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <Avatar name={lead.name} size="md" />
          <div>
            <p className="font-medium text-[var(--color-text)]">{lead.name}</p>
            <p className="text-xs text-[var(--color-text-muted)]">
              {lead.pipelineStage} · {relativeTime(lead.updatedAt)}
            </p>
          </div>
        </div>
        <LeadScoreBadge score={lead.score} />
      </div>

      {lead.phone && (
        <div className="mt-3 flex items-center gap-1.5 text-sm text-[var(--color-text-muted)]">
          <Phone className="h-3.5 w-3.5" />
          <span>{lead.phone}</span>
        </div>
      )}

      {lead.tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {lead.tags.slice(0, 3).map(({ tag }) => (
            <TagBadge key={tag.id} name={tag.name} color={tag.color} />
          ))}
          {lead.tags.length > 3 && (
            <span className="text-xs text-[var(--color-text-muted)]">+{lead.tags.length - 3}</span>
          )}
        </div>
      )}
    </div>
  );
}
