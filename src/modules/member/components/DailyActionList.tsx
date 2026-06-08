'use client';

import Link from 'next/link';
import { CheckCircle2, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Spinner } from '@/components/ui/Spinner';
import { cn } from '@/lib/cn';
import type { DailyActionItem } from '../types';

type DailyActionListProps = {
  actions: DailyActionItem[];
  loadingIndex?: number | null;
  onToggle: (index: number) => void;
};

const categoryVariant: Record<string, 'success' | 'info' | 'warning'> = {
  learn: 'success',
  content: 'info',
  crm: 'warning',
};

const ACTION_LINKS: Record<string, string> = {
  'learn.ai_coach': '/ai/coach',
  'content.education_post': '/ai',
  'content.story_post': '/ai',
  'content.authority_post': '/ai',
  'crm.follow_up': '/crm',
  'crm.whatsapp_reply': '/crm',
};

export function DailyActionList({ actions, loadingIndex, onToggle }: DailyActionListProps) {
  const t = useTranslations('member');

  return (
    <div className="space-y-2">
      {actions.map((action, index) => {
        const busy = loadingIndex === index;
        return (
          <button
            key={action.id}
            type="button"
            onClick={() => onToggle(index)}
            disabled={busy}
            className={cn(
              'group flex w-full items-start gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-left transition-all',
              'hover:-translate-y-[1px] hover:shadow-sm disabled:cursor-not-allowed disabled:opacity-70',
              action.completed && 'border-emerald-200 bg-emerald-50/70',
            )}
          >
            <span
              className={cn(
                'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors',
                action.completed
                  ? 'border-emerald-500 bg-emerald-500 text-white'
                  : 'border-[var(--color-border)] bg-white text-transparent group-hover:border-[var(--color-primary)]',
              )}
            >
              {busy ? (
                <Spinner size="sm" className="text-[var(--color-primary)]" />
              ) : (
                <CheckCircle2 className={cn('h-4 w-4', action.completed ? 'opacity-100' : 'opacity-0')} />
              )}
            </span>

            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className={cn('text-sm font-medium text-[var(--color-text)]', action.completed && 'line-through opacity-70')}>
                  {action.description}
                </p>
                <Badge variant={categoryVariant[action.category] ?? 'default'}>{t(`actionCategory.${action.category}`)}</Badge>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">
                {action.type}
                {action.completedAt ? ` · ${t('completedAt')} ${new Date(action.completedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}` : ''}
              </p>
            </div>

            {ACTION_LINKS[action.type] && (
              <Link
                href={ACTION_LINKS[action.type]}
                onClick={(e) => e.stopPropagation()}
                className="ml-2 shrink-0 inline-flex items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)] hover:border-[var(--color-primary)] hover:text-[var(--color-primary)]"
              >
                打开 <ExternalLink className="h-3 w-3" />
              </Link>
            )}
          </button>
        );
      })}
    </div>
  );
}
