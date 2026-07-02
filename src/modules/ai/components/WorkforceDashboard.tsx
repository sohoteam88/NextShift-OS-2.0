'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Bot,
  Brain,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  ClipboardCheck,
  FileText,
  Loader2,
  LockKeyhole,
  Play,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { AGENT_REGISTRY } from '../services/agent-registry';
import type { RuntimeAssignment } from '@/modules/agent-runtime/contracts/RuntimeAssignment';
import type { BusinessCapabilityState } from '@/modules/business-state/contracts/BusinessStateResult';
import type { AgentId, AgentExecutionReport, MultiAgentReport } from '../types/agents';

type WorkforceRequirement = {
  id: string;
  label: string;
  completed: boolean;
  description: string;
  route: string;
};

type WorkforceGate = {
  shouldShowWorkforce: boolean;
  currentState: BusinessCapabilityState;
  completedStates: BusinessCapabilityState[];
  readinessScore: number;
  missingRequirements: string[];
  recommendedRoute: string;
  requirements: WorkforceRequirement[];
};

type WorkforceData = {
  available: AgentId[];
  recommended: AgentId[];
  pendingAssignments: RuntimeAssignment[];
  reports: AgentExecutionReport[];
  workforceGate: WorkforceGate;
};

type ExecuteInput =
  | { assignmentId: string }
  | { agentId: AgentId; goal?: string; overrideReason?: string }
  | { goal: string; multi: true; overrideReason: string };

const STATE_LABELS: Record<BusinessCapabilityState, string> = {
  BRAND_FOUNDATION: 'AI 访谈',
  BRAND_POSITIONING: 'Brand DNA',
  CONTENT_SYSTEM: '内容引擎',
  LEAD_MAGNET: '引流资源',
  FUNNEL: '漏斗落地页',
  LEAD_GENERATION: '流量测试 / Leads',
  SALES: 'Sales 跟进',
  TEAM_BUILDING: 'Team / Workforce',
};

const AGENT_ACTIVATION_PLAN = [
  {
    title: 'Content Agent',
    agentId: 'content_director' as AgentId,
    description: '把内容计划、招募内容和零售内容整理成可重复生产节奏。',
    route: '/content-engine',
  },
  {
    title: 'Lead Magnet Agent',
    agentId: 'funnel_architect' as AgentId,
    description: '把领取资源、受众问题和 CTA 变成团队可复制的获客入口。',
    route: '/lead-magnet',
  },
  {
    title: 'Funnel Agent',
    agentId: 'funnel_architect' as AgentId,
    description: '维护零售漏斗和招募漏斗，让新成员能照着同一套路径执行。',
    route: '/funnel',
  },
];

function useWorkforce() {
  return useQuery({
    queryKey: ['workforce'],
    queryFn: async () => {
      const response = await fetch('/api/v1/ai-workforce');
      if (!response.ok) throw new Error('Failed');
      return response.json() as Promise<{ data: WorkforceData }>;
    },
    staleTime: 30_000,
  });
}

function useExecute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: ExecuteInput) => {
      const response = await fetch('/api/v1/ai-workforce/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      if (!response.ok) throw new Error('Failed');
      return response.json() as Promise<{ data: MultiAgentReport | AgentExecutionReport }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workforce'] }),
  });
}

function assignmentLabel(assignment: RuntimeAssignment) {
  const normalized = assignment.objective.toLowerCase();
  if (normalized.includes('business state') || normalized.includes('canonical')) return '执行当前业务建议';
  if (normalized.includes('lead magnet') || assignment.objective.includes('引流')) return '创建引流资源';
  if (normalized.includes('landing')) return '创建领取页';
  if (normalized.includes('content') || assignment.objective.includes('内容')) return '生成内容计划';
  if (normalized.includes('funnel') || assignment.objective.includes('漏斗')) return '创建漏斗页面';
  if (normalized.includes('team') || assignment.objective.includes('团队')) return '建立团队复制动作';
  if (normalized.includes('audience') || assignment.objective.includes('受众')) return '分析目标受众';
  if (normalized.includes('brand')) return '完善品牌资料';
  return assignment.objective;
}

function objectiveDisplayText(objective: string) {
  const normalized = objective.toLowerCase();
  if (normalized.includes('business state') || normalized.includes('canonical')) {
    return '根据当前业务缺口，执行系统建议的下一步。';
  }
  if (normalized.includes('journey stage') || normalized.includes('brand_discovery')) {
    return '根据当前 Journey 阶段，完善品牌资料并推进下一步。';
  }
  if (normalized.includes('lead magnet')) return '创建能吸引潜在客户留下资料的引流资源。';
  if (normalized.includes('landing')) return '创建清晰的领取页，让潜在客户可以留下联系方式。';
  if (normalized.includes('content')) return '整理下一批内容任务，让客户和伙伴更容易发现你的系统。';
  if (normalized.includes('funnel')) return '完善从流量到客户跟进的转化路径。';
  if (normalized.includes('team')) return '把已验证动作整理成新伙伴可以复制的步骤。';
  if (normalized.includes('audience')) return '梳理目标受众，让下一步营销更聚焦。';
  return objective;
}

function reportDisplayText(value: string) {
  return value
    .replace(/WhatsApp AI/g, '客户跟进中心')
    .replace(/Hot Lead/g, '高意向客户')
    .replace(/\bLead\b/g, '潜在客户')
    .replace(/AI助理/g, 'AI 助理')
    .replace(/引流磁铁/g, '引流资源');
}

function basisLabel(basis: RuntimeAssignment['basis']) {
  switch (basis) {
    case 'coo_assignment':
      return 'AI COO 指派';
    case 'default_stage_fallback':
      return 'Journey 指派';
    case 'direct_agent_request':
      return '直接指派';
    case 'explicit_goal_request':
      return '目标指派';
  }
}

function priorityLabel(score: number) {
  if (score >= 80) return '高';
  if (score >= 50) return '普通';
  return '准备中';
}

function RequirementRow({ requirement }: { requirement: WorkforceRequirement }) {
  return (
    <div className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-3">
      {requirement.completed ? (
        <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
      ) : (
        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
      )}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-sm font-semibold text-[var(--color-text)]">{requirement.label}</p>
          <span className="rounded-[var(--radius-full)] bg-[var(--color-surface)] px-2 py-0.5 text-xs text-[var(--color-text-muted)]">
            {requirement.completed ? '已满足' : '待完成'}
          </span>
        </div>
        <p className="mt-1 text-xs leading-5 text-[var(--color-text-muted)]">{requirement.description}</p>
      </div>
    </div>
  );
}

function LockedWorkforceView({ gate, onRetry }: { gate: WorkforceGate; onRetry: () => void }) {
  return (
    <div className="mx-auto max-w-5xl space-y-5 pb-12">
      <section className="rounded-[var(--radius-lg)] border border-amber-200 bg-amber-50 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-white px-3 py-1 text-xs font-semibold text-amber-700">
              <LockKeyhole className="h-3.5 w-3.5" />
              Team / Workforce Hidden
            </p>
            <h1 className="mt-4 text-2xl font-semibold text-[var(--color-text)] md:text-3xl">
              还不能显示 Team / Workforce
            </h1>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text)]">
              AI COO 还没有判断你进入团队复制阶段。这里不会过早展示 AI 工作队、团队管理或复杂自动化，因为在没有第一笔成交和可复制流程前，这些会变成噪音。
            </p>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="font-semibold text-[var(--color-text)]">当前阶段</p>
                <p className="mt-1 text-[var(--color-text-muted)]">{STATE_LABELS[gate.currentState]}</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="font-semibold text-[var(--color-text)]">显示规则</p>
                <p className="mt-1 text-[var(--color-text-muted)]">只有进入团队复制阶段后才显示执行工作队。</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="font-semibold text-[var(--color-text)]">下一步</p>
                <p className="mt-1 text-[var(--color-text-muted)]">先完成当前最高杠杆任务。</p>
              </div>
            </div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-amber-100 bg-white p-4 lg:w-72">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Recommended Next Action</p>
            <p className="mt-2 text-lg font-semibold text-[var(--color-text)]">
              {gate.currentState === 'SALES' ? '先完成 Sales 跟进' : '回到 AI COO 执行当前任务'}
            </p>
            <Link
              href={gate.recommendedRoute}
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-amber-600 px-4 text-sm font-semibold text-white hover:bg-amber-700"
            >
              继续当前任务
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Button type="button" variant="secondary" onClick={onRetry} className="mt-2 w-full">
              重新检查
            </Button>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Unlock Conditions</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">Team / Workforce 出现前必须具备什么？</h2>
          </div>
          {gate.requirements.map((requirement) => (
            <RequirementRow key={requirement.id} requirement={requirement} />
          ))}
        </div>
        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Why Hidden</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">这里不是普通功能菜单</h2>
          <div className="mt-4 space-y-3 text-sm leading-6 text-[var(--color-text-muted)]">
            <p>Team / Workforce 代表你开始把已经有效的动作交给 AI agent 或团队成员复制。</p>
            <p>如果还没有成交、没有流程、没有可委派任务，系统不应该让你管理一支不存在的团队。</p>
            <p>当 AI COO 判断下一步是团队动作，这页会自动变成执行中心。</p>
          </div>
        </div>
      </section>
    </div>
  );
}

function AssignmentCard({
  assignment,
  isExecuting,
  onExecute,
}: {
  assignment: RuntimeAssignment;
  isExecuting: boolean;
  onExecute: (assignmentId: string) => void;
}) {
  return (
    <article className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-base font-semibold text-[var(--color-text)]">{assignmentLabel(assignment)}</h3>
            <span className="rounded-[var(--radius-full)] bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
              {basisLabel(assignment.basis)}
            </span>
          </div>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            {objectiveDisplayText(assignment.objective)}
          </p>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {assignment.selectedAgents.map((id) => (
              <span key={id} className="rounded-[var(--radius-full)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text-muted)]">
                {AGENT_REGISTRY[id]?.emoji} {AGENT_REGISTRY[id]?.name ?? id}
              </span>
            ))}
          </div>
        </div>
        <Button
          type="button"
          onClick={() => onExecute(assignment.assignmentId)}
          disabled={assignment.selectedAgents.length === 0}
          loading={isExecuting}
          icon={<Play className="h-4 w-4" />}
        >
          执行
        </Button>
      </div>
    </article>
  );
}

export function WorkforceDashboard() {
  const router = useRouter();
  const query = useWorkforce();
  const execute = useExecute();
  const data = query.data?.data;
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [goal, setGoal] = React.useState('');
  const [overrideReason, setOverrideReason] = React.useState('');

  if (query.isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (query.isError || !data) {
    return (
      <div className="mx-auto max-w-3xl py-12">
        <section className="rounded-[var(--radius-lg)] border border-red-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold text-red-700">Workforce Engine Failure</p>
          <h1 className="mt-2 text-2xl font-semibold text-[var(--color-text)]">Team / Workforce 暂时不可用。</h1>
          <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">
            系统暂时无法读取你的 AI agent 状态。你可以先回到 Dashboard 继续当前任务，或稍后重试。
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href="/dashboard" className="inline-flex h-10 items-center justify-center rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700">
              打开 Dashboard
            </Link>
            <Button type="button" variant="secondary" onClick={() => void query.refetch()}>
              重试
            </Button>
          </div>
        </section>
      </div>
    );
  }

  const gate = data.workforceGate;
  const reports = data.reports ?? [];
  const assignments = data.pendingAssignments ?? [];
  const recommendedAgents = new Set(data.recommended ?? []);
  const completedRequirements = gate.requirements.filter((requirement) => requirement.completed).length;
  const agentWorkforceReady = gate.requirements.find((requirement) => requirement.id === 'agentWorkforceActive')?.completed ?? false;

  if (!gate.shouldShowWorkforce) {
    return <LockedWorkforceView gate={gate} onRetry={() => void query.refetch()} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-5 pb-12">
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => router.push('/dashboard')} aria-label="Back to dashboard">
          <ArrowLeft className="h-5 w-5 text-[var(--color-text-muted)]" />
        </button>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Team / Workforce</p>
          <h1 className="text-2xl font-semibold text-[var(--color-text)]">团队复制执行中心</h1>
        </div>
      </div>

      <section className="rounded-[var(--radius-lg)] border border-blue-100 bg-blue-50 p-5 shadow-sm md:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-3xl">
            <p className="inline-flex items-center gap-2 rounded-[var(--radius-full)] bg-white px-3 py-1 text-xs font-semibold text-blue-700">
              <Sparkles className="h-3.5 w-3.5" />
              AI COO Mission
            </p>
            <h2 className="mt-4 text-2xl font-semibold text-[var(--color-text)] md:text-3xl">
              启动 Team / Workforce
            </h2>
            <p className="mt-3 text-sm leading-6 text-[var(--color-text)]">
              AI COO 判断你已经来到团队动作阶段。现在的目标不是再做更多单点功能，而是把已经有效的内容、引流、漏斗、CRM 和 Sales 动作整理成 AI agent 与团队成员可以复制的工作流。
            </p>
            <div className="mt-4 grid gap-3 text-sm md:grid-cols-3">
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="font-semibold text-[var(--color-text)]">为什么是这个？</p>
                <p className="mt-1 leading-5 text-[var(--color-text-muted)]">有真实结果后，复制流程比继续靠创办人手动执行更重要。</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="font-semibold text-[var(--color-text)]">为什么是现在？</p>
                <p className="mt-1 leading-5 text-[var(--color-text-muted)]">团队动作越早标准化，新成员越容易照着系统获得第一个结果。</p>
              </div>
              <div className="rounded-[var(--radius-md)] bg-white p-3">
                <p className="font-semibold text-[var(--color-text)]">为什么不是别的？</p>
                <p className="mt-1 leading-5 text-[var(--color-text-muted)]">报表和复杂管理要等复制动作清楚后才有意义。</p>
              </div>
            </div>
          </div>
          <div className="rounded-[var(--radius-lg)] border border-blue-100 bg-white p-4 lg:w-72">
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Workforce Readiness</p>
            <p className="mt-2 text-3xl font-semibold text-[var(--color-text)]">
              {completedRequirements}/{gate.requirements.length}
            </p>
            <p className="mt-1 text-sm leading-6 text-[var(--color-text-muted)]">
              团队复制条件已满足
            </p>
            <a
              href="#workforce-queue"
              className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-[var(--radius-md)] bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              查看执行队列
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="space-y-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Team Conditions</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">团队动作必须具备的条件</h2>
          </div>
          {gate.requirements.map((requirement) => (
            <RequirementRow key={requirement.id} requirement={requirement} />
          ))}
        </div>

        <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Duplication Playbook</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">团队复制不是管理人，是复制动作</h2>
          <div className="mt-4 space-y-3">
            {[
              { icon: FileText, label: 'Document', text: '把已经有效的内容、漏斗、跟进话术整理成步骤。' },
              { icon: Bot, label: 'Delegate', text: '把重复任务交给 Content、Lead Magnet、Funnel 和 CRM agents。' },
              { icon: Users, label: 'Duplicate', text: '让新成员只需要跟着同一套任务清单执行。' },
              { icon: ClipboardCheck, label: 'Review', text: '保留人工审核，避免 AI 自动做高风险动作。' },
              { icon: ShieldCheck, label: 'Scale', text: '只复制已经产生结果的动作，不复制猜测。' },
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

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Agent Activation</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">工作队先激活这 3 个基础 agents</h2>
          </div>
          <span className="text-sm font-semibold text-[var(--color-text-muted)]">
            {agentWorkforceReady ? '已进入可执行状态' : '等待激活'}
          </span>
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          {AGENT_ACTIVATION_PLAN.map((item) => {
            const agent = AGENT_REGISTRY[item.agentId];
            const isRecommended = recommendedAgents.has(item.agentId);
            return (
              <div key={item.title} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{agent?.emoji}</span>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{item.title}</p>
                  {isRecommended ? (
                    <span className="rounded-[var(--radius-full)] bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">推荐</span>
                  ) : null}
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--color-text-muted)]">{item.description}</p>
                <Link href={item.route} className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800">
                  打开来源页面
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            );
          })}
        </div>
      </section>

      <section id="workforce-queue" className="space-y-3 scroll-mt-20">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Delegation Queue</p>
            <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">AI COO 指派给工作队的任务</h2>
          </div>
          <button
            type="button"
            onClick={() => void query.refetch()}
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800"
          >
            重新检查
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>

        {assignments.length > 0 ? (
          <div className="grid gap-3">
            {assignments.map((assignment) => (
              <AssignmentCard
                key={assignment.assignmentId}
                assignment={assignment}
                isExecuting={execute.isPending}
                onExecute={(assignmentId) => execute.mutate({ assignmentId })}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-[var(--radius-lg)] border border-dashed border-[var(--color-border)] bg-white p-6 text-center shadow-sm">
            <Bot className="mx-auto h-8 w-8 text-[var(--color-text-muted)]" />
            <h3 className="mt-3 text-lg font-semibold text-[var(--color-text)]">暂时没有可委派任务</h3>
            <p className="mx-auto mt-2 max-w-2xl text-sm leading-6 text-[var(--color-text-muted)]">
              当 AI COO 产生团队复制、内容生产、漏斗维护或 CRM 分派任务时，这里会出现可以执行的 agent 任务。
            </p>
          </div>
        )}
      </section>

      <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
        <button
          type="button"
          onClick={() => setAdvancedOpen((value) => !value)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Brain className="h-4 w-4 text-blue-700" />
            手动指派给工作队
          </span>
          {advancedOpen ? <ChevronUp className="h-4 w-4 text-[var(--color-text-muted)]" /> : <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" />}
        </button>
        {advancedOpen ? (
          <div className="mt-4 space-y-3">
            <input
              value={goal}
              onChange={(event) => setGoal(event.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="例如：把我的团队招募流程整理成新成员 7 天行动清单"
            />
            <textarea
              value={overrideReason}
              onChange={(event) => setOverrideReason(event.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white px-4 py-3 text-sm focus:border-blue-400 focus:outline-none"
              placeholder="说明为什么需要手动指派，AI 会保留这次判断记录"
              rows={3}
            />
            <Button
              type="button"
              onClick={() => execute.mutate({ goal, multi: true, overrideReason })}
              disabled={!goal.trim() || !overrideReason.trim()}
              loading={execute.isPending}
              icon={<Play className="h-4 w-4" />}
            >
              执行手动指派
            </Button>
          </div>
        ) : null}
      </section>

      {reports.length > 0 ? (
        <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--color-text-muted)]">Recent Agent Reports</p>
          <h2 className="mt-1 text-xl font-semibold text-[var(--color-text)]">最近工作队报告</h2>
          <div className="mt-4 grid gap-3">
            {reports.map((report) => (
              <article key={`${report.agent}-${report.executedAt}`} className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-text)]">
                      {AGENT_REGISTRY[report.agent]?.emoji} {AGENT_REGISTRY[report.agent]?.name}
                    </p>
                    <p className="mt-1 text-xs text-[var(--color-text-muted)]">目标：{objectiveDisplayText(report.objective)}</p>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">{new Date(report.executedAt).toLocaleString()}</span>
                </div>
                <div className="mt-3 space-y-1">
                  {report.findings.slice(0, 3).map((finding) => (
                    <p key={finding} className="text-sm leading-6 text-[var(--color-text-muted)]">• {reportDisplayText(finding)}</p>
                  ))}
                </div>
                {report.recommendations[0] ? (
                  <p className="mt-2 text-sm font-medium text-blue-700">建议：{reportDisplayText(report.recommendations[0])}</p>
                ) : null}
                <p className="mt-2 text-xs text-[var(--color-text-muted)]">优先级：{priorityLabel(report.confidenceScore)}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
