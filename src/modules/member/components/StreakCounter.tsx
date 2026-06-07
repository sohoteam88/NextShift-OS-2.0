'use client';

import { Flame } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { HelpTooltip } from '@/components/ui/HelpTooltip';

type StreakCounterProps = {
  streak: number;
  className?: string;
};

export function StreakCounter({ streak, className }: StreakCounterProps) {
  const t = useTranslations('member');

  return (
    <div className={className}>
      <div className="inline-flex items-center gap-2 rounded-[var(--radius-md)] border border-orange-200 bg-orange-50 px-3 py-2 text-sm font-medium text-orange-700">
        <Flame className="h-4 w-4" />
        <span>
          {t('streak')}: {streak} {t('days')}
        </span>
        <HelpTooltip text={t('streakHelp')} className="text-orange-600 hover:text-orange-800" />
      </div>
    </div>
  );
}
