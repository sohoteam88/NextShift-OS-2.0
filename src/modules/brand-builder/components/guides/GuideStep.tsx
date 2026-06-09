'use client';

import * as React from 'react';
import { CheckCircle2, Copy, ExternalLink } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';

export type GuideStepAction = {
  type: 'copy' | 'external_link';
  value: string;
  label?: string;
};

export type GuideStepData = {
  title: string;
  instruction: string;
  tip?: string;
  image?: string;
  action?: GuideStepAction;
};

type Props = GuideStepData & {
  stepNumber: number;
  totalSteps: number;
  completed: boolean;
  onComplete: () => void;
};

export function GuideStep({
  stepNumber,
  totalSteps,
  title,
  instruction,
  tip,
  image,
  action,
  completed,
  onComplete,
}: Props) {
  const t = useTranslations('brandBuilder');
  const [copied, setCopied] = React.useState(false);

  async function handleCopy(text: string) {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
      <div className="flex items-center gap-3 border-b border-[var(--color-border)] px-5 py-3">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-primary)] text-xs font-bold text-white">
          {stepNumber}
        </span>
        <p className="flex-1 text-sm font-semibold text-[var(--color-text)]">{title}</p>
        <span className="text-xs text-[var(--color-text-muted)]">
          {t('stepOf', { current: stepNumber, total: totalSteps })}
        </span>
      </div>

      <div className="space-y-4 p-5">
        <p className="text-sm leading-relaxed text-[var(--color-text)]">{instruction}</p>

        {image && (
          <div className="flex h-36 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface)]">
            <p className="text-xs text-[var(--color-text-muted)]">示意图</p>
          </div>
        )}

        {action && (
          <div>
            {action.type === 'copy' && (
              <button
                type="button"
                onClick={() => void handleCopy(action.value)}
                className={cn(
                  'inline-flex items-center gap-2 rounded-[var(--radius-md)] border px-4 py-2 text-sm font-medium transition-colors',
                  copied
                    ? 'border-green-300 bg-green-50 text-green-700'
                    : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface)]',
                )}
              >
                <Copy className="h-4 w-4" />
                {copied ? t('copied') : (action.label ?? t('copy'))}
              </button>
            )}
            {action.type === 'copy' && action.value && (
              <div className="mt-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-xs text-[var(--color-text)]">
                {action.value}
              </div>
            )}
            {action.type === 'external_link' && (
              <a
                href={action.value}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-2 text-sm font-medium text-[var(--color-text)] hover:bg-[var(--color-surface)]"
              >
                <ExternalLink className="h-4 w-4" />
                {action.label ?? t('openLink')}
              </a>
            )}
          </div>
        )}

        {tip && (
          <div className="flex gap-2 rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 px-3 py-2.5">
            <span className="mt-0.5 text-sm">💡</span>
            <div>
              <p className="text-xs font-semibold text-amber-800">{t('tip')}</p>
              <p className="mt-0.5 text-xs text-amber-700">{tip}</p>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onComplete}
          className={cn(
            'flex w-full items-center gap-2 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-medium transition-colors',
            completed
              ? 'border-green-300 bg-green-50 text-green-700'
              : 'border-[var(--color-border)] bg-white text-[var(--color-text)] hover:bg-[var(--color-surface)]',
          )}
        >
          <CheckCircle2
            className={cn('h-5 w-5', completed ? 'text-green-600' : 'text-[var(--color-text-muted)]')}
          />
          {completed ? t('completed') : t('markComplete')}
        </button>
      </div>
    </div>
  );
}
