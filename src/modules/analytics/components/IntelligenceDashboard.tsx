'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, ArrowUp, ArrowDown, Lightbulb, Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { AIInsight, AnalyticsCenter } from '../businessTypes';

function useIntel() { return useQuery({ queryKey: ['analytics-center'], queryFn: async () => { const r = await fetch('/api/v1/analytics-center'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: AnalyticsCenter }>; }, staleTime: 60_000 }); }

function healthLabel(level: AnalyticsCenter['health']['level']) {
  if (level === 'high') return '状态稳定';
  if (level === 'medium') return '正在建立';
  return '需要行动';
}

function healthTone(level: AnalyticsCenter['health']['level']) {
  if (level === 'high') return 'bg-emerald-100 text-emerald-700';
  if (level === 'medium') return 'bg-amber-100 text-amber-700';
  return 'bg-red-100 text-red-700';
}

function areaState(value: number) {
  if (value >= 70) return { label: '稳定', tone: 'text-emerald-700 bg-emerald-50' };
  if (value >= 40) return { label: '可优化', tone: 'text-amber-700 bg-amber-50' };
  return { label: '需补齐', tone: 'text-red-700 bg-red-50' };
}

function benchmarkLabel(level: AnalyticsCenter['benchmark']['level']) {
  if (level === 'scale') return '放大阶段';
  if (level === 'growth') return '增长阶段';
  return '起步阶段';
}

function friendlyInsight(insight: AIInsight) {
  if (insight.id.includes('business-state')) return '当前业务基础还需要补齐，先处理最影响转化的缺口。';
  if (insight.id.includes('journey')) return 'Journey 还在早期阶段，继续完成当前系统建议的动作。';
  if (insight.id.includes('growth')) return '增长循环正在建立，重点是持续完成内容、漏斗和跟进动作。';
  return insight.insight;
}

function friendlyAction(insight: AIInsight) {
  if (insight.action.includes('Resolve')) return '打开 Journey，处理最高优先级任务。';
  if (insight.action.includes('Maintain')) return '保持当前节奏，继续完成下一步。';
  if (insight.action.includes('Review')) return '查看增长建议，选择一个今天能完成的动作。';
  return insight.action;
}

function benchmarkRequirementLabel(requirement: string) {
  if (requirement.includes('Readiness')) return requirement.replace('Readiness', '业务基础');
  if (requirement.includes('Progress')) return requirement.replace('Progress', 'Journey 进度');
  if (requirement.includes('Growth')) return requirement.replace('Growth', '增长循环');
  return requirement;
}

function platformLabel(platform: string) {
  if (platform === 'facebook') return 'Facebook';
  if (platform === 'instagram') return 'Instagram';
  if (platform === 'tiktok') return 'TikTok';
  if (platform === 'xhs') return '小红书';
  return platform;
}

export function IntelligenceDashboard() {
  const router = useRouter(); const q = useIntel();
  const ac = q.data?.data;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
  if (q.isError) {
    return (
      <div className="mx-auto max-w-4xl space-y-4 pb-12">
        <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">洞察中心</h1><p className="text-xs text-gray-500">暂时无法读取业务洞察。</p></div></div>
        <section className="rounded-xl border border-red-200 bg-red-50 p-5">
          <h2 className="text-sm font-bold text-red-900">洞察暂时不可用</h2>
          <p className="mt-1 text-sm text-red-800">你可以先回到 Dashboard 或 Journey 继续执行当前任务。</p>
          <button onClick={() => q.refetch()} className="mt-3 rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700">重试</button>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">洞察中心</h1><p className="text-xs text-gray-500">把数据转成下一步行动，不制造额外压力。</p></div></div>
        {ac && <div className={cn('rounded-full px-3 py-1.5 text-xs font-bold', healthTone(ac.health.level))}>{healthLabel(ac.health.level)}</div>}
      </div>

      {ac && (
        <>
          <S title="📊 业务快照">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
              {[{k:'内容',v:ac.kpi.totalPosts},{k:'视频',v:ac.kpi.totalVideos},{k:'潜在客户',v:ac.kpi.totalLeads},{k:'成交',v:ac.kpi.totalConversions},{k:'收入(RM)',v:ac.kpi.totalRevenue.toLocaleString()},{k:'转化率',v:ac.kpi.conversionRate+'%'},{k:'回复率',v:ac.kpi.leadResponseRate+'%'},{k:'漏斗率',v:ac.funnelMetrics.rate+'%'}].map(d => <div key={d.k} className="bg-blue-50 rounded-lg p-3"><p className="text-xs text-gray-500">{d.k}</p><p className="text-lg font-bold text-blue-700">{d.v}</p></div>)}
            </div>
          </S>

          <S title="🏥 当前状态">
            <p className="mb-4 text-sm text-[var(--color-text-muted)]">
              {ac.actions[0]?.reason ?? '系统会根据你的内容、漏斗、客户和成交数据判断下一步。'}
            </p>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-center text-xs">
              {[{k:'品牌',v:ac.health.brandHealth},{k:'内容',v:ac.health.contentHealth},{k:'流量',v:ac.health.trafficHealth},{k:'漏斗',v:ac.health.funnelHealth},{k:'销售',v:ac.health.salesHealth},{k:'CRM',v:ac.health.crmHealth}].map(d => {
                const state = areaState(d.v);
                return <div key={d.k} className={cn('rounded-lg p-2', state.tone)}><div className="font-bold">{d.k}</div><div className="font-bold">{state.label}</div></div>;
              })}
            </div>
          </S>

          <S title="🧠 AI 建议" className="border-purple-200 bg-gradient-to-br from-purple-50 to-white">
            {ac.insights.map(i => (
              <div key={i.id} className="mb-3 p-3 bg-white rounded-lg border border-purple-100">
                <div className="flex items-start gap-2"><Lightbulb className="h-4 w-4 text-purple-600 mt-0.5 shrink-0" /><p className="text-sm font-bold text-purple-900">{friendlyInsight(i)}</p></div>
                <p className="text-xs text-purple-700 mt-1 ml-6">👉 {friendlyAction(i)}</p>
                <span className={cn('ml-6 inline-block text-xs rounded-full px-2 py-0.5 mt-1', i.impact==='high'?'bg-red-100 text-red-700':'bg-amber-100 text-amber-700')}>{i.impact === 'high' ? '高优先级' : '中优先级'}</span>
              </div>
            ))}
          </S>

          <S title="🎯 下一步行动">
            {ac.actions.map((a,i) => (
              <div key={a.id} className="flex items-center justify-between py-2.5 border-b last:border-0">
                <div className="flex items-center gap-2"><span className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-100 text-xs font-bold text-blue-600">{i+1}</span><div><p className="text-sm font-bold">{a.action}</p><p className="text-xs text-gray-500">{a.reason}</p></div></div>
                <span className="text-xs text-emerald-600 font-medium">建议执行</span>
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

          <S title="📈 增长阶段">
            <div className="flex items-center gap-4">
              <div className={cn('rounded-full px-4 py-2 text-sm font-bold', ac.benchmark.level==='scale'?'bg-purple-100 text-purple-700':ac.benchmark.level==='growth'?'bg-blue-100 text-blue-700':'bg-gray-100 text-gray-700')}>
                {benchmarkLabel(ac.benchmark.level)}
              </div>
              <div className="flex-1">
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${ac.benchmark.progress}%` }} /></div>
                <p className="text-xs text-gray-500 mt-1">当前阶段完成度 {ac.benchmark.progress}%</p>
              </div>
            </div>
            <div className="mt-3 space-y-1">
              {ac.benchmark.requirements.map((r,i) => <p key={i} className="text-xs text-gray-500">✓ {benchmarkRequirementLabel(r)}</p>)}
            </div>
          </S>

          {/* Content breakdown */}
          <S title="📱 内容分布">
            <div className="flex flex-wrap gap-2">
              {Object.entries(ac.contentBreakdown).map(([platform, count]) => <span key={platform} className="rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold">{platformLabel(platform)}: {count}</span>)}
            </div>
          </S>
        </>
      )}
    </div>
  );
}
function S({ title, children, className }: { title: string; children: React.ReactNode; className?: string }) { return <section className={cn('rounded-xl border border-[var(--color-border)] bg-white p-5', className)}><h3 className="text-sm font-bold mb-3">{title}</h3>{children}</section>; }
