'use client';

import * as React from 'react';
import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/Badge';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import type { LeaderDashboardMemberPerformance, TeamTopPerformer } from '../types';

type MetricKey = 'conversions' | 'content' | 'streak';

type Props = {
  members: LeaderDashboardMemberPerformance[];
  initialTopPerformers: TeamTopPerformer[];
};

const metricLabels: Record<MetricKey, string> = {
  conversions: 'topByConversions',
  content: 'topByContent',
  streak: 'topByStreak',
};

function metricValue(member: LeaderDashboardMemberPerformance, metric: MetricKey) {
  if (metric === 'content') return member.content_30d;
  if (metric === 'streak') return member.action_streak;
  return member.conversions_30d;
}

function metricBadge(metric: MetricKey) {
  if (metric === 'content') return 'Content';
  if (metric === 'streak') return 'Streak';
  return 'Conversions';
}

export function TopPerformers({ members, initialTopPerformers }: Props) {
  const t = useTranslations('dashboard');
  const [metric, setMetric] = React.useState<MetricKey>('conversions');

  const sorted = React.useMemo(() => {
    return [...members]
      .sort((a, b) => metricValue(b, metric) - metricValue(a, metric))
      .slice(0, 3)
      .map((member) => ({
        id: member.id,
        name: member.name,
        avatar_url: member.avatar_url,
        value: metricValue(member, metric),
      }));
  }, [members, metric]);

  const data = sorted.length > 0 ? sorted : initialTopPerformers;

  return (
    <section className="space-y-3 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">{t('topPerformers')}</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">{t('topPerformersHelp')}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['conversions', 'content', 'streak'] as MetricKey[]).map((key) => (
            <Button
              key={key}
              variant={metric === key ? 'primary' : 'secondary'}
              size="sm"
              onClick={() => setMetric(key)}
            >
              {t(metricLabels[key])}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {data.map((member, index) => {
          const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
          return (
            <div key={member.id} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Avatar name={member.name} src={member.avatar_url} size="md" />
                  <div>
                    <p className="font-semibold text-[var(--color-text)]">{member.name}</p>
                    <p className="text-sm text-[var(--color-text-muted)]">{metricBadge(metric)}</p>
                  </div>
                </div>
                <span className="text-xl">{medal}</span>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <Badge variant="info">{t(metricLabels[metric])}</Badge>
                <span className="text-2xl font-semibold text-[var(--color-text)]">{member.value}</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
