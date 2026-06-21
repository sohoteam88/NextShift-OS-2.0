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
  FUNNEL: '双漏斗落地页',
  LEAD_GENERATION: '获客',
  SALES_CONVERSION: '销售转化',
  SALES: '销售转化',
  TEAM_BUILDING: '团队复制',
  NO_BRAND: 'AI 访谈还没完成',
  NO_POSITIONING: 'Brand DNA 还没确认',
  NO_CONTENT: '还没有稳定内容',
  NO_LEAD_MAGNET: '还没有引流资源',
  NO_FUNNEL: '还没有漏斗落地页',
  NO_TRAFFIC: '还没有流量测试',
  NO_LEADS: '还没有潜在客户进入漏斗',
  NO_APPOINTMENTS: 'Leads 尚未跟进',
  NO_CUSTOMERS: '有成交机会尚未完成',
  NO_SALES: '还没有第一笔成交',
  NO_TEAM: '还没有团队复制系统',
  Traffic: '流量',
  'Traffic Source Active': '流量来源尚未启动',
  'First Lead Generated': '还没有产生第一位潜在客户',
  'AI Interview Completed': 'AI 访谈',
  'Brand DNA Confirmed': 'Brand DNA',
};

function humanLabel(value: string) {
  const label =
    LABELS[value] ??
    value
      .replaceAll('_', ' ')
      .toLowerCase()
      .replace(/^\w/, (char) => char.toUpperCase());
  return label.replace(/引流磁铁/g, '引流资源');
}

function hasInternalReason(value: string) {
  return /Business State|Missing:|Success criteria|Current gap|capability|_[A-Z]+|resolved/i.test(
    value,
  );
}

function missionReasonFor(
  rawReason: string,
  currentGap: string,
  completedItems: string[],
) {
  if (!hasInternalReason(rawReason)) return rawReason;
  if (currentGap === 'NO_BRAND') {
    return '我还没有足够的业务访谈资料，无法可靠判断你的受众、Offer、内容角度和漏斗方向。先完成 AI 访谈，后面的 Brand DNA、内容和双漏斗才会对准。';
  }
  if (currentGap === 'NO_POSITIONING') {
    return 'AI 访谈已经给出方向，但 Brand DNA 还没有确认。先确认定位、受众、Offer、信任证明和 CTA，AI COO 才能生成正确的第一任务。';
  }
  if (currentGap === 'NO_LEADS') {
    const completed =
      completedItems.length > 0
        ? `你已经完成了 ${completedItems.join('、')}。`
        : '你的基础系统正在建立。';
    return `${completed} 现在最大的缺口是还没有潜在客户进入漏斗，所以最有杠杆的动作是启动流量或把领取入口推给真实受众。`;
  }
  if (currentGap === 'NO_CONTENT')
    return '你的品牌基础正在成形，但还缺少稳定内容。先发布内容，潜在客户才有机会发现你的服务。';
  if (currentGap === 'NO_LEAD_MAGNET')
    return '内容方向已经开始成形，但还缺少一个让陌生受众愿意留下联系方式的引流资源。先生成它，后面的落地页和流量测试才有入口。';
  if (currentGap === 'NO_FUNNEL')
    return '你已经有内容计划和引流资源，但还没有可以承接真实访问的落地页。先生成零售客户漏斗和招募伙伴漏斗，后面的流量测试才有地方转化。';
  if (currentGap === 'NO_TRAFFIC')
    return '漏斗已经可以承接线索，下一步要用小流量测试验证信息、CTA 和跟进路径，而不是继续堆功能。';
  if (currentGap === 'NO_APPOINTMENTS')
    return '你已经开始有 Leads，最大的风险是没有及时联系、没有记录状态、没有安排下一次跟进。现在最有杠杆的动作是处理新 Leads。';
  if (currentGap === 'NO_CUSTOMERS')
    return '你已经有潜在客户或成交机会，下一步不是继续堆流量，而是把最接近购买的人推进到预约、方案、付款或明确不适合。';
  if (currentGap === 'NO_SALES')
    return '你已经开始有潜在客户，下一步要把跟进推进到第一次成交。';
  if (currentGap === 'NO_TEAM')
    return '你的核心系统已经进入可复制阶段。现在要把有效的内容、引流、漏斗、CRM 和 Sales 动作整理成 AI agent 与团队成员可以重复执行的工作流。';
  return '我根据你当前完成的系统和缺口，选择了最能推动下一步结果的任务。';
}

function decisionReasonFor(rawReason: string, currentGap: string) {
  if (!hasInternalReason(rawReason)) return rawReason;
  if (currentGap === 'NO_BRAND')
    return '现在不应该先做内容、引流资源或漏斗，因为 AI 还不知道你是谁、卖给谁、为什么别人要相信你。';
  if (currentGap === 'NO_POSITIONING')
    return '现在不应该跳去内容或漏斗，因为没有确认 Brand DNA 时，系统生成出来的文案和页面很容易偏离真实业务。';
  if (currentGap === 'NO_LEADS')
    return '现在先不优先做团队、报表或复杂自动化，因为没有潜在客户之前，这些动作不会直接带来第一位真实客户。';
  if (currentGap === 'NO_FUNNEL')
    return '现在不应该先启动流量测试，因为没有落地页时，流量来了也没有清楚的领取入口、感谢页或 WhatsApp 跟进路径。';
  if (currentGap === 'NO_APPOINTMENTS')
    return '现在不应该继续加流量或做复杂报表，因为现有 Leads 还没有进入可追踪的跟进节奏。';
  if (currentGap === 'NO_CUSTOMERS')
    return '现在不应该先做团队、报表或新的漏斗，因为成交机会需要及时跟进，拖太久会变冷。';
  if (currentGap === 'NO_TEAM')
    return '现在不应该继续只靠创办人手动执行，因为已经验证过的动作需要被记录、委派和复制。';
  return '我会先处理最影响进展的缺口，再安排其他优化动作。';
}

function outcomeLabel(value: string) {
  if (value === 'Business profile available for mission analysis.')
    return 'AI COO 可以判断第一项增长任务';
  if (value === 'Generate Your First Lead' || value === 'First Lead Generated')
    return '产生第一位潜在客户';
  if (value === 'First Revenue Generated') return '完成第一笔成交';
  return humanLabel(value);
}

function primaryActionLabel(route: string, currentGap: string) {
  if (currentGap === 'NO_BRAND') return '开始 AI 访谈';
  if (
    currentGap === 'NO_POSITIONING' ||
    route.includes('/brand-builder/step/profile')
  )
    return '确认 Brand DNA';
  if (route.includes('/content')) return '打开内容引擎';
  if (route.includes('/lead-magnet')) return '生成引流资源';
  if (route.includes('/funnel')) return '生成双漏斗落地页';
  if (route.includes('/traffic')) return '启动流量测试';
  if (route.includes('/sales')) return '进入 Sales 跟进';
  if (route.includes('/ai-workforce') || route.includes('/team'))
    return '启动 Team / Workforce';
  if (route.includes('/crm') || route.includes('/customer'))
    return '处理 Leads';
  return '开始任务';
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
          <p className="text-xs font-semibold text-red-700">
            Mission Engine Failure
          </p>
          <h1 className="mt-2 text-2xl font-bold text-[var(--color-text)]">
            AI COO 暂时不可用。
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-muted)]">
            我们无法判断你的下一步最佳行动。你可以先进入 Journey
            页面继续手动完成任务。
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
  const missionReason = missionReasonFor(
    data.aiCommandCenter.missionDescription,
    currentGap,
    completedItems,
  );
  const decisionReason = decisionReasonFor(
    data.aiCommandCenter.reasoning,
    currentGap,
  );

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
        primaryActionLabel={primaryActionLabel(executeRoute, currentGap)}
      />
      <div className="grid gap-5 lg:grid-cols-2">
        <JourneyProgressCard steps={buildJourneySteps(data.progressPath)} />
        <MomentumCard
          metrics={data.value.outcomeMetrics}
          setupHref={executeRoute}
        />
      </div>
    </div>
  );
}
