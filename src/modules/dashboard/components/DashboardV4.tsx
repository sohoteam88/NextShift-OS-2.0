'use client';

import { useRouter } from 'next/navigation';
import { ArrowRight, Bot, Check, Clock3, Flag, Sparkles, Target, Zap } from 'lucide-react';
import { useDashboardMission } from '../hooks/useDashboardMission';

const STATUS_LABEL = {
  completed: '已完成',
  current: '当前',
  locked: '未解锁',
} as const;

const JOURNEY_LABELS = [
  '品牌基础',
  '品牌定位',
  '内容系统',
  '引流磁铁',
  '漏斗',
  '潜在客户',
  '销售',
  '团队',
];

function statusClass(status: 'completed' | 'current' | 'locked') {
  if (status === 'completed') return 'border-emerald-200 bg-emerald-50 text-emerald-800';
  if (status === 'current') return 'border-blue-300 bg-blue-50 text-blue-800 shadow-sm';
  return 'border-gray-200 bg-gray-50 text-gray-500';
}

function routeOrFallback(route?: string) {
  return route && route.length > 0 ? route : '/journey';
}

export function DashboardV4() {
  const router = useRouter();
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
  const momentum = data.value.outcomeMetrics;
  const journeySteps = JOURNEY_LABELS.map((label, index) => ({
    label,
    status: data.progressPath[index]?.status ?? 'locked',
  }));
  const assignments = data.workforce.currentAssignments.slice(0, 3);
  const activeAgents = assignments.length > 0
    ? assignments
    : data.workforce.activeAgents.slice(0, 3).map((agent) => ({
      assignmentId: agent.agentType,
      agentType: agent.agentType,
      status: agent.availability === 'available' ? 'assigned' : 'approval_required',
      action: { title: '等待 AI COO 分配任务' },
      reason: agent.capabilities[0] ?? '可接收下一步执行任务',
    }));
  const recentWins = [
    ...data.retention.momentum.recentWins.map((win) => win.title),
    ...(data.value.latestWin ? [data.value.latestWin.label] : []),
    ...data.executions.completedExecutions.map((execution) => execution.title),
    ...data.workforce.completedAgentTasks.map((task) => task.executionSummary),
  ].filter(Boolean).slice(0, 6);

  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-8">
      <section className="min-h-[420px] rounded-[var(--radius-lg)] border border-blue-200 bg-white p-6 shadow-sm md:p-8">
        <div className="grid h-full gap-6 md:grid-cols-[1.35fr_0.65fr] md:items-stretch">
          <div className="flex flex-col justify-between gap-8">
            <div>
              <div className="mb-5 inline-flex items-center gap-2 rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
                <Bot className="h-4 w-4" />
                AI COO Command Center
              </div>
              <p className="text-sm font-semibold text-[var(--color-text-muted)]">当前阶段</p>
              <h1 className="mt-2 text-3xl font-bold text-[var(--color-text)] md:text-4xl">{data.currentJourney.title}</h1>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[var(--radius-md)] border border-red-100 bg-red-50 p-4">
                  <p className="text-xs font-semibold uppercase text-red-700">当前瓶颈</p>
                  <p className="mt-2 text-base font-semibold text-red-950">{bottleneck}</p>
                </div>
                <div className="rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4">
                  <p className="text-xs font-semibold uppercase text-emerald-700">预期结果</p>
                  <p className="mt-2 text-base font-semibold text-emerald-950">{data.missionControl.expectedOutcome}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--color-text-muted)]">今天要做</p>
              <h2 className="mt-2 text-2xl font-bold text-[var(--color-text)]">{data.missionControl.title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[var(--color-text-muted)]">{data.missionControl.whyItMatters}</p>
              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  type="button"
                  onClick={() => router.push(executeRoute)}
                  className="inline-flex h-12 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700"
                >
                  执行下一步 <ArrowRight className="h-4 w-4" />
                </button>
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--color-text-muted)]">
                  <Clock3 className="h-4 w-4" />
                  {data.missionControl.estimatedTime}
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
            <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">AI 判断</p>
            <h3 className="mt-3 text-lg font-bold text-[var(--color-text)]">{data.aiDecision.nextBestAction.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">{data.aiDecision.nextBestAction.reason}</p>
            <div className="mt-5 rounded-[var(--radius-md)] bg-white p-4">
              <p className="text-xs font-semibold uppercase text-[var(--color-text-muted)]">成功标准</p>
              <p className="mt-2 text-sm font-semibold text-[var(--color-text)]">{data.aiDecision.nextBestAction.successMetric}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Flag className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">成长旅程</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {journeySteps.map((step, index) => (
            <div key={step.label} className={`min-h-24 rounded-[var(--radius-md)] border p-3 ${statusClass(step.status)}`}>
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold">步骤 {index + 1}</span>
                {step.status === 'completed' ? <Check className="h-4 w-4" /> : null}
                {step.status === 'current' ? <Sparkles className="h-4 w-4" /> : null}
              </div>
              <p className="mt-3 text-sm font-semibold">{step.label}</p>
              <p className="mt-1 text-xs">{STATUS_LABEL[step.status]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">业务动能</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: '已发布内容', value: momentum.contentPublished },
            { label: '潜在客户', value: momentum.leadsGenerated },
            { label: '预约', value: momentum.appointmentsBooked },
            { label: '客户', value: momentum.customersAcquired },
            { label: '收入', value: `RM ${momentum.revenueGenerated}` },
          ].map((item) => (
            <div key={item.label} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs text-[var(--color-text-muted)]">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-blue-600" />
            <h2 className="text-base font-semibold text-[var(--color-text)]">AI 工作队</h2>
          </div>
          <button
            type="button"
            onClick={() => router.push('/ai-workforce')}
            className="text-sm font-semibold text-blue-600 hover:text-blue-700"
          >
            打开工作队
          </button>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {activeAgents.map((agent) => (
            <div key={agent.assignmentId} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs font-semibold uppercase text-blue-700">{agent.status}</p>
              <h3 className="mt-2 text-sm font-bold text-[var(--color-text)]">{agent.agentType.replace(/_/g, ' ')}</h3>
              <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{agent.action.title}</p>
            </div>
          ))}
          {activeAgents.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)]">AI COO 会在你执行下一步后分配对应 Agent。</p>
          ) : null}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">最近成果</h2>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          {recentWins.length > 0 ? recentWins.map((win) => (
            <div key={win} className="flex gap-3 rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
              <p className="text-sm font-medium text-emerald-950">{win}</p>
            </div>
          )) : (
            <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-sm text-[var(--color-text-muted)]">完成今天的任务后，成果会出现在这里。</p>
              <button
                type="button"
                onClick={() => router.push(missionRoute)}
                className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:text-blue-700"
              >
                去执行任务 <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
