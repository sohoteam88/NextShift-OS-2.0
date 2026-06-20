'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertCircle, ArrowLeft, Brain, ChevronDown, ChevronUp, Loader2, Play, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AGENT_REGISTRY } from '../services/agent-registry';
import type { RuntimeAssignment } from '@/modules/agent-runtime/contracts/RuntimeAssignment';
import type { AgentId, AgentExecutionReport, MultiAgentReport } from '../types/agents';

type WorkforceData = {
  available: AgentId[];
  recommended: AgentId[];
  pendingAssignments: RuntimeAssignment[];
  reports: AgentExecutionReport[];
};

type ExecuteInput =
  | { assignmentId: string }
  | { agentId: AgentId; goal?: string; overrideReason?: string }
  | { goal: string; multi: true; overrideReason: string };

function useWorkforce() {
  return useQuery({
    queryKey: ['workforce'],
    queryFn: async () => {
      const r = await fetch('/api/v1/ai-workforce');
      if (!r.ok) throw new Error('Failed');
      return r.json() as Promise<{ data: WorkforceData }>;
    },
    staleTime: 30_000,
  });
}

function useExecute() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (opts: ExecuteInput) => {
      const r = await fetch('/api/v1/ai-workforce/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(opts),
      });
      if (!r.ok) throw new Error('Failed');
      return r.json() as Promise<{ data: MultiAgentReport | AgentExecutionReport }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workforce'] }),
  });
}

function assignmentLabel(assignment: RuntimeAssignment) {
  if (assignment.objective.toLowerCase().includes('lead magnet') || assignment.objective.includes('引流')) return 'Generate Lead Magnet';
  if (assignment.objective.toLowerCase().includes('landing')) return 'Generate Landing Page';
  if (assignment.objective.toLowerCase().includes('content') || assignment.objective.includes('内容')) return 'Generate Content Calendar';
  if (assignment.objective.toLowerCase().includes('funnel') || assignment.objective.includes('漏斗')) return 'Generate Funnel';
  if (assignment.objective.toLowerCase().includes('audience') || assignment.objective.includes('受众')) return 'Research Audience';
  return assignment.objective;
}

function basisLabel(basis: RuntimeAssignment['basis']) {
  switch (basis) {
    case 'coo_assignment':
      return 'COO Assignment';
    case 'default_stage_fallback':
      return 'Journey Assignment';
    case 'direct_agent_request':
      return 'Direct Assignment';
    case 'explicit_goal_request':
      return 'Goal Assignment';
  }
}

export function WorkforceDashboard() {
  const router = useRouter();
  const q = useWorkforce();
  const exec = useExecute();
  const d = q.data?.data;
  const [advancedOpen, setAdvancedOpen] = React.useState(false);
  const [goal, setGoal] = React.useState('');
  const [overrideReason, setOverrideReason] = React.useState('');
  const reports = d?.reports ?? [];
  const assignments = d?.pendingAssignments ?? [];
  const availableAgents = d?.available ?? [];
  const hasWorkforce = availableAgents.length > 0 || assignments.length > 0 || reports.length > 0;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center gap-3">
        <button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button>
        <div>
          <h1 className="text-xl font-bold">AI 工作团队</h1>
          <p className="text-xs text-gray-500">默认执行 Journey → AI COO → Runtime 产生的任务。</p>
        </div>
      </div>

      {q.isError ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-5">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
            <div>
              <h2 className="text-sm font-bold text-red-900">AI 工作团队暂时不可用</h2>
              <p className="mt-1 text-sm leading-6 text-red-800">系统暂时无法读取你的 AI agent 状态。你可以先回到 Journey 继续当前任务，或稍后再试。</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => router.push('/journey')} className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">打开 Journey</button>
                <button onClick={() => q.refetch()} className="rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-bold text-red-700 hover:bg-red-100">重试</button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {!q.isError && !hasWorkforce ? (
        <section className="rounded-xl border border-dashed border-purple-200 bg-purple-50 p-6">
          <div className="flex items-start gap-3">
            <Users className="mt-0.5 h-5 w-5 shrink-0 text-purple-600" />
            <div>
              <h2 className="text-base font-bold text-purple-950">AI 工作团队尚未激活</h2>
              <p className="mt-1 text-sm leading-6 text-purple-800">
                先完成内容、引流磁铁和漏斗相关任务。等系统有明确任务可以交给 agent 执行后，工作团队会自动出现在这里。
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <button onClick={() => router.push('/journey')} className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700">打开 Journey</button>
                <button onClick={() => router.push('/content-engine')} className="rounded-lg border border-purple-200 bg-white px-4 py-2 text-sm font-bold text-purple-700 hover:bg-purple-100">继续内容任务</button>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {hasWorkforce ? <section className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-purple-600" />
          <h2 className="text-lg font-bold">Today&apos;s Assignments</h2>
        </div>
        <div className="space-y-3">
          {assignments.length > 0 ? assignments.map((assignment) => (
            <div key={assignment.assignmentId} className="rounded-xl border border-purple-200 bg-white p-4 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{assignmentLabel(assignment)}</span>
                    <span className="rounded-full bg-purple-50 px-2 py-0.5 text-xs font-medium text-purple-700">{basisLabel(assignment.basis)}</span>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">{assignment.objective}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {assignment.selectedAgents.map((id) => (
                      <span key={id} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                        {AGENT_REGISTRY[id]?.emoji} {AGENT_REGISTRY[id]?.name ?? id}
                      </span>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => exec.mutate({ assignmentId: assignment.assignmentId })}
                  disabled={exec.isPending || assignment.selectedAgents.length === 0}
                  className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-4 py-2 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
                >
                  {exec.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                  Execute
                </button>
              </div>
            </div>
          )) : (
            <div className="rounded-xl border border-dashed border-purple-200 bg-white p-5 text-sm text-gray-500">
              暂时没有 Runtime Assignment。系统会根据当前 Journey 阶段生成下一步任务。
            </div>
          )}
        </div>
      </section> : null}

      {hasWorkforce ? <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <button
          type="button"
          onClick={() => setAdvancedOpen((value) => !value)}
          className="flex w-full items-center justify-between text-left"
        >
          <span className="flex items-center gap-2 text-sm font-bold"><Brain className="h-4 w-4 text-purple-600" /> Advanced Override</span>
          {advancedOpen ? <ChevronUp className="h-4 w-4 text-gray-400" /> : <ChevronDown className="h-4 w-4 text-gray-400" />}
        </button>
        {advancedOpen ? (
          <div className="mt-4 space-y-3">
            <input
              value={goal}
              onChange={e => setGoal(e.target.value)}
              className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-purple-400"
              placeholder="例如: 我想要更多客户"
            />
            <textarea
              value={overrideReason}
              onChange={e => setOverrideReason(e.target.value)}
              className="w-full rounded-xl border border-purple-200 bg-white px-4 py-3 text-sm focus:outline-none focus:border-purple-400"
              placeholder="说明为什么要覆盖 Runtime Assignment"
              rows={3}
            />
            <button
              onClick={() => exec.mutate({ goal, multi: true, overrideReason })}
              disabled={exec.isPending || !goal.trim() || !overrideReason.trim()}
              className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50"
            >
              {exec.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
              Run Manual Override
            </button>
          </div>
        ) : null}
      </section> : null}

      {hasWorkforce ? <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h3 className="text-sm font-bold mb-3">👥 你的团队</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {availableAgents.map(id => {
            const agent = AGENT_REGISTRY[id]; if (!agent) return null;
            const isRec = d?.recommended?.includes(id);
            return (
              <div key={id} className={cn('flex items-start gap-3 rounded-xl border p-4 text-left', isRec && 'border-purple-300 bg-purple-50')}>
                <span className="text-2xl">{agent.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-sm font-bold">{agent.name}</span>{isRec && <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">推荐</span>}</div>
                  <p className="text-xs text-gray-500 mt-0.5">{agent.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">{agent.capabilities.slice(0,3).map(c => <span key={c} className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{c}</span>)}</div>
                </div>
              </div>
            );
          })}
        </div>
      </section> : null}

      {reports.length > 0 && (
        <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
          <h3 className="text-sm font-bold mb-3">📋 最近报告</h3>
          {reports.map((r, i) => (
            <div key={i} className="mb-3 p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center justify-between mb-2"><span className="text-sm font-bold">{AGENT_REGISTRY[r.agent]?.emoji} {AGENT_REGISTRY[r.agent]?.name}</span><span className="text-xs text-gray-400">{new Date(r.executedAt).toLocaleString()}</span></div>
              <p className="text-xs text-gray-500 mb-2">目标: {r.objective}</p>
              {r.findings.map((f, j) => <p key={j} className="text-xs text-gray-700">• {f}</p>)}
              {r.recommendations.length > 0 && <p className="text-xs text-purple-600 mt-1">💡 {r.recommendations[0]}</p>}
              <div className="flex items-center justify-between mt-2"><span className="text-xs text-gray-400">信心: {r.confidenceScore}%</span></div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}
