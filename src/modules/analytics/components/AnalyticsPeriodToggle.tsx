'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/Button';
import type { AnalyticsPeriod } from '../types';

type Props = {
  value: AnalyticsPeriod;
};

const options: AnalyticsPeriod[] = ['7d', '30d', '90d'];

export function AnalyticsPeriodToggle({ value }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const t = useTranslations('analytics');

  function setPeriod(next: AnalyticsPeriod) {
    const params = new URLSearchParams(searchParams.toString());
    params.set('period', next);
    router.replace(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <Button
          key={option}
          type="button"
          size="sm"
          variant={value === option ? 'primary' : 'secondary'}
          onClick={() => setPeriod(option)}
        >
          {t(option)}
        </Button>
      ))}
    </div>
  );
}
