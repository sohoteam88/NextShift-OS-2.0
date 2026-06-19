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

function confidenceLabel(confidence: 'low' | 'medium' | 'high') {
  if (confidence === 'high') return '92%';
  if (confidence === 'medium') return '78%';
  return '58%';
}

function DashboardHomeSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <div className="h-[360px] animate-pulse rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50" />
      <div className="grid gap-5 lg:grid-cols-2">
        <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
        <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
        <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
        <div className="h-80 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
      </div>
    </div>
  );
}

export function DashboardHome() {
  const projection = useDashboardMission();
  const data = projection.data;

  if (projection.isLoading) {
    return <DashboardHomeSkeleton />;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-5xl pb-8">
        <AICommandCard
          currentStage="Brand Foundation"
          currentBottleneck="品牌访谈尚未完成"
          todayMission="Complete AI Interview"
          missionReason="完成访谈后，AI COO 才能判断你的下一步业务任务。"
          estimatedTime="10 分钟"
          expectedOutcome="品牌基础完成"
          confidenceLevel="92%"
          executeRoute="/brand-builder/step/interview"
        />
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
        currentBottleneck={bottleneck}
        todayMission={data.missionControl.title}
        missionReason={data.missionControl.whyItMatters}
        estimatedTime={data.missionControl.estimatedTime}
        expectedOutcome={data.missionControl.expectedOutcome}
        confidenceLevel={confidenceLabel(data.aiDecision.confidence)}
        executeRoute={executeRoute}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <JourneyProgressCard steps={buildJourneySteps(data.progressPath)} />
        <MomentumCard metrics={data.value.outcomeMetrics} />
        <WorkforceCard agents={buildWorkforceSummary(data.workforce)} />
        <RecentWinsCard wins={recentWins} missionRoute={missionRoute} />
      </div>
    </div>
  );
}
