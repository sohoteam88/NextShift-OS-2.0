'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Brain, Loader2, Play, Sparkles, Users } from 'lucide-react';
import { cn } from '@/lib/cn';
import { AGENT_REGISTRY } from '../services/agent-registry';
import type { AgentId, AgentExecutionReport, MultiAgentReport } from '../types/agents';

function useWorkforce() { return useQuery({ queryKey: ['workforce'], queryFn: async () => { const r = await fetch('/api/v1/ai-workforce'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: { available: AgentId[]; recommended: AgentId[]; reports: AgentExecutionReport[] } }>; }, staleTime: 30_000 }); }
function useExecute() { const qc = useQueryClient(); return useMutation({ mutationFn: async (opts: { agentId?: AgentId; goal?: string; multi?: boolean }) => { const r = await fetch('/api/v1/ai-workforce/execute', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) }); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: MultiAgentReport | AgentExecutionReport }>; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['workforce'] }) }); }

export function WorkforceDashboard() {
  const router = useRouter(); const q = useWorkforce(); const exec = useExecute();
  const d = q.data?.data; const [goal, setGoal] = React.useState('我想要更多客户');
  const reports = d?.reports ?? [];

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">AI 工作团队</h1><p className="text-xs text-gray-500">不是一个AI工具，是一支AI商业团队。</p></div></div>

      {/* Goal input */}
      <section className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6">
        <div className="flex items-center gap-2 mb-3"><Brain className="h-5 w-5 text-purple-600" /><h2 className="text-lg font-bold">Assign a Goal</h2></div>
        <input value={goal} onChange={e => setGoal(e.target.value)} className="w-full rounded-xl border border-purple-200 px-4 py-3 text-sm bg-white mb-3 focus:outline-none focus:border-purple-400" placeholder="例如: 我想要更多客户" />
        <div className="flex flex-wrap gap-2">
          <button onClick={() => exec.mutate({ goal, multi: true })} disabled={exec.isPending} className="inline-flex items-center gap-2 rounded-xl bg-purple-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-purple-700 disabled:opacity-50">{exec.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}启动工作团队</button>
        </div>
      </section>

      {/* Available Agents */}
      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h3 className="text-sm font-bold mb-3">👥 你的团队</h3>
        <div className="grid gap-2 sm:grid-cols-2">
          {(d?.available ?? []).map(id => {
            const agent = AGENT_REGISTRY[id]; if (!agent) return null;
            const isRec = d?.recommended?.includes(id);
            return (
              <button key={id} onClick={() => exec.mutate({ agentId: id })} disabled={exec.isPending} className={cn('flex items-start gap-3 rounded-xl border p-4 text-left hover:border-purple-300 hover:bg-purple-50 transition-colors disabled:opacity-50', isRec && 'border-purple-300 bg-purple-50')}>
                <span className="text-2xl">{agent.emoji}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2"><span className="text-sm font-bold">{agent.name}</span>{isRec && <span className="text-xs bg-purple-100 text-purple-700 rounded-full px-2 py-0.5">推荐</span>}</div>
                  <p className="text-xs text-gray-500 mt-0.5">{agent.description}</p>
                  <div className="flex flex-wrap gap-1 mt-1.5">{agent.capabilities.slice(0,3).map(c => <span key={c} className="text-xs bg-gray-100 rounded-full px-2 py-0.5">{c}</span>)}</div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent Reports */}
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
