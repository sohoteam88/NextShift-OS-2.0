'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { AICommandCard } from './AICommandCard';
import type { DashboardPriorityLevel } from './AICommandCard';
import { buildJourneySteps, JourneyProgressCard } from './JourneyProgressCard';
import { MomentumCard } from './MomentumCard';
import { TodayRecommendationCard } from './TodayRecommendationCard';
import { useDashboardMission } from '../hooks/useDashboardMission';
import { revenueDriverHubRouteForMission } from '@/modules/revenue-drivers/constants/revenue-drivers';
import { fetchTelemetryUserId, trackWeeklyActive } from '@/lib/telemetry/tracker';

function routeOrFallback(route?: string) {
  return route && route.length > 0 ? route : '/journey';
}

function DashboardHomeSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <div className="h-96 animate-pulse rounded-lg border border-border bg-surface" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-lg border border-border bg-white" />
        <div className="h-80 animate-pulse rounded-lg border border-border bg-white" />
      </div>
    </div>
  );
}

function MissionEngineFailure({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-5xl pb-8">
      <section className="rounded-lg border border-border bg-white p-6 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold text-foreground">
            Next step unavailable
          </p>
          <h1 className="mt-2 text-2xl font-bold text-foreground">
            暂时无法生成你的下一步。
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted">
            我们无法判断你的下一步最佳行动。你可以先进入 Journey
            页面继续手动完成任务。
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/journey"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-5 text-sm font-semibold text-white hover:bg-primary/90"
          >
            打开 Journey
          </Link>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center rounded-md border border-border bg-white px-5 text-sm font-semibold text-foreground hover:bg-surface"
          >
            重试
          </button>
        </div>
      </section>
    </div>
  );
}

function weeklyActiveStorageKey(userId: string, now = new Date()) {
  const weekStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const day = weekStart.getUTCDay() || 7;
  weekStart.setUTCDate(weekStart.getUTCDate() - day + 1);
  return `nextshift:weekly-active:${userId}:${weekStart.toISOString().slice(0, 10)}`;
}

export function DashboardHome() {
  const projection = useDashboardMission();
  const telemetryUser = useQuery({
    queryKey: ['telemetry-user-id'],
    queryFn: fetchTelemetryUserId,
    staleTime: 5 * 60_000,
    retry: false,
  });
  const data = projection.data;

  useEffect(() => {
    const userId = telemetryUser.data;
    if (!userId) return;

    try {
      const key = weeklyActiveStorageKey(userId);
      if (window.localStorage.getItem(key)) return;
      trackWeeklyActive(userId, {});
      window.localStorage.setItem(key, 'true');
    } catch {
      // Telemetry should never block dashboard rendering.
    }
  }, [telemetryUser.data]);

  if (projection.isLoading) {
    return <DashboardHomeSkeleton />;
  }

  if (projection.isError || !data) {
    return <MissionEngineFailure onRetry={() => void projection.refetch()} />;
  }

  const executeRoute = revenueDriverHubRouteForMission({
    route: data.missionControl.route,
    missionType: data.missionControl.missionType,
  }) ?? routeOrFallback(data.missionControl.route);

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <TodayRecommendationCard />
      <AICommandCard
        completedItems={data.missionControl.completedItems}
        currentGap={data.missionControl.currentGap}
        todayMission={data.missionControl.title}
        missionDescription={data.missionControl.description}
        steps={data.missionControl.steps}
        currentStep={data.missionControl.currentStep}
        progress={data.missionControl.progress}
        passedChecks={data.missionControl.passedChecks}
        remainingChecks={data.missionControl.remainingChecks}
        nextRequiredCheck={data.missionControl.nextRequiredCheck}
        verificationStatus={data.missionControl.verificationStatus}
        missionReason={data.missionControl.whyThis}
        whyNow={data.missionControl.whyNow}
        decisionReason={data.missionControl.whyNotOthers}
        nextMilestone={data.missionControl.nextMilestone}
        priorityLevel={data.missionControl.priority as DashboardPriorityLevel}
        estimatedTime={data.missionControl.estimatedTime}
        expectedOutcome={data.missionControl.expectedOutcome}
        firstUserExperience={data.firstUserExperience}
        userSuccess={data.userSuccess}
        executeRoute={executeRoute}
        primaryActionLabel={data.missionControl.ctaLabel}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <JourneyProgressCard steps={buildJourneySteps(data.progressPath)} />
        <MomentumCard
          metrics={data.value.outcomeMetrics}
          customerHealth={data.customerHealth}
          retention={data.retention}
          expansion={data.expansion}
          referral={data.referral}
          setupHref={executeRoute}
        />
      </div>
    </div>
  );
}
