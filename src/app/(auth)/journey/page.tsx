'use client';

import * as React from 'react';
import { Award, Map as MapIcon, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/Skeleton';
import { JourneyMapView } from '@/modules/mission/components/JourneyMapView';
import { ModeToggle } from '@/modules/mission/components/ModeToggle';
import { useAchievements, useJourneyMap, useMissionState } from '@/modules/mission/hooks/use-mission';
import { cn } from '@/lib/cn';

type Tab = 'map' | 'achievements';

type AchievementDef = {
  key: string;
  title: string;
  description: string;
  icon: string;
  xp: number;
};

type UnlockedAchievement = {
  key: string;
  title: string;
  description: string;
  icon: string;
  xpAwarded: number;
  unlockedAt: string;
};

function formatDate(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${date.getMonth() + 1}/${date.getDate()}`;
}

function AchievementsTab({ totalXP }: { totalXP: number }) {
  const achievements = useAchievements();
  const unlocked = (achievements.data as { data?: { unlocked?: UnlockedAchievement[]; all?: AchievementDef[] } } | undefined)?.data?.unlocked ?? [];
  const all = (achievements.data as { data?: { unlocked?: UnlockedAchievement[]; all?: AchievementDef[] } } | undefined)?.data?.all ?? [];
  const unlockedByKey = new globalThis.Map(unlocked.map((item) => [item.key, item]));

  if (achievements.isLoading) {
    return <Skeleton className="h-80 w-full rounded-[var(--radius-lg)]" />;
  }

  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-[var(--color-text)]">我的成就</h2>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">已解锁 {unlocked.length}/{all.length}</p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-sm font-semibold text-amber-700">
          <Trophy className="h-4 w-4" aria-hidden="true" />
          {totalXP} XP
        </div>
      </div>

      <div className="space-y-3">
        {all.map((def) => {
          const unlockedItem = unlockedByKey.get(def.key);
          return (
            <div
              key={def.key}
              className={cn(
                'rounded-[var(--radius-md)] border p-4',
                unlockedItem ? 'border-amber-200 bg-amber-50' : 'border-[var(--color-border)] bg-[var(--color-surface)] opacity-75',
              )}
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-[var(--color-text)]">
                  {unlockedItem ? '🏆' : '🔒'} {def.title}
                </p>
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">
                  {unlockedItem ? `已解锁 · ${formatDate(unlockedItem.unlockedAt)}` : '未解锁'}
                </span>
              </div>
              <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                {def.description} · +{def.xp} XP
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default function JourneyPage() {
  const [tab, setTab] = React.useState<Tab>('map');
  const mission = useMissionState();
  const journey = useJourneyMap();
  const state = mission.data?.data;
  const stages = journey.data?.data;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">你的旅程地图</h1>
          <p className="mt-1 text-sm text-[var(--color-text-muted)]">看清楚现在的位置、已完成的阶段，以及下一步。</p>
        </div>
        {state ? <ModeToggle mode={state.mode} compact /> : null}
      </div>

      <div className="inline-flex rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-1 shadow-sm">
        {[
          { id: 'map' as const, label: '旅程地图', icon: MapIcon },
          { id: 'achievements' as const, label: '成就', icon: Award },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={cn(
                'inline-flex h-9 items-center gap-2 rounded-[var(--radius-sm)] px-3 text-sm font-semibold transition-colors',
                tab === item.id ? 'bg-blue-600 text-white' : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)]',
              )}
            >
              <Icon className="h-4 w-4" aria-hidden="true" />
              {item.label}
            </button>
          );
        })}
      </div>

      {mission.isLoading || journey.isLoading ? (
        <Skeleton className="h-96 w-full rounded-[var(--radius-lg)]" />
      ) : tab === 'map' && state && stages ? (
        <JourneyMapView stages={stages} progressPercent={state.progressPercent} totalXP={state.totalXP} />
      ) : state ? (
        <AchievementsTab totalXP={state.totalXP} />
      ) : (
        <div className="rounded-[var(--radius-lg)] border border-red-200 bg-red-50 p-5 text-sm text-red-700">
          无法读取旅程资料，请稍后再试。
        </div>
      )}
    </div>
  );
}
