'use client';
import { useRouter } from 'next/navigation';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Phone } from 'lucide-react';
import { ScoreBadge } from './ScoreBadge';
import { TagDot } from './TagBadge';
import { type LeadRow } from '../hooks/use-leads';
import { relativeTime } from '@/lib/relative-time';
import { cn } from '@/lib/cn';

type Props = { lead: LeadRow };

export function PipelineCard({ lead }: Props) {
  const router = useRouter();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: lead.id,
    data: { lead },
  });

  const style = transform
    ? { transform: CSS.Translate.toString(transform) }
    : undefined;

  const isOverdue =
    lead.nextFollowup != null && new Date(lead.nextFollowup as unknown as string) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={() => router.push(`/crm/${lead.id}`)}
      className={cn(
        'cursor-grab rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3 shadow-sm select-none',
        'hover:shadow-md transition-shadow',
        isDragging && 'opacity-50 shadow-lg cursor-grabbing',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {isOverdue && (
            <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-[var(--color-danger)]" title="跟进已逾期" />
          )}
          <p className="truncate text-sm font-medium text-[var(--color-text)]">{lead.name}</p>
        </div>
        <ScoreBadge score={lead.score} className="shrink-0 text-xs" />
      </div>

      {lead.phone && (
        <div className="mt-1.5 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
          <Phone className="h-3 w-3 shrink-0" />
          <span className="truncate">{lead.phone}</span>
        </div>
      )}

      <div className="mt-1.5 flex items-center justify-between">
        <p className="text-xs text-[var(--color-text-muted)]">{relativeTime(lead.updatedAt)}</p>
        {lead.tags.length > 0 && (
          <div className="flex gap-0.5">
            {lead.tags.slice(0, 4).map(({ tag }) => (
              <TagDot key={tag.id} color={tag.color} name={tag.name} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
