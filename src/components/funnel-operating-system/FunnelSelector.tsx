'use client';

import { RefreshCw, ShoppingBag, TrendingUp, Users } from 'lucide-react';
import { useLocale } from 'next-intl';
import type { BusinessFunnelType } from '@/modules/funnel/types/funnel-context';
import { cn } from '@/lib/cn';
import { useFunnelPreference } from './useFunnelPreference';

type Locale = 'zh' | 'en' | 'ms';

const FUNNELS: Array<{ id: BusinessFunnelType; icon: typeof ShoppingBag; labels: Record<Locale, string>; description: Record<Locale, string> }> = [
  {
    id: 'retail',
    icon: ShoppingBag,
    labels: { zh: '零售漏斗', en: 'Retail Funnel', ms: 'Funnel Runcit' },
    description: { zh: '从内容到第一位顾客', en: 'Content to first customer', ms: 'Kandungan ke pelanggan pertama' },
  },
  {
    id: 'recruitment',
    icon: Users,
    labels: { zh: '招募漏斗', en: 'Recruitment Funnel', ms: 'Funnel Perekrutan' },
    description: { zh: '从名单到第一位伙伴', en: 'Lead to first member', ms: 'Prospek ke ahli pertama' },
  },
  {
    id: 'upgrade',
    icon: RefreshCw,
    labels: { zh: '升级漏斗', en: 'Customer Upgrade Funnel', ms: 'Funnel Naik Taraf' },
    description: { zh: '从顾客到升级与复制', en: 'Customer to upgrade', ms: 'Pelanggan ke naik taraf' },
  },
];

export function getFunnelLabel(funnelType: BusinessFunnelType, locale: Locale) {
  return FUNNELS.find((item) => item.id === funnelType)?.labels[locale] ?? funnelType;
}

function normalizeLocale(locale: string): Locale {
  if (locale.startsWith('en')) return 'en';
  if (locale.startsWith('ms')) return 'ms';
  return 'zh';
}

export function FunnelSelector({ locale, compact = false }: { locale?: Locale; compact?: boolean }) {
  const currentLocale = useLocale();
  const activeLocale = normalizeLocale(locale ?? currentLocale);
  const { funnelType, setFunnelType } = useFunnelPreference();

  return (
    <div className={cn('rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-3 shadow-sm', compact && 'p-2')}>
      <div className={cn('grid gap-2', compact ? 'md:grid-cols-3' : 'lg:grid-cols-3')}>
        {FUNNELS.map((item) => {
          const Icon = item.icon;
          const active = funnelType === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setFunnelType(item.id)}
              className={cn(
                'flex min-h-14 items-center gap-3 rounded-[var(--radius-md)] border px-3 text-left transition-colors',
                active
                  ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                  : 'border-transparent text-[var(--color-text)] hover:border-[var(--color-border)] hover:bg-[var(--color-surface)]',
              )}
            >
              <span className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-[var(--radius-md)]', active ? 'bg-blue-600 text-white' : 'bg-[var(--color-surface)] text-[var(--color-text-muted)]')}>
                <Icon className="h-4 w-4" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold">{item.labels[activeLocale]}</span>
                {!compact ? <span className="mt-0.5 block text-xs text-[var(--color-text-muted)]">{item.description[activeLocale]}</span> : null}
              </span>
              {active ? <TrendingUp className="ml-auto h-4 w-4 shrink-0" aria-hidden="true" /> : null}
            </button>
          );
        })}
      </div>
    </div>
  );
}
