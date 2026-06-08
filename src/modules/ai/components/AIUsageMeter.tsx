'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/cn';
import { HelpTooltip } from '@/components/ui/HelpTooltip';

type Props = {
  used: number;
  limit: number;
  costUsd: number;
};

export function AIUsageMeter({ used, limit, costUsd }: Props) {
  const t = useTranslations('ai');
  const percent = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 100;
  const tone =
    percent >= 80 ? 'bg-red-500' : percent >= 60 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-2 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <p className="text-sm font-medium text-[var(--color-text)]">
            {t('usageCount', { used, limit, percent })}
          </p>
          <HelpTooltip text={t('usageHelp')} />
        </div>
        <p className="text-xs text-[var(--color-text-muted)]">
          {t('monthlyCost', { cost: costUsd.toFixed(2) })}
        </p>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-[var(--color-surface)]">
        <div className={cn('h-full rounded-full transition-all', tone)} style={{ width: `${percent}%` }} />
      </div>
      {percent >= 100 ? (
        <p className="text-xs font-medium text-red-600">{t('quotaBlocked')}</p>
      ) : percent >= 80 ? (
        <p className="text-xs font-medium text-amber-600">{t('quotaWarning')}</p>
      ) : null}
    </div>
  );
}
