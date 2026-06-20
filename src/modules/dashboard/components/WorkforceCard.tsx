import Link from 'next/link';
import { Zap } from 'lucide-react';
import type { AgentWorkforceProjection, WorkforceAgentType, WorkforceTaskStatus } from '@/modules/agent-workforce/contracts/AgentWorkforce';

export type WorkforceSummaryItem = {
  assignmentId: string;
  agentName: string;
  status: 'IDLE' | 'RUNNING' | 'WAITING' | 'FAILED' | 'COMPLETED';
  currentTask: string;
  completionPercent: number;
};

const AGENT_NAMES: Record<WorkforceAgentType, string> = {
  coo_agent: 'AI COO',
  content_agent: '内容助手',
  lead_magnet_agent: '引流资源助手',
  funnel_agent: '漏斗助手',
  landing_page_agent: '领取页助手',
  traffic_agent: '流量助手',
  analytics_agent: '洞察助手',
  crm_agent: '客户助手',
};

function workforceStatus(status: WorkforceTaskStatus): WorkforceSummaryItem['status'] {
  if (status === 'running') return 'RUNNING';
  if (status === 'completed') return 'COMPLETED';
  if (status === 'failed') return 'FAILED';
  return 'WAITING';
}

function completionPercent(status: WorkforceSummaryItem['status']) {
  if (status === 'COMPLETED') return 100;
  if (status === 'RUNNING') return 67;
  return 0;
}

export function buildWorkforceSummary(workforce: AgentWorkforceProjection): WorkforceSummaryItem[] {
  const assignments = workforce.currentAssignments.slice(0, 3).map((assignment) => ({
    assignmentId: assignment.assignmentId,
    agentName: AGENT_NAMES[assignment.agentType],
    status: workforceStatus(assignment.status),
    currentTask: assignment.action.title,
    completionPercent: completionPercent(workforceStatus(assignment.status)),
  }));

  if (assignments.length > 0) return assignments;

  return workforce.activeAgents.slice(0, 3).map((agent) => ({
    assignmentId: agent.agentType,
    agentName: agent.name || AGENT_NAMES[agent.agentType],
    status: agent.availability === 'available' ? 'IDLE' : 'WAITING',
    currentTask: '等待 AI COO 分配任务',
    completionPercent: 0,
  }));
}

type WorkforceCardProps = {
  agents: WorkforceSummaryItem[];
};

export function WorkforceCard({ agents }: WorkforceCardProps) {
  return (
    <section className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Zap className="h-5 w-5 text-blue-600" />
          <h2 className="text-base font-semibold text-[var(--color-text)]">AI 工作队</h2>
        </div>
        <Link href="/ai-workforce" className="text-sm font-semibold text-blue-600 hover:text-blue-700">
          打开工作队
        </Link>
      </div>
      <div className="grid gap-3">
        {agents.map((agent) => (
          <div key={agent.assignmentId} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-xs font-semibold uppercase text-blue-700">{agent.status}</p>
            <div className="mt-2 flex items-start justify-between gap-3">
              <h3 className="text-sm font-bold text-[var(--color-text)]">{agent.agentName}</h3>
              <span className="text-xs font-semibold text-[var(--color-text-muted)]">{agent.completionPercent}%</span>
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{agent.currentTask}</p>
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
              <div className="h-full rounded-full bg-blue-600" style={{ width: `${agent.completionPercent}%` }} />
            </div>
          </div>
        ))}
        {agents.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">AI COO 会在你执行下一步后分配对应 Agent。</p>
        ) : null}
      </div>
    </section>
  );
}
