'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Bolt, Loader2, Play, Power, Sparkles, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import { WORKFLOW_TEMPLATES } from '../workflowTemplates';
import type { WorkflowDefinition, WorkflowExecution } from '../types';

function useAuto() { return useQuery({ queryKey: ['automation'], queryFn: async () => { const r = await fetch('/api/v1/automation'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: { workflows: WorkflowDefinition[]; executions: WorkflowExecution[]; health: any } }>; }, staleTime: 30_000 }); }
function useToggle() { const qc = useQueryClient(); return useMutation({ mutationFn: async (opts: { workflowId: string; enabled: boolean }) => { const r = await fetch('/api/v1/automation', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) }); if (!r.ok) throw new Error('Failed'); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['automation'] }) }); }

export function AutomationDashboard() {
  const router = useRouter(); const q = useAuto(); const toggle = useToggle();
  const data = q.data?.data;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">AI Automation Engine</h1><p className="text-xs text-gray-500">不是手动操作，是自动执行。Less clicking, more execution.</p></div></div>

      {/* Workflow Templates */}
      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h3 className="text-sm font-bold mb-3">📋 工作流模板</h3>
        {WORKFLOW_TEMPLATES.map(t => {
          const isActive = data?.workflows?.find(w => w.id === t.id)?.enabled ?? t.enabled;
          return (
            <div key={t.id} className={cn('mb-3 p-4 rounded-xl border', isActive ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-gray-50')}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2"><Bolt className={cn('h-4 w-4', isActive ? 'text-emerald-600' : 'text-gray-400')} /><span className="text-sm font-bold">{t.name}</span><span className="text-xs bg-gray-200 rounded-full px-2 py-0.5">{t.requiredPlan}</span></div>
                <button onClick={() => toggle.mutate({ workflowId: t.id, enabled: !isActive })} disabled={toggle.isPending} className={cn('inline-flex items-center gap-1 rounded-lg px-3 py-1 text-xs font-bold', isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-200 text-gray-600 hover:bg-emerald-100')}>
                  <Power className="h-3 w-3" />{isActive ? 'ON' : 'OFF'}
                </button>
              </div>
              <p className="text-xs text-gray-500">{t.description}</p>
              <div className="mt-1 flex flex-wrap gap-1 text-xs text-gray-400">
                <span>触发: {t.trigger.type}</span>
                {t.conditions.length > 0 && <span>| 条件: {t.conditions.map(c => c.type).join(', ')}</span>}
                <span>| 动作: {t.actions.length}个</span>
              </div>
            </div>
          );
        })}
      </section>

      {/* Recent Executions */}
      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h3 className="text-sm font-bold mb-3">📊 最近执行</h3>
        {(data?.executions ?? []).length === 0 ? <p className="text-sm text-gray-500">暂无执行记录。激活工作流后开始自动执行。</p> :
          (data?.executions ?? []).slice(0, 10).map((e, i) => (
            <div key={e.id || i} className="flex items-center justify-between py-2 border-b last:border-0 text-sm">
              <div><span className="font-bold">{e.workflowName}</span><span className="text-xs text-gray-500 ml-2">{e.trigger}</span></div>
              <div className="flex items-center gap-2">
                <span className={cn('text-xs px-2 py-0.5 rounded-full', e.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : e.status === 'failed' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-600')}>{e.status}</span>
                <span className="text-xs text-gray-400">{e.actionsExecuted} actions</span>
              </div>
            </div>
          ))
        }
      </section>
    </div>
  );
}
