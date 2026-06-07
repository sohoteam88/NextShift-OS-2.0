'use client';

import { useLocale, useTranslations } from 'next-intl';
import type { DailyActionDay } from '../types';
import { cn } from '@/lib/cn';

type WeeklyDotsProps = {
  days: DailyActionDay[];
};

export function WeeklyDots({ days }: WeeklyDotsProps) {
  const locale = useLocale();
  const t = useTranslations('member');
  const formatter = new Intl.DateTimeFormat(locale, { weekday: 'short' });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-[var(--color-text)]">{t('weeklyProgress')}</h3>
        <p className="text-xs text-[var(--color-text-muted)]">{t('dotLegend')}</p>
      </div>
      <div className="grid grid-cols-7 gap-2">
        {days.map((day) => {
          const date = new Date(day.date);
          return (
            <div key={day.date} className="flex flex-col items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-2 py-3">
              <span className="text-[11px] font-medium text-[var(--color-text-muted)]">{formatter.format(date)}</span>
              <span
                className={cn(
                  'flex h-4 w-4 items-center justify-center rounded-full text-[10px] leading-none',
                  day.allCompleted
                    ? 'bg-emerald-500 text-white'
                    : day.hasData
                      ? 'border border-amber-500 bg-amber-50 text-amber-700'
                      : 'border border-dashed border-[var(--color-border)] bg-[var(--color-surface)] text-[var(--color-text-muted)]',
                )}
              >
                {day.allCompleted ? '●' : day.hasData ? '○' : '·'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
