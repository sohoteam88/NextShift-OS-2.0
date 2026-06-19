import Link from 'next/link';
import { Zap } from 'lucide-react';
import type { AgentWorkforceProjection, WorkforceAgentType, WorkforceTaskStatus } from '@/modules/agent-workforce/contracts/AgentWorkforce';

export type WorkforceSummaryItem = {
  assignmentId: string;
  agentType: WorkforceAgentType;
  status: WorkforceTaskStatus;
  title: string;
};

export function buildWorkforceSummary(workforce: AgentWorkforceProjection): WorkforceSummaryItem[] {
  const assignments = workforce.currentAssignments.slice(0, 3).map((assignment) => ({
    assignmentId: assignment.assignmentId,
    agentType: assignment.agentType,
    status: assignment.status,
    title: assignment.action.title,
  }));

  if (assignments.length > 0) return assignments;

  return workforce.activeAgents.slice(0, 3).map((agent) => ({
    assignmentId: agent.agentType,
    agentType: agent.agentType,
    status: agent.availability === 'available' ? 'assigned' : 'approval_required',
    title: '等待 AI COO 分配任务',
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
      <div className="grid gap-3 md:grid-cols-3">
        {agents.map((agent) => (
          <div key={agent.assignmentId} className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
            <p className="text-xs font-semibold uppercase text-blue-700">{agent.status}</p>
            <h3 className="mt-2 text-sm font-bold text-[var(--color-text)]">{agent.agentType.replace(/_/g, ' ')}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--color-text-muted)]">{agent.title}</p>
          </div>
        ))}
        {agents.length === 0 ? (
          <p className="text-sm text-[var(--color-text-muted)]">AI COO 会在你执行下一步后分配对应 Agent。</p>
        ) : null}
      </div>
    </section>
  );
}
