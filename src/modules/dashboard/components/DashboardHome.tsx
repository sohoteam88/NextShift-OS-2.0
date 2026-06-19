'use client';

import { AICommandCard } from './AICommandCard';
import { buildJourneySteps, JourneyProgressCard } from './JourneyProgressCard';
import { MomentumCard } from './MomentumCard';
import { buildWorkforceSummary, WorkforceCard } from './WorkforceCard';
import { RecentWinsCard } from './RecentWinsCard';
import { useDashboardMission } from '../hooks/useDashboardMission';

function routeOrFallback(route?: string) {
  return route && route.length > 0 ? route : '/journey';
}

export function DashboardHome() {
  const projection = useDashboardMission();
  const data = projection.data;

  if (projection.isLoading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">AI COO 暂时无法加载你的下一步。</p>
      </div>
    );
  }

  const bottleneck = data.aiDecision.primaryRisk?.title
    ?? data.growthProjection.primaryBottleneck?.title
    ?? '当前没有明显阻塞点';
  const executeRoute = routeOrFallback(data.aiDecision.nextBestAction.route ?? data.missionControl.route);
  const missionRoute = routeOrFallback(data.missionControl.route);
  const recentWins = [
    ...data.retention.momentum.recentWins.map((win) => win.title),
    ...(data.value.latestWin ? [data.value.latestWin.label] : []),
    ...data.executions.completedExecutions.map((execution) => execution.title),
    ...data.workforce.completedAgentTasks.map((task) => task.executionSummary),
  ].filter(Boolean).slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <AICommandCard
        currentStage={data.currentJourney.title}
        bottleneck={bottleneck}
        missionTitle={data.missionControl.title}
        missionReason={data.missionControl.whyItMatters}
        estimatedTime={data.missionControl.estimatedTime}
        expectedOutcome={data.missionControl.expectedOutcome}
        executeRoute={executeRoute}
        decisionTitle={data.aiDecision.nextBestAction.title}
        decisionReason={data.aiDecision.nextBestAction.reason}
        successMetric={data.aiDecision.nextBestAction.successMetric}
      />
      <JourneyProgressCard steps={buildJourneySteps(data.progressPath)} />
      <MomentumCard metrics={data.value.outcomeMetrics} />
      <WorkforceCard agents={buildWorkforceSummary(data.workforce)} />
      <RecentWinsCard wins={recentWins} missionRoute={missionRoute} />
    </div>
  );
}
