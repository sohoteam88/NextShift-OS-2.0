'use client';
import { useRouter } from 'next/navigation';
import { MessageCircle, CheckCircle } from 'lucide-react';
import { ScoreBadge } from './ScoreBadge';
import { useFollowups, useSetFollowup } from '../hooks/use-followup';
import { useToast } from '@/stores/toast-store';
import { type LeadRow } from '../hooks/use-leads';
import { Skeleton } from '@/components/ui/Skeleton';
import { relativeTime } from '@/lib/relative-time';

type LeadItemProps = {
  lead: LeadRow;
  overdue?: boolean;
  onDone: (id: string) => void;
};

function LeadItem({ lead, overdue, onDone }: LeadItemProps) {
  const router = useRouter();
  return (
    <div className={`flex items-center justify-between rounded-[var(--radius-md)] px-3 py-2 ${overdue ? 'bg-red-50' : 'hover:bg-[var(--color-surface)]'}`}>
      <button
        className="flex flex-1 items-center gap-3 text-left"
        onClick={() => router.push(`/crm/${lead.id}`)}
      >
        <div className="min-w-0 flex-1">
          <p className={`truncate text-sm font-medium ${overdue ? 'text-red-700' : 'text-[var(--color-text)]'}`}>
            {lead.name}
          </p>
          <p className="text-xs text-[var(--color-text-muted)]">
            {lead.nextFollowup
              ? overdue
                ? `逾期 ${Math.floor((Date.now() - new Date(lead.nextFollowup).getTime()) / 86_400_000)} 天`
                : new Date(lead.nextFollowup).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
              : ''}
          </p>
        </div>
        <ScoreBadge score={lead.score} className="shrink-0" />
      </button>

      <div className="ml-2 flex items-center gap-1">
        {lead.phone && (
          <a
            href={`https://wa.me/${lead.phone.replace(/\D/g, '')}`}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="rounded p-1 text-emerald-600 hover:bg-emerald-50"
            title="WhatsApp"
          >
            <MessageCircle className="h-4 w-4" />
          </a>
        )}
        <button
          onClick={(e) => { e.stopPropagation(); onDone(lead.id); }}
          className="rounded p-1 text-[var(--color-text-muted)] hover:bg-green-50 hover:text-green-600"
          title="完成跟进"
        >
          <CheckCircle className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function Section({ title, leads, overdue, onDone }: { title: string; leads: LeadRow[]; overdue?: boolean; onDone: (id: string) => void }) {
  if (leads.length === 0) return null;
  return (
    <div>
      <h4 className={`mb-1 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide ${overdue ? 'text-red-600' : 'text-[var(--color-text-muted)]'}`}>
        {overdue && <span className="h-2 w-2 rounded-full bg-red-500" />}
        {title} ({leads.length})
      </h4>
      <div className="space-y-0.5">
        {leads.map((l) => <LeadItem key={l.id} lead={l} overdue={overdue} onDone={onDone} />)}
      </div>
    </div>
  );
}

export function FollowupWidget() {
  const { data, isLoading } = useFollowups();
  const setFollowup = useSetFollowup();
  const { toast } = useToast();

  const total = (data?.data.overdue.length ?? 0) + (data?.data.today.length ?? 0);

  async function handleDone(leadId: string) {
    try {
      await setFollowup.mutateAsync({ leadId, date: null });
      toast('success', '跟进已完成');
    } catch {
      toast('error', '操作失败');
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
        <Skeleton className="mb-3 h-5 w-32" />
        {[1, 2, 3].map((i) => <Skeleton key={i} className="mb-2 h-10 w-full" />)}
      </div>
    );
  }

  const { overdue = [], today = [], upcoming = [] } = data?.data ?? {};
  const hasAny = overdue.length + today.length + upcoming.length > 0;

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-base font-semibold text-[var(--color-text)]">
          需要跟进
          {total > 0 && (
            <span className="ml-2 rounded-full bg-[var(--color-danger)] px-2 py-0.5 text-xs font-bold text-white">
              {total}
            </span>
          )}
        </h2>
      </div>

      {!hasAny ? (
        <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">今天没有待跟进客户 🎉</p>
      ) : (
        <div className="space-y-4">
          <Section title="逾期" leads={overdue as LeadRow[]} overdue onDone={handleDone} />
          <Section title="今天" leads={today as LeadRow[]} onDone={handleDone} />
          <Section title="明天" leads={upcoming as LeadRow[]} onDone={handleDone} />
        </div>
      )}
    </div>
  );
}
