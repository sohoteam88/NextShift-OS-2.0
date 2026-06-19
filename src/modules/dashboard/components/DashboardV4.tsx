'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  BarChart3,
  Brain,
  Check,
  ChevronDown,
  Clock3,
  Lock,
  Sparkles,
  Target,
  Zap,
} from 'lucide-react';
import { useDashboardMission } from '../hooks/useDashboardMission';

const STATUS_LABEL = {
  completed: '已完成',
  current: '当前',
  locked: '未解锁',
} as const;

const VALUE_STAGE_LABEL = {
  not_started: '尚未开始',
  progressing: '推进中',
  first_win: '第一成果',
  growing: '增长中',
  scaling: '放大中',
} as const;

const VALUE_MILESTONE_LABEL = {
  first_content_published: '发布第一篇内容',
  first_100_views: '获得 100 次浏览',
  first_1000_views: '获得 1000 次浏览',
  first_lead: '获得第一位潜在客户',
  first_appointment: '完成第一次预约',
  first_client: '获得第一位客户',
  first_customer: '获得第一位顾客',
  first_sale: '完成第一笔销售',
  first_prospect: '获得第一位潜在伙伴',
  first_recruit: '招募第一位伙伴',
  first_team_member: '建立第一位团队成员',
} as const;

const EXPANSION_STAGE_LABEL = {
  first_win: '第一成果',
  repeatable: '可重复',
  growing: '增长中',
  scaling: '放大中',
  optimizing: '优化中',
} as const;

const SCALE_READINESS_LABEL = {
  not_ready: '尚未准备',
  ready: '可以开始',
  strong: '强信号',
  scale_ready: '适合放大',
} as const;

const REFERRAL_READINESS_LABEL = {
  not_ready: '尚未准备',
  potential: '有潜力',
  ready: '可以邀请',
  advocate: '推荐者',
  champion: '冠军用户',
} as const;

export function DashboardV4() {
  const router = useRouter();
  const [quickAccessOpen, setQuickAccessOpen] = useState(false);
  const projection = useDashboardMission();
  const data = projection.data;

  if (projection.isLoading) {
    return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" /></div>;
  }

  if (!data) {
    return (
      <div className="mx-auto max-w-3xl py-20 text-center">
        <p className="text-sm text-[var(--color-text-muted)]">仪表盘投影暂时无法加载。</p>
      </div>
    );
  }

  const topRecommendation = data.recommendations[0];
  const activationMode = data.activation.shouldHideAdvancedModules;

  return (
    <div className="mx-auto max-w-4xl space-y-5 pb-8">
      <section className="rounded-[var(--radius-lg)] border-2 border-blue-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-600">今日任务</p>
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">{data.currentJourney.title}</p>
            <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">{data.missionControl.title}</h1>
          </div>
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-50">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-2">
            <p className="text-sm font-semibold text-[var(--color-text)]">为什么重要</p>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">{data.missionControl.whyItMatters}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <Clock3 className="h-4 w-4" />
              预计时间
            </div>
            <p className="mt-2 text-2xl font-bold text-blue-800">{data.missionControl.estimatedTime}</p>
          </div>
        </div>

        <div className="mt-5 rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 p-4">
          <p className="text-sm font-semibold text-emerald-800">完成后会得到</p>
          <p className="mt-1 text-sm leading-relaxed text-emerald-700">{data.missionControl.expectedOutcome}</p>
        </div>

        <button
          onClick={() => router.push(data.missionControl.route)}
          className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-6 text-sm font-semibold text-white shadow-sm hover:bg-blue-700 sm:w-auto"
        >
          {data.missionControl.ctaLabel} <ArrowRight className="h-4 w-4" />
        </button>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">激活进度</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Activation Score</p>
            <p className="mt-2 text-2xl font-bold text-blue-950">{data.activation.activationScore}%</p>
            <p className="mt-1 text-xs text-blue-800">目标 {data.activation.activationThreshold}%</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">First Win</p>
            <p className="mt-2 text-2xl font-bold text-emerald-950">{data.activation.firstWin.progressPercent}%</p>
            <p className="mt-1 text-xs text-emerald-800">
              {data.activation.firstWin.achieved
                ? `${data.activation.firstWin.timeToFirstWinMinutes} 分钟完成`
                : `目标 ${data.activation.firstWin.targetMinutes} 分钟内生成第一篇内容`}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">当前步骤</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-950">{data.activation.currentStep.label}</p>
            <p className="mt-1 text-xs text-amber-800">风险：{data.activation.activationRisk}</p>
          </div>
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-6">
          {data.activation.steps.map((step) => (
            <div
              key={step.id}
              className={[
                'min-h-16 rounded-[var(--radius-md)] border px-3 py-2',
                step.status === 'completed' ? 'border-emerald-200 bg-emerald-50' : '',
                step.status === 'current' ? 'border-blue-300 bg-white shadow-sm' : '',
                step.status === 'locked' ? 'border-gray-200 bg-gray-50' : '',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs font-semibold text-[var(--color-text)]">{step.label}</p>
                {step.status === 'completed' ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                {step.status === 'locked' ? <Lock className="h-4 w-4 text-gray-400" /> : null}
                {step.status === 'current' ? <Sparkles className="h-4 w-4 text-blue-600" /> : null}
              </div>
              <p className="mt-1 text-[11px] text-[var(--color-text-muted)]">{STATUS_LABEL[step.status]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-emerald-100 bg-emerald-50 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">留存状态</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Retention Score</p>
            <p className="mt-2 text-2xl font-bold text-emerald-950">{data.retention.retentionScore}%</p>
            <p className="mt-1 text-xs text-emerald-800">{data.retention.retentionState}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">当前连续</p>
            <p className="mt-2 text-2xl font-bold text-blue-950">{data.retention.currentStreak} 天</p>
            <p className="mt-1 text-xs text-blue-800">{data.retention.daysInactive} 天未活跃</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">当前动能</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-950">{data.retention.currentMomentum}</p>
          </div>
        </div>
        <div className="mt-4 rounded-[var(--radius-md)] bg-white p-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-[var(--color-text)]">最近成果</p>
            <p className="text-xs font-semibold text-[var(--color-text-muted)]">Momentum {data.retention.momentumScore}%</p>
          </div>
          <div className="mt-3 grid gap-2 md:grid-cols-3">
            {data.retention.momentum.recentWins.length > 0 ? data.retention.momentum.recentWins.slice(0, 3).map((win) => (
              <div key={`${win.type}-${win.occurredAt}`} className="rounded-[var(--radius-md)] border border-emerald-100 bg-emerald-50 px-3 py-2">
                <p className="text-sm font-medium text-emerald-950">{win.title}</p>
                <p className="mt-1 text-xs text-emerald-700">{win.type}</p>
              </div>
            )) : (
              <p className="text-sm text-[var(--color-text-muted)]">暂无最近成果，完成一个小任务即可恢复动能。</p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-violet-100 bg-violet-50 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-violet-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">价值实现</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-violet-700">价值分</p>
            <p className="mt-2 text-2xl font-bold text-violet-950">{data.value.valueRealizationScore}%</p>
            <p className="mt-1 text-xs text-violet-800">{VALUE_STAGE_LABEL[data.value.currentValueStage]}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">最近成果</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-950">
              {data.value.latestWin ? VALUE_MILESTONE_LABEL[data.value.latestWin.id] : '等待第一个业务结果'}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">下个里程碑</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-950">
              {data.value.nextMilestone ? VALUE_MILESTONE_LABEL[data.value.nextMilestone.id] : '扩大已验证结果'}
            </p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: '线索', value: data.value.outcomeMetrics.leadsGenerated },
            { label: '预约', value: data.value.outcomeMetrics.appointmentsBooked },
            { label: '客户', value: data.value.outcomeMetrics.customersAcquired },
            { label: '收入', value: `RM ${data.value.outcomeMetrics.revenueGenerated}` },
            { label: '团队', value: data.value.outcomeMetrics.teamMembersRecruited },
          ].map((item) => (
            <div key={item.label} className="rounded-[var(--radius-md)] bg-white px-3 py-2">
              <p className="text-xs text-[var(--color-text-muted)]">{item.label}</p>
              <p className="mt-1 text-base font-bold text-[var(--color-text)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-cyan-100 bg-cyan-50 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-cyan-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">扩展增长</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">当前杠杆</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-cyan-950">{data.expansion.currentGrowthLever.title}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">扩展机会</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-950">
              {data.expansion.expansionOpportunities[0]?.title ?? '等待更多增长信号'}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Scale Readiness</p>
            <p className="mt-2 text-2xl font-bold text-blue-950">{data.expansion.scaleReadiness.score}%</p>
            <p className="mt-1 text-xs text-blue-800">{SCALE_READINESS_LABEL[data.expansion.scaleReadiness.status]}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">下个增长里程碑</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-950">{data.expansion.nextGrowthMilestone.target}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-5">
          {[
            { label: '线索增长', value: `${data.expansion.kpis.leadGrowthRate}%` },
            { label: '客户增长', value: `${data.expansion.kpis.customerGrowthRate}%` },
            { label: '收入增长', value: `${data.expansion.kpis.revenueGrowthRate}%` },
            { label: '团队增长', value: `${data.expansion.kpis.teamGrowthRate}%` },
            { label: '扩展阶段', value: EXPANSION_STAGE_LABEL[data.expansion.expansionStage] },
          ].map((item) => (
            <div key={item.label} className="rounded-[var(--radius-md)] bg-white px-3 py-2">
              <p className="text-xs text-[var(--color-text-muted)]">{item.label}</p>
              <p className="mt-1 text-base font-bold text-[var(--color-text)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-rose-100 bg-rose-50 p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-rose-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">转介绍飞轮</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-rose-700">Referral Readiness</p>
            <p className="mt-2 text-2xl font-bold text-rose-950">{data.referral.referralScore}%</p>
            <p className="mt-1 text-xs text-rose-800">{REFERRAL_READINESS_LABEL[data.referral.referralReadiness]}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">推荐机会</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-950">
              {data.referral.referralOpportunities[0]?.title ?? '等待推荐机会'}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">Referral Progress</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-blue-950">
              {data.referral.signals.referralInvitesUsed}/{Math.max(data.referral.signals.referralInvitesCreated, 1)} 已转化
            </p>
            <p className="mt-1 text-xs text-blue-800">近期成果 {data.referral.signals.recentWins}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-white p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">下个推荐里程碑</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-950">{data.referral.nextReferralMilestone.target}</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3">
          {[
            { label: '推荐率', value: `${data.referral.kpis.referralRate}%` },
            { label: '推荐转化率', value: `${data.referral.kpis.referralConversionRate}%` },
            { label: '推荐者率', value: `${data.referral.kpis.advocateRate}%` },
          ].map((item) => (
            <div key={item.label} className="rounded-[var(--radius-md)] bg-white px-3 py-2">
              <p className="text-xs text-[var(--color-text-muted)]">{item.label}</p>
              <p className="mt-1 text-base font-bold text-[var(--color-text)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">成长路径</h2>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {data.progressPath.map((item) => (
            <div
              key={item.id}
              className={[
                'min-h-24 rounded-[var(--radius-md)] border p-3',
                item.status === 'completed' ? 'border-emerald-200 bg-emerald-50' : '',
                item.status === 'current' ? 'border-blue-300 bg-blue-50 shadow-sm' : '',
                item.status === 'locked' ? 'border-gray-200 bg-gray-50' : '',
              ].join(' ')}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-[var(--color-text-muted)]">步骤 {item.step}</span>
                {item.status === 'completed' ? <Check className="h-4 w-4 text-emerald-600" /> : null}
                {item.status === 'locked' ? <Lock className="h-4 w-4 text-gray-400" /> : null}
                {item.status === 'current' ? <Sparkles className="h-4 w-4 text-blue-600" /> : null}
              </div>
              <p className="mt-3 text-sm font-semibold text-[var(--color-text)]">{item.label}</p>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{STATUS_LABEL[item.status]}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-[var(--radius-lg)] border border-amber-100 bg-amber-50 p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <Brain className="h-5 w-5 text-amber-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">AI COO 决策</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">{data.aiDecision.currentFocus}</p>
            <h3 className="mt-2 text-lg font-bold text-[var(--color-text)]">{data.aiDecision.nextBestAction.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {data.aiDecision.decisionReason}
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {data.aiDecision.primaryRisk ? (
                <div className="rounded-[var(--radius-md)] bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-red-700">主要风险</p>
                  <p className="mt-1 text-sm font-medium text-red-950">{data.aiDecision.primaryRisk.title}</p>
                </div>
              ) : null}
              {data.aiDecision.primaryOpportunity ? (
                <div className="rounded-[var(--radius-md)] bg-white/70 p-3">
                  <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">主要机会</p>
                  <p className="mt-1 text-sm font-medium text-emerald-950">{data.aiDecision.primaryOpportunity.title}</p>
                </div>
              ) : null}
            </div>
          </div>
          {data.aiDecision.nextBestAction.route ? (
            <button
              type="button"
              onClick={() => router.push(data.aiDecision.nextBestAction.route!)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-amber-600 px-5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              执行 <ArrowRight className="h-4 w-4" />
            </button>
          ) : topRecommendation?.route ? (
            <button
              type="button"
              onClick={() => router.push(topRecommendation.route!)}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-amber-600 px-5 text-sm font-semibold text-white hover:bg-amber-700"
            >
              执行 <ArrowRight className="h-4 w-4" />
            </button>
          ) : null}
        </div>
      </section>

      {!activationMode ? <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-3 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">业务快照</h2>
        </div>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          {[
            { label: '准备度', value: `${data.snapshot.readiness}%` },
            { label: '进度', value: `${data.snapshot.progress}%` },
            { label: '成长分', value: `${data.snapshot.growth}%` },
            { label: '线索', value: String(data.snapshot.leads) },
          ].map((item) => (
            <div key={item.label} className="rounded-[var(--radius-md)] bg-gray-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">{item.label}</p>
              <p className="mt-2 text-2xl font-bold text-[var(--color-text)]">{item.value}</p>
            </div>
          ))}
        </div>
      </section> : null}

      {!activationMode ? <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-emerald-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">增长循环</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">增长分</p>
            <p className="mt-2 text-2xl font-bold text-emerald-950">{data.growthProjection.growthScore}%</p>
            <p className="mt-1 text-xs text-emerald-800">{data.growthProjection.currentGrowthStage}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-red-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-red-700">当前瓶颈</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-red-950">
              {data.growthProjection.primaryBottleneck?.title ?? '没有明显瓶颈'}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">建议动作</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-blue-950">
              {data.growthProjection.recommendedGrowthAction.title}
            </p>
          </div>
        </div>
      </section> : null}

      {!activationMode ? <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">系统优化</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">优化分</p>
            <p className="mt-2 text-2xl font-bold text-blue-950">{data.optimization.optimizationScore}%</p>
            <p className="mt-1 text-xs text-blue-800">{data.optimization.currentOptimizationFocus}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">Top Win</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-emerald-950">
              {data.optimization.topWinningPatterns[0]?.title ?? '等待更多结果'}
            </p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">建议改进</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-amber-950">
              {data.optimization.recommendedSystemChanges[0]?.title ?? '继续收集执行结果'}
            </p>
          </div>
        </div>
      </section> : null}

      {!activationMode ? <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">业务记忆</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-[var(--radius-md)] bg-blue-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">当前焦点</p>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-blue-950">{data.businessMemory.currentFocus}</p>
          </div>
          <div className="rounded-[var(--radius-md)] bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-700">最近成果</p>
            <div className="mt-2 space-y-2">
              {data.businessMemory.recentWins.length > 0 ? data.businessMemory.recentWins.map((win) => (
                <p key={win} className="flex gap-2 text-sm text-emerald-900">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                  <span>{win}</span>
                </p>
              )) : <p className="text-sm text-emerald-900">暂无完成记录</p>}
            </div>
          </div>
          <div className="rounded-[var(--radius-md)] bg-amber-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-700">阻塞点</p>
            <div className="mt-2 space-y-2">
              {data.businessMemory.blockedAreas.length > 0 ? data.businessMemory.blockedAreas.slice(0, 3).map((area) => (
                <p key={area} className="text-sm font-medium text-amber-950">{area}</p>
              )) : <p className="text-sm text-amber-900">没有明显阻塞</p>}
            </div>
          </div>
        </div>
      </section> : null}

      {!activationMode ? <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">执行队列</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">{data.executions.automationLevel}</p>
            <h3 className="mt-2 text-base font-bold text-[var(--color-text)]">
              {data.executions.currentExecution?.title ?? '暂无执行动作'}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {data.executions.currentExecution?.reason ?? 'AI COO 会在安全时自动准备下一步动作。'}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="rounded-[var(--radius-md)] bg-gray-50 p-3">
              <p className="text-lg font-bold text-[var(--color-text)]">{data.executions.pendingApprovals.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">待批准</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-gray-50 p-3">
              <p className="text-lg font-bold text-[var(--color-text)]">{data.executions.queuedExecutions.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">队列中</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-gray-50 p-3">
              <p className="text-lg font-bold text-[var(--color-text)]">{data.executions.completedExecutions.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">已完成</p>
            </div>
          </div>
        </div>
      </section> : null}

      {!activationMode ? <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <Brain className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">AI 工作队</h2>
        </div>
        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-blue-700">
              {data.workforce.activeAgents.length} 个 Agent 可用
            </p>
            <h3 className="mt-2 text-base font-bold text-[var(--color-text)]">
              {data.workforce.currentAssignments[0]?.agentType ?? '暂无分配'}
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-[var(--color-text-muted)]">
              {data.workforce.currentAssignments[0]?.reason ?? '执行动作会自动分配给专门 Agent。'}
            </p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-center">
            <div className="rounded-[var(--radius-md)] bg-gray-50 p-3">
              <p className="text-lg font-bold text-[var(--color-text)]">{data.workforce.currentAssignments.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">当前分配</p>
            </div>
            <div className="rounded-[var(--radius-md)] bg-gray-50 p-3">
              <p className="text-lg font-bold text-[var(--color-text)]">{data.workforce.completedAgentTasks.length}</p>
              <p className="text-xs text-[var(--color-text-muted)]">已完成</p>
            </div>
          </div>
        </div>
      </section> : null}

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setQuickAccessOpen((value) => !value)}
          className="flex w-full items-center justify-between gap-3 p-5 text-left"
        >
          <div>
            <h2 className="text-base font-semibold text-[var(--color-text)]">快速入口</h2>
          </div>
          <ChevronDown className={`h-5 w-5 text-[var(--color-text-muted)] transition-transform ${quickAccessOpen ? 'rotate-180' : ''}`} />
        </button>
        {quickAccessOpen ? (
          <div className="grid gap-2 border-t border-[var(--color-border)] p-5 sm:grid-cols-2 lg:grid-cols-5">
            {data.quickAccess.map((item) => (
              <button
                key={item.route}
                type="button"
                disabled={!item.unlocked}
                onClick={() => router.push(item.route)}
                className="flex min-h-16 items-center justify-between gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-left text-sm font-medium enabled:hover:bg-[var(--color-surface)] disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-400"
              >
                {item.label}
                {item.unlocked ? <ArrowRight className="h-4 w-4" /> : <Lock className="h-4 w-4" />}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
        <div className="grid gap-2 break-all text-xs text-[var(--color-text-muted)] md:grid-cols-2">
          <p>Business: {data.versions.businessStateVersion}</p>
          <p>Journey: {data.versions.journeyVersion}</p>
          <p>COO: {data.versions.cooPlanVersion}</p>
          <p>Growth: {data.versions.growthLoopVersion}</p>
        </div>
      </section>
    </div>
  );
}
