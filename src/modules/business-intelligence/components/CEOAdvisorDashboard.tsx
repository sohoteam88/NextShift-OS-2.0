'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, ArrowUp, Brain, Briefcase, Bug, Lightbulb, Loader2, Rocket, ShieldAlert, Target, TrendingUp,
} from 'lucide-react';
import { cn } from '@/lib/cn';
import type { CEOReport } from '../types';

function useCEO() { return useQuery({ queryKey: ['ceo-report'], queryFn: async () => { const r = await fetch('/api/v1/business-intel'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: CEOReport }>; }, staleTime: 60_000 }); }

export function CEOAdvisorDashboard() {
  const router = useRouter(); const q = useCEO(); const r = q.data?.data;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-amber-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">🧠 CEO Mode</h1><p className="text-xs text-gray-500">不是看数据，是做决策。AI CEO帮你运营业务。</p></div></div>

      {r && (
        <>
          {/* Executive Summary */}
          <section className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-white p-6">
            <div className="flex items-center gap-2 mb-2"><Brain className="h-5 w-5 text-amber-600" /><span className="text-sm font-bold text-amber-700">Executive Summary</span></div>
            <p className="text-lg font-bold text-[var(--color-text)]">{r.summary}</p>
          </section>

          {/* Business Health */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold mb-3">🏥 Business Health</h3>
            <div className="flex items-center justify-center mb-4">
              <div className={cn('text-5xl font-bold', r.health.overallScore>=80?'text-emerald-600':r.health.overallScore>=60?'text-blue-600':r.health.overallScore>=30?'text-amber-600':'text-red-500')}>
                {r.health.overallScore}<span className="text-2xl text-gray-400">/100</span>
              </div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 text-center text-xs">
              {[{k:'品牌',v:r.health.brandHealth},{k:'内容',v:r.health.contentHealth},{k:'视频',v:r.health.videoHealth},{k:'获客',v:r.health.leadGenHealth},{k:'流量',v:r.health.trafficHealth},{k:'漏斗',v:r.health.funnelHealth},{k:'销售',v:r.health.salesHealth},{k:'CRM',v:r.health.crmHealth},{k:'自动化',v:r.health.automationHealth}].map(d => (
                <div key={d.k} className="bg-gray-50 rounded-lg p-2"><div className="font-bold text-gray-500">{d.k}</div><div className={cn('font-bold',d.v>=70?'text-emerald-600':d.v>=40?'text-amber-600':'text-red-500')}>{d.v}%</div></div>
              ))}
            </div>
            {r.health.recommendations.map((rec,i) => <p key={i} className="text-xs text-amber-700 mt-2">💡 {rec}</p>)}
          </section>

          {/* Row: Bottlenecks + Risks */}
          <div className="grid gap-4 lg:grid-cols-2">
            {r.bottlenecks.length > 0 && (
              <section className="rounded-xl border border-red-200 bg-red-50 p-5">
                <h3 className="text-sm font-bold text-red-700 mb-2 flex items-center gap-1"><Bug className="h-4 w-4" />瓶颈</h3>
                {r.bottlenecks.map(b => <div key={b.id} className="mb-2 p-3 bg-white rounded-lg"><div className="flex items-center justify-between"><span className="text-sm font-bold">{b.description}</span><span className={cn('text-xs px-2 py-0.5 rounded-full',b.severity==='critical'?'bg-red-200 text-red-800':b.severity==='high'?'bg-amber-200 text-amber-800':'bg-gray-200 text-gray-700')}>{b.severity}</span></div><p className="text-xs text-gray-500 mt-1">👉 {b.recommendation}</p></div>)}
              </section>
            )}
            {r.risks.length > 0 && (
              <section className="rounded-xl border border-orange-200 bg-orange-50 p-5">
                <h3 className="text-sm font-bold text-orange-700 mb-2 flex items-center gap-1"><ShieldAlert className="h-4 w-4" />风险</h3>
                {r.risks.map(risk => <div key={risk.id} className="mb-2 p-3 bg-white rounded-lg"><div className="flex items-center justify-between"><span className="text-sm font-bold">{risk.risk}</span><span className={cn('text-xs px-2 py-0.5 rounded-full',risk.severity==='critical'?'bg-red-200 text-red-800':'bg-amber-200 text-amber-800')}>{risk.severity}</span></div><p className="text-xs text-gray-500 mt-1">👉 {risk.recommendation}</p></div>)}
              </section>
            )}
          </div>

          {/* Growth Opportunities */}
          {r.opportunities.length > 0 && (
            <section className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
              <h3 className="text-sm font-bold text-emerald-700 mb-2 flex items-center gap-1"><Rocket className="h-4 w-4" />增长机会 (按优先级)</h3>
              {r.opportunities.sort((a,b)=>b.priorityScore-a.priorityScore).slice(0,3).map(o => <div key={o.id} className="mb-2 p-3 bg-white rounded-lg"><div className="flex items-center justify-between"><span className="text-sm font-bold">{o.opportunity}</span><span className="text-xs font-bold text-emerald-700">优先级 {o.priorityScore}</span></div><p className="text-xs text-gray-500">{o.explanation}</p>{o.agentRecommended && <p className="text-xs text-purple-600 mt-1">🤖 推荐Agent: {o.agentRecommended}</p>}</div>)}
            </section>
          )}

          {/* Next Best Actions */}
          <section className="rounded-xl border border-blue-200 bg-blue-50 p-5">
            <h3 className="text-sm font-bold text-blue-700 mb-2 flex items-center gap-1"><Target className="h-4 w-4" />下一步行动</h3>
            {r.actions.map(a => (
              <div key={a.priority} className="flex items-center justify-between py-3 border-b border-blue-100 last:border-0">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center h-7 w-7 rounded-full bg-blue-600 text-white text-xs font-bold">{a.priority}</span>
                  <div><p className="text-sm font-bold">{a.action}</p><p className="text-xs text-gray-500">{a.expectedImpact}</p></div>
                </div>
                {a.route && <button onClick={() => router.push(a.route!)} className="text-xs font-bold text-blue-600 hover:text-blue-700">打开 →</button>}
              </div>
            ))}
          </section>

          {/* Forecast */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1"><TrendingUp className="h-4 w-4" />30天预测</h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="bg-gray-50 rounded-lg p-3"><div className="text-xs text-gray-500">保守</div><div className="font-bold">{r.forecast.conservative.leads} 位潜在客户</div><div className="text-xs text-gray-400">RM {r.forecast.conservative.revenue.toLocaleString()}</div></div>
              <div className="bg-blue-50 rounded-lg p-3"><div className="text-xs text-gray-500">预期</div><div className="font-bold">{r.forecast.expected.leads} 位潜在客户</div><div className="text-xs text-gray-400">RM {r.forecast.expected.revenue.toLocaleString()}</div></div>
              <div className="bg-emerald-50 rounded-lg p-3"><div className="text-xs text-gray-500">乐观</div><div className="font-bold">{r.forecast.optimistic.leads} 位潜在客户</div><div className="text-xs text-gray-400">RM {r.forecast.optimistic.revenue.toLocaleString()}</div></div>
            </div>
          </section>

          {/* Agent + Automation Recommendations */}
          <div className="grid gap-4 sm:grid-cols-2">
            {r.agentRecommendations.length > 0 && (
              <section className="rounded-xl border border-purple-200 bg-purple-50 p-5">
                <h3 className="text-sm font-bold text-purple-700 mb-2 flex items-center gap-1"><Brain className="h-4 w-4" />推荐 AI 工作团队</h3>
                {r.agentRecommendations.map(a => <p key={a} className="text-sm mb-1">🤖 {a}</p>)}
                <button onClick={() => router.push('/ai-workforce')} className="mt-2 text-xs font-bold text-purple-600 hover:text-purple-700">启动AI工作团队 →</button>
              </section>
            )}
            {r.automationRecommendations.length > 0 && (
              <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
                <h3 className="text-sm font-bold text-amber-700 mb-2 flex items-center gap-1"><Rocket className="h-4 w-4" />推荐自动化</h3>
                {r.automationRecommendations.map(a => <p key={a} className="text-sm mb-1">⚡ {a}</p>)}
                <button onClick={() => router.push('/automation')} className="mt-2 text-xs font-bold text-amber-600 hover:text-amber-700">启用自动化 →</button>
              </section>
            )}
          </div>
        </>
      )}
    </div>
  );
}
