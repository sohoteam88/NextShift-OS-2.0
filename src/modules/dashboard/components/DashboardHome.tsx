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

const LABELS: Record<string, string> = {
  BRAND_FOUNDATION: '品牌基础',
  BRAND_POSITIONING: '品牌定位',
  CONTENT_SYSTEM: '内容系统',
  LEAD_MAGNET: '引流资源',
  FUNNEL: '漏斗页面',
  LEAD_GENERATION: '获客',
  SALES_CONVERSION: '销售转化',
  NO_BRAND: '品牌资料还不完整',
  NO_CONTENT: '还没有稳定内容',
  NO_LEADS: '还没有潜在客户进入漏斗',
  NO_SALES: '还没有第一笔成交',
  Traffic: '流量',
  'Traffic Source Active': '流量来源尚未启动',
  'First Lead Generated': '还没有产生第一位潜在客户',
};

function humanLabel(value: string) {
  const label = LABELS[value] ?? value.replaceAll('_', ' ').toLowerCase().replace(/^\w/, (char) => char.toUpperCase());
  return label.replace(/引流磁铁/g, '引流资源');
}

function hasInternalReason(value: string) {
  return /Business State|Missing:|Success criteria|Current gap|capability|_[A-Z]+|resolved/i.test(value);
}

function missionReasonFor(rawReason: string, currentGap: string, completedItems: string[]) {
  if (!hasInternalReason(rawReason)) return rawReason;
  if (currentGap === 'NO_LEADS') {
    const completed = completedItems.length > 0 ? `你已经完成了 ${completedItems.join('、')}。` : '你的基础系统正在建立。';
    return `${completed} 现在最大的缺口是还没有潜在客户进入漏斗，所以最有杠杆的动作是启动流量或把领取入口推给真实受众。`;
  }
  if (currentGap === 'NO_CONTENT') return '你的品牌基础正在成形，但还缺少稳定内容。先发布内容，潜在客户才有机会发现你的服务。';
  if (currentGap === 'NO_SALES') return '你已经开始有潜在客户，下一步要把跟进推进到第一次成交。';
  return '我根据你当前完成的系统和缺口，选择了最能推动下一步结果的任务。';
}

function decisionReasonFor(rawReason: string, currentGap: string) {
  if (!hasInternalReason(rawReason)) return rawReason;
  if (currentGap === 'NO_LEADS') return '现在先不优先做团队、报表或复杂自动化，因为没有潜在客户之前，这些动作不会直接带来第一位真实客户。';
  return '我会先处理最影响进展的缺口，再安排其他优化动作。';
}

function outcomeLabel(value: string) {
  if (value === 'Generate Your First Lead' || value === 'First Lead Generated') return '产生第一位潜在客户';
  if (value === 'First Revenue Generated') return '完成第一笔成交';
  return humanLabel(value);
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
          <p className="text-xs font-semibold text-red-700">任务引擎暂时不可用</p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">AI COO 暂时无法判断下一步。</h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            系统暂时无法确定最佳行动。你可以先从 Journey 页面继续手动执行。
          </p>
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <Link
            href="/journey"
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] bg-blue-600 px-5 text-sm font-semibold text-white hover:bg-blue-700"
          >
            打开 Journey
          </Link>
          <button
            type="button"
            onClick={onRetry}
            className="inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-5 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
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

  const currentGap = data.missionEngine.bottleneck;
  const executeRoute = routeOrFallback(data.aiCommandCenter.route);
  const completedItems = data.progressPath
    .filter((step) => step.status === 'completed')
    .map((step) => humanLabel(step.label))
    .slice(-3);
  const missionReason = missionReasonFor(data.aiCommandCenter.missionDescription, currentGap, completedItems);
  const decisionReason = decisionReasonFor(data.aiCommandCenter.reasoning, currentGap);

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <AICommandCard
        completedItems={completedItems}
        currentGap={humanLabel(currentGap)}
        todayMission={humanLabel(data.aiCommandCenter.missionTitle)}
        missionReason={missionReason}
        decisionReason={decisionReason}
        priorityLevel={data.aiCommandCenter.priority as DashboardPriorityLevel}
        estimatedTime={data.aiCommandCenter.estimatedTime}
        expectedOutcome={outcomeLabel(data.aiCommandCenter.expectedOutcome)}
        executeRoute={executeRoute}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <JourneyProgressCard steps={buildJourneySteps(data.progressPath)} />
        <MomentumCard metrics={data.value.outcomeMetrics} setupHref={executeRoute} />
      </div>
    </div>
  );
}
