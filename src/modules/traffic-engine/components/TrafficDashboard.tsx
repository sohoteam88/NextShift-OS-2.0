'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Loader2, Rocket, Sparkles, Target } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TrafficGoal, TrafficPlatform, BudgetTier, TrafficPackage } from '../types';
import { TRAFFIC_GOALS } from '../types';
import { getTrafficAdvisorTips } from '../trafficAdvisor';

function useTraffic() { return useQuery({ queryKey: ['traffic-engine'], queryFn: async () => { const r = await fetch('/api/v1/traffic-engine'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: TrafficPackage | null }>; }, staleTime: 30_000 }); }
function useGenerate() { const qc = useQueryClient(); return useMutation({ mutationFn: async (opts: { goal: TrafficGoal; platform: TrafficPlatform; budget: BudgetTier }) => { const r = await fetch('/api/v1/traffic-engine/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) }); if (!r.ok) throw new Error('Failed'); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['traffic-engine'] }) }); }

function statusLabel(level: TrafficPackage['readiness']['level']) {
  if (level === 'high') return '可以小额测试';
  if (level === 'medium') return '接近就绪';
  return '先补齐承接';
}

function readinessState(value: number) {
  if (value >= 70) return { label: '已准备', tone: 'text-emerald-700 bg-emerald-50 border-emerald-100' };
  if (value >= 40) return { label: '可优化', tone: 'text-amber-700 bg-amber-50 border-amber-100' };
  return { label: '需补齐', tone: 'text-red-700 bg-red-50 border-red-100' };
}

function kpiLabel(kpi: string) {
  return kpi
    .replace('Cost Per Lead (CPL)', '每位潜在客户成本')
    .replace('Cost Per Registration', '每位报名成本')
    .replace('Cost Per Conversation', '每段对话成本')
    .replace('Cost Per Booking', '每次预约成本')
    .replace('Cost Per Follower', '每位关注成本');
}

function budgetLabel(tier: BudgetTier) {
  if (tier === 'scale') return '放大预算';
  if (tier === 'growth') return '增长预算';
  return '测试预算';
}

function riskLabel(risk: TrafficPackage['budget']['riskLevel']) {
  if (risk === 'high') return '高';
  if (risk === 'medium') return '中';
  return '低';
}

export function TrafficDashboard() {
  const router = useRouter(); const q = useTraffic(); const gen = useGenerate();
  const pkg = q.data?.data ?? null;
  const [goal, setGoal] = React.useState<TrafficGoal>('lead_generation');
  const [platform, setPlatform] = React.useState<TrafficPlatform>('facebook');
  const [budget, setBudget] = React.useState<BudgetTier>('starter');
  const tips = pkg ? getTrafficAdvisorTips(pkg.readiness) : [];
  const readinessItems = pkg ? [
    { k: '漏斗页面', v: pkg.readiness.funnelReady },
    { k: '着陆页', v: pkg.readiness.landingPageReady },
    { k: 'CTA', v: pkg.readiness.ctaReady },
    { k: '引流资源', v: pkg.readiness.leadMagnetReady },
    { k: '跟进系统', v: pkg.readiness.whatsappReady },
    { k: '内容素材', v: pkg.readiness.contentAssetsReady },
    { k: '追踪设置', v: pkg.readiness.trackingReady },
    { k: '感谢页', v: pkg.readiness.thankYouReady },
  ] : [];

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">流量行动中心</h1><p className="text-xs text-gray-500">先确认漏斗、内容和追踪，再启动流量测试。</p></div></div>
        {pkg && <div className={cn('rounded-full px-3 py-1.5 text-xs font-bold', pkg.readiness.level === 'high' ? 'bg-emerald-100 text-emerald-700' : pkg.readiness.level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>{statusLabel(pkg.readiness.level)}</div>}
      </div>

      {!pkg && (
        <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-8 text-center">
          <Rocket className="h-8 w-8 text-blue-500 mx-auto mb-3" /><h2 className="text-lg font-bold mb-4">准备你的流量策略</h2>
          <div className="space-y-3 mb-4">
            <div><label className="text-xs font-bold block mb-1">目标</label>
              <div className="flex flex-wrap gap-2">{Object.entries(TRAFFIC_GOALS).map(([k,v]) => <button key={k} onClick={() => setGoal(k as TrafficGoal)} className={cn('rounded-lg px-3 py-2 text-xs text-left', goal===k?'bg-blue-600 text-white':'bg-white border')}><div className="font-bold">{v.objective}</div><div className="opacity-70">{kpiLabel(v.expectedKpi)}</div></button>)}</div>
            </div>
            <div><label className="text-xs font-bold block mb-1">平台</label>
              <div className="flex gap-2">{(['facebook','instagram','tiktok','xhs'] as TrafficPlatform[]).map(p => <button key={p} onClick={() => setPlatform(p)} className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold', platform===p?'bg-blue-600 text-white':'bg-gray-100')}>{p}</button>)}</div>
            </div>
            <div><label className="text-xs font-bold block mb-1">预算</label>
              <div className="flex gap-2">{(['starter','growth','scale'] as BudgetTier[]).map(b => <button key={b} onClick={() => setBudget(b)} className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold', budget===b?'bg-blue-600 text-white':'bg-gray-100')}>{budgetLabel(b)}</button>)}</div>
            </div>
          </div>
          <button onClick={() => gen.mutate({ goal, platform, budget })} disabled={gen.isPending} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}生成流量策略</button>
        </div>
      )}

      {pkg && (
        <>
          <S title="📊 启动前检查">
            <div className="grid grid-cols-4 gap-2 text-xs">
              {readinessItems.map(d => {
                const state = readinessState(d.v);
                return <div key={d.k} className={cn('rounded border p-2 text-center', state.tone)}><div className="font-bold">{d.k}</div><div>{state.label}</div></div>;
              })}
            </div>
            {tips.map((t,i) => <p key={i} className="text-xs text-amber-700 mt-2">💡 {t}</p>)}
          </S>

          {/* Campaign cards per platform */}
          {pkg.facebook && <S title="📘 Facebook 广告"><p className="text-sm"><strong>广告名称:</strong> {pkg.facebook.campaignName}</p><p className="text-sm"><strong>受众:</strong> {pkg.facebook.audience}</p><p className="text-sm"><strong>文案:</strong> {pkg.facebook.primaryText}</p><p className="text-sm"><strong>CTA:</strong> {pkg.facebook.cta}</p><p className="text-xs text-gray-500"><strong>标题:</strong> {pkg.facebook.headlines.join(' | ')}</p></S>}
          {pkg.instagram && <S title="📸 Instagram 广告"><p className="text-sm"><strong>Reel:</strong> {pkg.instagram.reelConcept}</p><p className="text-sm"><strong>Story:</strong> {pkg.instagram.storyConcept}</p><p className="text-sm"><strong>Carousel:</strong> {pkg.instagram.carouselConcept}</p></S>}
          {pkg.tiktok && <S title="🎵 TikTok 广告"><p className="text-sm"><strong>开场 Hook:</strong> {pkg.tiktok.hook}</p><p className="text-sm"><strong>开场画面:</strong> {pkg.tiktok.openingScene}</p><p className="text-sm"><strong>留存策略:</strong> {pkg.tiktok.retentionStrategy}</p></S>}
          {pkg.xhs && <S title="📕 小红书内容"><p className="text-sm"><strong>内容角度:</strong> {pkg.xhs.contentAngle}</p><p className="text-sm"><strong>关键词:</strong> {pkg.xhs.keywordDirection}</p><p className="text-sm"><strong>标题:</strong> {pkg.xhs.titles.join(' | ')}</p></S>}

          <S title="💰 预算"><p className="text-sm"><strong>{budgetLabel(pkg.budget.tier)}:</strong> {pkg.budget.dailyBudget} → {pkg.budget.monthlyBudget}</p><p className="text-sm"><strong>预计:</strong> {pkg.budget.expectedLeads.replaceAll('leads', '位潜在客户')}</p><p className="text-sm"><strong>风险:</strong> {riskLabel(pkg.budget.riskLevel)}</p></S>

          <S title="✅ 启动检查清单">
            {pkg.checklist.map(item => <div key={item.id} className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gray-300" /> {item.label}</div>)}
          </S>

          <S title="📈 追踪设置">
            <div className="grid grid-cols-3 gap-2 text-xs">
              {Object.entries(pkg.analyticsConfig).map(([k,v]) => <div key={k} className="bg-gray-50 rounded p-2"><div className="font-bold text-gray-400">{k}</div><div>{v}</div></div>)}
            </div>
          </S>
        </>
      )}
    </div>
  );
}
function S({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-3">{title}</h3>{children}</section>; }
