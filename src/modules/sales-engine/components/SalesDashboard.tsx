'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  Clock3,
  DollarSign,
  MessageCircle,
  PhoneCall,
  ShieldCheck,
  Sparkles,
  Target,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LeadScoreBadge } from '@/modules/crm/components/LeadScoreBadge';
import { WhatsAppButton } from '@/modules/crm/components/WhatsAppButton';
import { type LeadRow, useLeads, useUpdateLead } from '@/modules/crm/hooks/use-leads';
import { useSetFollowup } from '@/modules/crm/hooks/use-followup';
import { STAGE_LABELS, STAGE_PROBABILITIES, type PipelineStage } from '@/modules/crm/types';
import { useToast } from '@/stores/toast-store';

const SALES_READY_STAGES = new Set([
  'appointment_scheduled',
  'appointment_completed',
  'offer_presented',
  'negotiation',
  'proposal_sent',
  'proposal_viewed',
  'closing',
  '已预约',
  '已完成通话',
  '已提案',
  '谈判中',
]);

const STAGE_PRIORITY: Record<string, number> = {
  negotiation: 5,
  '谈判中': 5,
  offer_presented: 4,
  proposal_viewed: 4,
  '已提案': 4,
  appointment_completed: 3,
  proposal_sent: 3,
  '已完成通话': 3,
  appointment_scheduled: 2,
  '已预约': 2,
  qualified: 1,
  '已筛选': 1,
};

const FALLBACK_STAGE_LABELS: Record<string, string> = {
  new: '新潜在客户',
  proposal_sent: '已发方案',
  proposal_viewed: '已查看方案',
  closing: '准备成交',
  won: '已成交',
  converted: '已转化',
  已转化: '已转化',
};

function stageLabel(stage: string) {
  return STAGE_LABELS[stage as PipelineStage] ?? FALLBACK_STAGE_LABELS[stage] ?? stage;
}

function isSalesOpportunity(lead: LeadRow) {
  return lead.score >= 70 || SALES_READY_STAGES.has(lead.pipelineStage);
}

function stageProbability(stage: string, score: number) {
  if (stage in STAGE_PROBABILITIES) return Math.round(STAGE_PROBABILITIES[stage as PipelineStage] * 100);
  if (stage === 'proposal_viewed' || stage === 'offer_presented' || stage === '已提案') return 55;
  if (stage === 'closing' || stage === 'negotiation' || stage === '谈判中') return 70;
  return score >= 70 ? 45 : 20;
}

function isDueNow(lead: LeadRow) {
  if (!lead.nextFollowup) return false;
  return new Date(lead.nextFollowup).getTime() <= Date.now();
}

function nextActionFor(lead: LeadRow) {
  const stage = lead.pipelineStage;
  if (stage === 'negotiation' || stage === '谈判中' || stage === 'closing') {
    return '处理最后一个顾虑，确认付款或开始时间。';
  }
  if (stage === 'offer_presented' || stage === 'proposal_viewed' || stage === '已提案') {
    return '询问方案哪里还不清楚，把对话推进到决定。';
  }
  if (stage === 'appointment_completed' || stage === 'proposal_sent' || stage === '已完成通话') {
    return '发送咨询总结，连接痛点、方案和下一步。';
  }
  if (stage === 'appointment_scheduled' || stage === '已预约') {
    return '确认预约，并提前收集最影响成交的问题。';
  }
  if (lead.score >= 70) return '先做资格确认，再邀请进入咨询或购买决定。';
  return '补齐需求、预算、时间线和决策人。';
}

function salesMessageFor(lead: LeadRow) {
  return `Hi ${lead.name}，我刚整理了你之前留下的资料。想确认一下：你现在最想先解决的是哪一块？我可以根据你的情况给你一个清楚的下一步，不会硬推。`;
}

function tomorrowMorning() {
  const date = new Date();
  date.setDate(date.getDate() + 1);
  date.setHours(10, 0, 0, 0);
  return date;
}

function rm(value: number) {
  return `RM ${value.toLocaleString('en-MY')}`;
}

function Metric({
  label,
  value,
  helper,
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <p className="text-2xl font-semibold text-[var(--color-text)]">{value}</p>
      <p className="mt-1 text-sm font-semibold text-[var(--color-text)]">{label}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{helper}</p>
    </div>
  );
}

function ConditionRow({
  ready,
  label,
  detail,
}: {
  ready: boolean;
  label: string;
  detail: string;
}) {
  return (
    <div className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3">
      {ready ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      )}
      <div>
        <p className="text-sm font-semibold text-[var(--color-text)]">{label}</p>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{detail}</p>
      </div>
    </div>
  );
}

function SalesQueueCard({
  lead,
  onMarkWon,
  onSetFollowup,
  markingWon,
  settingFollowup,
}: {
  lead: LeadRow;
  onMarkWon: (lead: LeadRow) => void;
  onSetFollowup: (lead: LeadRow) => void;
  markingWon: boolean;
  settingFollowup: boolean;
}) {
  const probability = stageProbability(lead.pipelineStage, lead.score);
  const due = isDueNow(lead);

  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--color-text)]">{lead.name}</h3>
            <LeadScoreBadge score={lead.score} />
            {due && (
              <span className="inline-flex items-center gap-1 rounded-[var(--radius-full)] bg-red-50 px-2.5 py-0.5 text-xs font-medium text-red-700">
                <Clock3 className="h-3 w-3" />
                现在跟进
              </span>
            )}
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {stageLabel(lead.pipelineStage)} · {lead.source || '未知来源'} · 成交概率 {probability}%
          </p>
        </div>
        <Link
          href={`/crm/${lead.id}`}
          className="inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-3 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]"
        >
          打开详情
          <ChevronRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-4 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">
          COO 建议下一步
        </p>
        <p className="mt-1 text-sm leading-6 text-[var(--color-text)]">{nextActionFor(lead)}</p>
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-3">
        <WhatsAppButton
          leadId={lead.id}
          phone={lead.phone}
          leadName={lead.name}
          message={salesMessageFor(lead)}
          size="md"
          className="w-full"
        />
        <Button
          type="button"
          variant="secondary"
          loading={settingFollowup}
          onClick={() => onSetFollowup(lead)}
          icon={<CalendarClock className="h-4 w-4" />}
          className="w-full"
        >
          明早跟进
        </Button>
        <Button
          type="button"
          loading={markingWon}
          onClick={() => onMarkWon(lead)}
          icon={<DollarSign className="h-4 w-4" />}
          className="w-full"
        >
          标记成交
        </Button>
      </div>
    </article>
  );
}

export function SalesDashboard() {
  const leadsQuery = useLeads({ page: 1, limit: 80, sort_by: 'score', sort_order: 'desc' });
  const updateLead = useUpdateLead();
  const setFollowup = useSetFollowup();
  const { toast } = useToast();

  const leads = leadsQuery.data?.data ?? [];
  const salesQueue = useMemo(
    () =>
      leads
        .filter(isSalesOpportunity)
        .sort((a, b) => {
          const stageDiff = (STAGE_PRIORITY[b.pipelineStage] ?? 0) - (STAGE_PRIORITY[a.pipelineStage] ?? 0);
          if (stageDiff !== 0) return stageDiff;
          return b.score - a.score;
        })
        .slice(0, 8),
    [leads],
  );

  const hotLeads = leads.filter((lead) => lead.score >= 70);
  const proposalReady = salesQueue.filter((lead) =>
    ['appointment_completed', 'offer_presented', 'negotiation', 'proposal_sent', 'proposal_viewed', 'closing', '已完成通话', '已提案', '谈判中'].includes(
      lead.pipelineStage,
    ),
  );
  const dueNow = salesQueue.filter(isDueNow);
  const estimatedPipeline = salesQueue.reduce(
    (sum, lead) => sum + 500 * (stageProbability(lead.pipelineStage, lead.score) / 100),
    0,
  );

  async function handleMarkWon(lead: LeadRow) {
    try {
      await updateLead.mutateAsync({ id: lead.id, data: { pipelineStage: 'won' } });
      toast('success', `${lead.name} 已标记为成交`);
    } catch {
      toast('error', '标记成交失败');
    }
  }

  async function handleSetFollowup(lead: LeadRow) {
    try {
      await setFollowup.mutateAsync({ leadId: lead.id, date: tomorrowMorning() });
      toast('success', `${lead.name} 已设为明早跟进`);
    } catch {
      toast('error', '设置跟进失败');
    }
  }

  const hasLeads = leads.length > 0;
  const hasOpportunities = salesQueue.length > 0;

  if (leadsQuery.isLoading) {
    return (
      <div className="mx-auto max-w-6xl space-y-4 pb-12">
        <div className="h-56 animate-pulse rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50" />
        <div className="grid gap-4 md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-28 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
          ))}
        </div>
        <div className="h-72 animate-pulse rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white" />
      </div>
    );
  }

  if (leadsQuery.isError) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <section className="rounded-[var(--radius-lg)] border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-red-700">Sales Engine Error</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Sales 跟进暂时无法加载。</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            我们无法读取 CRM Leads。你可以先回 CRM 查看客户，或重试此页面。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/crm" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
              打开 CRM
            </Link>
            <Button type="button" variant="secondary" onClick={() => void leadsQuery.refetch()}>
              重试
            </Button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-12">
      <section className="rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI COO Mission
            </p>
            <h1 className="mt-4 text-2xl font-semibold tracking-normal text-[var(--color-text)] md:text-3xl">
              进入 Sales 跟进
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text)]">
              我判断你现在已经不是缺流量或缺 Leads，而是有成交机会需要被推进。今天的重点是把高意向客户带到一个清楚决定：预约、付款、开始，或明确不适合。
            </p>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="font-semibold text-[var(--color-text)]">为什么是这个？</p>
                <p className="mt-1 leading-5 text-[var(--color-text-muted)]">有高分 Leads 或已提案阶段，继续加流量会放大漏接风险。</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="font-semibold text-[var(--color-text)]">为什么是现在？</p>
                <p className="mt-1 leading-5 text-[var(--color-text-muted)]">成交窗口会随时间变冷，今天要完成第一轮明确跟进。</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="font-semibold text-[var(--color-text)]">为什么不是别的？</p>
                <p className="mt-1 leading-5 text-[var(--color-text-muted)]">内容、漏斗和流量已经服务于成交，Sales 是当前最高杠杆动作。</p>
              </div>
            </div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-blue-100 bg-white p-4 lg:w-72">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Recommended Next Action</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">
              {hasOpportunities ? '处理今日 Sales 队列' : hasLeads ? '先筛选高意向 Leads' : '先产生 Leads'}
            </p>
            <Link
              href={hasOpportunities ? '#sales-queue' : hasLeads ? '/crm' : '/traffic-engine'}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              {hasOpportunities ? '开始跟进' : hasLeads ? '回到 CRM 筛选' : '启动流量测试'}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      <div className="grid gap-3 md:grid-cols-4">
        <Metric label="成交机会" value={salesQueue.length} helper="Hot lead 或进入预约、提案、谈判阶段。" />
        <Metric label="高意向 Leads" value={hotLeads.length} helper="分数 70 以上，需要优先联系。" />
        <Metric label="需今天跟进" value={dueNow.length} helper="已有跟进日期到期或逾期。" />
        <Metric label="加权管道" value={rm(Math.round(estimatedPipeline))} helper="按默认 RM500 订单和阶段概率估算。" />
      </div>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Sales Conditions</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">进入 Sales 前需要满足什么？</h2>
          </div>
          <ConditionRow
            ready={hasLeads}
            label="已有可跟进 Leads"
            detail={hasLeads ? `${leads.length} 位 Leads 已进入 CRM。` : '还没有 Leads 时，Sales 页不会制造假成交机会。'}
          />
          <ConditionRow
            ready={hasOpportunities}
            label="已有成交机会信号"
            detail={hasOpportunities ? '至少一位 Lead 已达到 Hot、预约、提案或谈判状态。' : '需要先从 CRM 中筛选或跟进 Leads，让他们进入预约、提案或谈判。'}
          />
          <ConditionRow
            ready={proposalReady.length > 0}
            label="已有方案或下一步理由"
            detail={proposalReady.length > 0 ? '可以开始处理顾虑、确认付款或安排开始时间。' : '如果还没有完成通话或方案，先用 WhatsApp 做资格确认。'}
          />
          <ConditionRow
            ready={dueNow.length > 0 || hasOpportunities}
            label="今天有明确动作"
            detail="每个成交机会必须有下一句要说、下一次跟进时间，或一个成交/失去结果。"
          />
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Closing Playbook</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">今天只跑一个成交节奏</h2>
          <div className="mt-4 space-y-3">
            {[
              { icon: ShieldCheck, label: 'Trust', text: '先确认对方情况，说明你是根据他留下的资料跟进。' },
              { icon: Target, label: 'Pain', text: '问清楚最想解决的问题、为什么现在重要、之前卡在哪里。' },
              { icon: Sparkles, label: 'Future', text: '让对方说出想要的结果，再判断你的方案是否匹配。' },
              { icon: MessageCircle, label: 'Offer', text: '只呈现和他问题有关的方案，不一次性丢所有资料。' },
              { icon: PhoneCall, label: 'Decision', text: '引导到一个明确下一步：预约、付款、开始，或暂时不适合。' },
            ].map((step) => (
              <div key={step.label} className="flex gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-blue-50 text-blue-700">
                  <step.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{step.label}</p>
                  <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{step.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="sales-queue" className="space-y-3 scroll-mt-20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Today Sales Queue</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">今天优先跟进这些机会</h2>
          </div>
          <Link href="/crm/pipeline" className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
            查看完整管道
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {hasOpportunities ? (
          <div className="grid gap-3">
            {salesQueue.map((lead) => (
              <SalesQueueCard
                key={lead.id}
                lead={lead}
                onMarkWon={handleMarkWon}
                onSetFollowup={handleSetFollowup}
                markingWon={updateLead.isPending}
                settingFollowup={setFollowup.isPending}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-white p-6 text-center shadow-sm">
            <Target className="mx-auto h-8 w-8 text-[var(--color-text-muted)]" />
            <h3 className="mt-3 text-lg font-semibold text-[var(--color-text)]">
              {hasLeads ? '还没有可成交机会' : '还没有 Leads 可以成交'}
            </h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              {hasLeads
                ? '先回到 CRM，把新 Leads 资格确认、安排预约或发送方案。进入 Hot、预约、提案或谈判后，这里会变成 Sales 跟进队列。'
                : 'Sales 不应该凭空出现。先完成漏斗和流量测试，让真实 Leads 进入 CRM，再回来推进成交。'}
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              <Link href="/crm" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
                打开 CRM
              </Link>
              <Link href="/traffic-engine" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 text-sm font-semibold text-[var(--color-text)] hover:bg-[var(--color-surface)]">
                启动流量测试
              </Link>
            </div>
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Objection Shortcuts</p>
        <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">常见顾虑的回应方向</h2>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {[
            { label: '太贵', reply: '先确认他比较的是价格还是结果，再把不行动的成本讲清楚。' },
            { label: '考虑一下', reply: '不要追问成交，先问“是哪一部分还不确定？”找出隐藏顾虑。' },
            { label: '没时间', reply: '把方案转成低门槛下一步，例如 10 分钟确认或先从最小行动开始。' },
          ].map((item) => (
            <div key={item.label} className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-3">
              <p className="text-sm font-semibold text-[var(--color-text)]">{item.label}</p>
              <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">{item.reply}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
