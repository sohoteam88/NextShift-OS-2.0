'use client';

import Link from 'next/link';
import { AICommandCard } from './AICommandCard';
import type { DashboardPriorityLevel } from './AICommandCard';
import { buildJourneySteps, JourneyProgressCard } from './JourneyProgressCard';
import { MomentumCard } from './MomentumCard';
import { useDashboardMission } from '../hooks/useDashboardMission';
import { revenueDriverHubRouteForMission } from '@/modules/revenue-drivers/constants/revenue-drivers';
import { humanizeEstimatedTime, userFacingCopy } from '../lib/user-facing-copy';

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

export function DashboardHome() {
  const projection = useDashboardMission();
  const data = projection.data;

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
  const hasMomentum = [
    data.value.outcomeMetrics.contentPublished,
    data.value.outcomeMetrics.viewsGenerated,
    data.value.outcomeMetrics.leadsGenerated,
    data.value.outcomeMetrics.appointmentsBooked,
    data.value.outcomeMetrics.customersAcquired,
    data.value.outcomeMetrics.revenueGenerated,
  ].some((value) => value > 0);

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <AICommandCard
        completedItems={data.missionControl.completedItems}
        currentGap={data.missionControl.currentGap}
        todayMission={userFacingCopy(data.missionControl.title)}
        missionDescription={userFacingCopy(data.missionControl.description)}
        steps={data.missionControl.steps}
        currentStep={data.missionControl.currentStep}
        progress={data.missionControl.progress}
        passedChecks={data.missionControl.passedChecks}
        remainingChecks={data.missionControl.remainingChecks}
        nextRequiredCheck={data.missionControl.nextRequiredCheck}
        verificationStatus={data.missionControl.verificationStatus}
        missionReason={userFacingCopy(data.missionControl.whyThis)}
        whyNow={data.missionControl.whyNow}
        decisionReason={data.missionControl.whyNotOthers}
        nextMilestone={data.missionControl.nextMilestone}
        priorityLevel={data.missionControl.priority as DashboardPriorityLevel}
        estimatedTime={humanizeEstimatedTime(data.missionControl.estimatedTime)}
        expectedOutcome={data.missionControl.expectedOutcome}
        firstUserExperience={data.firstUserExperience}
        userSuccess={data.userSuccess}
        executeRoute={executeRoute}
        primaryActionLabel={data.missionControl.ctaLabel}
      />
      <JourneyProgressCard steps={buildJourneySteps(data.progressPath)} />
      {hasMomentum ? (
        <MomentumCard
          metrics={data.value.outcomeMetrics}
          customerHealth={data.customerHealth}
          retention={data.retention}
          expansion={data.expansion}
          referral={data.referral}
          setupHref={executeRoute}
        />
      ) : null}
    </div>
  );
}
