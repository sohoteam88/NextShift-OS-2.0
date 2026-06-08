'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Button } from '@/components/ui/Button';
import type { LeaderDashboardWeeklyTrend } from '../types';

type Props = {
  weeklyTrend: LeaderDashboardWeeklyTrend;
};

type SeriesKey = 'leads' | 'conversions' | 'content';

const colors: Record<SeriesKey, string> = {
  leads: '#2563eb',
  conversions: '#10b981',
  content: '#f59e0b',
};

export function WeeklyTrendChart({ weeklyTrend }: Props) {
  const t = useTranslations('dashboard');
  const [visible, setVisible] = React.useState<Record<SeriesKey, boolean>>({
    leads: true,
    conversions: true,
    content: true,
  });

  const data = React.useMemo(() => {
    const weekMap = new Map<string, { week: string; leads: number; conversions: number; content: number }>();
    for (const point of weeklyTrend.leads) {
      weekMap.set(point.week, { week: point.week, leads: point.count, conversions: 0, content: 0 });
    }
    for (const point of weeklyTrend.conversions) {
      const current = weekMap.get(point.week) ?? { week: point.week, leads: 0, conversions: 0, content: 0 };
      current.conversions = point.count;
      weekMap.set(point.week, current);
    }
    for (const point of weeklyTrend.content) {
      const current = weekMap.get(point.week) ?? { week: point.week, leads: 0, conversions: 0, content: 0 };
      current.content = point.count;
      weekMap.set(point.week, current);
    }
    return [...weekMap.values()].sort((a, b) => a.week.localeCompare(b.week));
  }, [weeklyTrend]);

  return (
    <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('weeklyTrend')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('weeklyTrendHelp')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['leads', 'conversions', 'content'] as SeriesKey[]).map((key) => (
            <Button
              key={key}
              variant={visible[key] ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setVisible((current) => ({ ...current, [key]: !current[key] }))}
            >
              {t(key === 'leads' ? 'leadsSeries' : key === 'conversions' ? 'conversionsSeries' : 'contentSeries')}
            </Button>
          ))}
        </div>
      </div>

      <div className="h-[240px] sm:h-[320px]">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis dataKey="week" tickFormatter={(value) => value.slice(5)} tick={{ fontSize: 11 }} minTickGap={16} />
            <YAxis allowDecimals={false} tick={{ fontSize: 11 }} width={36} />
            <Tooltip />
            <Legend />
            {visible.leads && <Line type="monotone" dataKey="leads" stroke={colors.leads} strokeWidth={2} dot={false} />}
            {visible.conversions && <Line type="monotone" dataKey="conversions" stroke={colors.conversions} strokeWidth={2} dot={false} />}
            {visible.content && <Line type="monotone" dataKey="content" stroke={colors.content} strokeWidth={2} dot={false} />}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
