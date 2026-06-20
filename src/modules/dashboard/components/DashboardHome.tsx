'use client';

import Link from 'next/link';
import { AICommandCard } from './AICommandCard';
import type { DashboardPriorityLevel } from './AICommandCard';
import { buildJourneySteps, JourneyProgressCard } from './JourneyProgressCard';
import { MomentumCard } from './MomentumCard';
import { useDashboardMission } from '../hooks/useDashboardMission';

function routeOrFallback(route?: string) {
  return route && route.length > 0 ? route : '/journey';
}

function DashboardHomeSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <div className="h-[360px] animate-pulse rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
        <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
      </div>
    </div>
  );
}

function MissionEngineFailure({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-5xl pb-8">
      <section className="rounded-[var(--radius-lg)] border border-red-200 bg-white p-6 shadow-sm">
        <div className="max-w-2xl">
          <p className="text-xs font-semibold uppercase text-red-700">Mission Engine Failure</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">AI COO is temporarily unavailable.</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            We could not determine the next best action. You can continue manually using the Journey page.
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/journey"
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            Open Journey
          </Link>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
          >
            Retry
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

  const currentGap = data.missionEngine.bottleneck;
  const executeRoute = routeOrFallback(data.aiCommandCenter.route);
  const completedItems = data.progressPath
    .filter((step) => step.status === 'completed')
    .map((step) => step.label)
    .slice(-3);

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <AICommandCard
        completedItems={completedItems}
        currentGap={currentGap}
        todayMission={data.aiCommandCenter.missionTitle}
        missionReason={data.aiCommandCenter.missionDescription}
        decisionReason={data.aiCommandCenter.reasoning}
        priorityLevel={data.aiCommandCenter.priority as DashboardPriorityLevel}
        estimatedTime={data.aiCommandCenter.estimatedTime}
        expectedOutcome={data.aiCommandCenter.expectedOutcome}
        executeRoute={executeRoute}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <JourneyProgressCard steps={buildJourneySteps(data.progressPath)} />
        <MomentumCard metrics={data.value.outcomeMetrics} setupHref={executeRoute} />
      </div>
    </div>
  );
}
