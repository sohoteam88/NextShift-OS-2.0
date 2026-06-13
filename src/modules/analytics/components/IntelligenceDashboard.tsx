'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUp, ArrowDown, BarChart3, Brain, Lightbulb, Loader2, Target, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AnalyticsCenter } from '../businessTypes';

function useIntel() { return useQuery({ queryKey: ['analytics-center'], queryFn: async () => { const r = await fetch('/api/v1/analytics-center'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: AnalyticsCenter }>; }, staleTime: 60_000 }); }

export function IntelligenceDashboard() {
  const router = useRouter(); const q = useIntel();
  const ac = q.data?.data;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">Analytics Intelligence Center</h1><p className="text-xs text-gray-500">不是数据看板，是决策引擎。</p></div></div>
        {ac && <div className={cn('rounded-full px-3 py-1.5 text-xs font-bold', ac.health.level==='high'?'bg-emerald-100 text-emerald-700':ac.health.level==='medium'?'bg-amber-100 text-amber-700':'bg-red-100 text-red-700')}>Business Health: {ac.health.overallScore}%</div>}
      </div>

      {ac && (
        <>
          {/* Health Score */}
          <S title="🏥 Business Health Score">
            <div className="flex items-center justify-center mb-4">
              <div className={cn('text-4xl font-bold', ac.health.overallScore>=70?'text-emerald-600':ac.health.overallScore>=40?'text-amber-600':'text-red-500')}>{ac.health.overallScore}<span className="text-xl text-gray-400">/100</span></div>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              {[{k:'品牌',v:ac.health.brandHealth},{k:'内容',v:ac.health.contentHealth},{k:'流量',v:ac.health.trafficHealth},{k:'漏斗',v:ac.health.funnelHealth},{k:'销售',v:ac.health.salesHealth},{k:'CRM',v:ac.health.crmHealth}].map(d => <div key={d.k} className="bg-gray-50 rounded-lg p-2"><div className="font-bold text-gray-500">{d.k}</div><div className={cn('font-bold',d.v>=70?'text-emerald-600':d.v>=40?'text-amber-600':'text-red-500')}>{d.v}%</div></div>)}
            </div>
            {ac.health.recommendations.map((r,i) => <p key={i} className="text-xs text-amber-700 mt-2">💡 {r}</p>)}
          </S>

          {/* KPI Overview */}
          <S title="📊 KPI 概览">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[{k:'内容',v:ac.kpi.totalPosts},{k:'视频',v:ac.kpi.totalVideos},{k:'Leads',v:ac.kpi.totalLeads},{k:'成交',v:ac.kpi.totalConversions},{k:'收入(RM)',v:ac.kpi.totalRevenue.toLocaleString()},{k:'转化率',v:ac.kpi.conversionRate+'%'},{k:'回复率',v:ac.kpi.leadResponseRate+'%'},{k:'漏斗率',v:ac.funnelMetrics.rate+'%'}].map(d => <div key={d.k} className="bg-blue-50 rounded-lg p-3"><p className="text-xs text-gray-500">{d.k}</p><p className="text-lg font-bold text-blue-700">{d.v}</p></div>)}
            </div>
          </S>

          {/* AI Insights — the key section */}
          <S title="🧠 AI 洞察" className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            {ac.insights.map(i => (
              <div key={i.id} className="mb-3 p-3 bg-white rounded-lg border border-purple-100">
                <div className="flex items-start gap-2"><Brain className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" /><p className="text-sm font-bold text-purple-900">{i.insight}</p></div>
                <p className="text-xs text-purple-700 mt-1 ml-6">👉 {i.action}</p>
                <span className={cn('ml-6 inline-block text-xs rounded-full px-2 py-0.5 mt-1', i.impact==='high'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700')}>{i.impact} impact</span>
              </div>
            ))}
          </S>

          {/* Next Best Actions */}
          <S title="🎯 Next Best Actions">
            {ac.nextActions.map((a,i) => (
              <div key={a.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                <div className="flex items-center gap-2"><span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-xs font-bold text-blue-600">{i+1}</span><div><p className="text-sm font-bold">{a.action}</p><p className="text-xs text-gray-500">{a.reason}</p></div></div>
                <span className="text-xs text-emerald-600 font-medium">{a.impact}</span>
              </div>
            ))}
          </S>

          {/* Anomalies */}
          {ac.anomalies.length > 0 && (
            <S title="⚠️ 异常检测">
              {ac.anomalies.map(a => (
                <div key={a.id} className={cn('flex items-center gap-2 p-3 rounded-lg mb-2', a.severity==='critical'?'bg-red-50 border border-red-200':'bg-amber-50 border border-amber-200')}>
                  {a.direction === 'down' ? <ArrowDown className="h-4 w-4 text-red-500" /> : <ArrowUp className="h-4 w-4 text-emerald-500" />}
                  <div><p className="text-sm font-bold">{a.metric} {a.change}</p><p className="text-xs text-gray-500">{a.alert}</p></div>
                </div>
              ))}
            </S>
          )}

          {/* Benchmark */}
          <S title="📈 成长基准">
            <div className="flex items-center gap-4">
              <div className={cn('rounded-full px-4 py-2 text-sm font-bold', ac.benchmark.level==='scale'?'bg-purple-100 text-purple-700':ac.benchmark.level==='growth'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700')}>
                {ac.benchmark.level === 'scale' ? '🚀 Scale' : ac.benchmark.level === 'growth' ? '📈 Growth' : '🌱 Starter'}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${ac.benchmark.progress}%` }} /></div>
                <p className="text-xs text-gray-500 mt-1">{ac.benchmark.progress}% to next level</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {ac.benchmark.requirements.map((r,i) => <p key={i} className="text-xs text-gray-500">✓ {r}</p>)}
            </div>
          </S>

          {/* Content breakdown */}
          <S title="📱 内容分布">
            <div className="flex flex-wrap gap-2">
              {Object.entries(ac.contentBreakdown).map(([platform, count]) => <span key={platform} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">{platform}: {count}</span>)}
            </div>
          </S>
        </>
      )}
    </div>
  );
}
function S({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) { return <section className={cn('rounded-xl border border-[var(--color-border)] bg-white p-5', className)}><h3 className="text-sm font-bold mb-3">{title}</h3>{children}</section>; }
