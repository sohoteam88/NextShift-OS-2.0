'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, BarChart3, DollarSign, Loader2, Rocket, Sparkles, Target, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { TrafficGoal, TrafficPlatform, BudgetTier, TrafficPackage } from '../types';
import { TRAFFIC_GOALS } from '../types';
import { getTrafficAdvisorTips } from '../trafficAdvisor';

function useTraffic() { return useQuery({ queryKey: ['traffic-engine'], queryFn: async () => { const r = await fetch('/api/v1/traffic-engine'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: TrafficPackage | null }>; }, staleTime: 30_000 }); }
function useGenerate() { const qc = useQueryClient(); return useMutation({ mutationFn: async (opts: { goal: TrafficGoal; platform: TrafficPlatform; budget: BudgetTier }) => { const r = await fetch('/api/v1/traffic-engine/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) }); if (!r.ok) throw new Error('Failed'); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['traffic-engine'] }) }); }

export function TrafficDashboard() {
  const router = useRouter(); const q = useTraffic(); const gen = useGenerate();
  const pkg = q.data?.data ?? null;
  const [goal, setGoal] = React.useState<TrafficGoal>('lead_generation');
  const [platform, setPlatform] = React.useState<TrafficPlatform>('facebook');
  const [budget, setBudget] = React.useState<BudgetTier>('starter');
  const tips = pkg ? getTrafficAdvisorTips(pkg.readiness) : [];

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">Traffic Engine</h1><p className="text-xs text-gray-500">规划和准备你的流量获取策略。</p></div></div>
        {pkg && <div className={cn('rounded-full px-3 py-1.5 text-xs font-bold', pkg.readiness.level === 'high' ? 'bg-emerald-100 text-emerald-700' : pkg.readiness.level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}><Trophy className="inline h-3 w-3 mr-1" />{pkg.readiness.score}%</div>}
      </div>

      {!pkg && (
        <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-8 text-center">
          <Rocket className="h-8 w-8 text-blue-500 mx-auto mb-3" /><h2 className="text-lg font-bold mb-4">准备你的流量策略</h2>
          <div className="space-y-3 mb-4">
            <div><label className="text-xs font-bold block mb-1">目标</label>
              <div className="flex flex-wrap gap-2">{Object.entries(TRAFFIC_GOALS).map(([k,v]) => <button key={k} onClick={() => setGoal(k as TrafficGoal)} className={cn('rounded-lg px-3 py-2 text-xs text-left', goal===k?'bg-blue-600 text-white':'bg-white border')}><div className="font-bold">{v.objective}</div><div className="opacity-70">{v.expectedKpi}</div></button>)}</div>
            </div>
            <div><label className="text-xs font-bold block mb-1">平台</label>
              <div className="flex gap-2">{(['facebook','instagram','tiktok','xhs'] as TrafficPlatform[]).map(p => <button key={p} onClick={() => setPlatform(p)} className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold', platform===p?'bg-blue-600 text-white':'bg-gray-100')}>{p}</button>)}</div>
            </div>
            <div><label className="text-xs font-bold block mb-1">预算</label>
              <div className="flex gap-2">{(['starter','growth','scale'] as BudgetTier[]).map(b => <button key={b} onClick={() => setBudget(b)} className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold', budget===b?'bg-blue-600 text-white':'bg-gray-100')}>{b}</button>)}</div>
            </div>
          </div>
          <button onClick={() => gen.mutate({ goal, platform, budget })} disabled={gen.isPending} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}生成流量策略</button>
        </div>
      )}

      {pkg && (
        <>
          <S title="📊 流量就绪度">
            <div className="grid grid-cols-4 gap-2 text-xs">
              {[{k:'漏斗',v:pkg.readiness.funnelReady},{k:'着陆页',v:pkg.readiness.landingPageReady},{k:'CTA',v:pkg.readiness.ctaReady},{k:'LeadMagnet',v:pkg.readiness.leadMagnetReady},{k:'WhatsApp',v:pkg.readiness.whatsappReady},{k:'内容',v:pkg.readiness.contentAssetsReady},{k:'追踪',v:pkg.readiness.trackingReady},{k:'感谢页',v:pkg.readiness.thankYouReady}].map(d => <div key={d.k} className="bg-gray-50 rounded p-2 text-center"><div className="font-bold">{d.k}</div><div className={d.v>=70?'text-emerald-600':d.v>=40?'text-amber-600':'text-red-500'}>{d.v}%</div></div>)}
            </div>
            {tips.map((t,i) => <p key={i} className="text-xs text-amber-700 mt-2">💡 {t}</p>)}
          </S>

          {/* Campaign cards per platform */}
          {pkg.facebook && <S title="📘 Facebook 广告"><p className="text-sm"><strong>Campaign:</strong> {pkg.facebook.campaignName}</p><p className="text-sm"><strong>Audience:</strong> {pkg.facebook.audience}</p><p className="text-sm"><strong>Text:</strong> {pkg.facebook.primaryText}</p><p className="text-sm"><strong>CTA:</strong> {pkg.facebook.cta}</p><p className="text-xs text-gray-500"><strong>Headlines:</strong> {pkg.facebook.headlines.join(' | ')}</p></S>}
          {pkg.instagram && <S title="📸 Instagram 广告"><p className="text-sm"><strong>Reel:</strong> {pkg.instagram.reelConcept}</p><p className="text-sm"><strong>Story:</strong> {pkg.instagram.storyConcept}</p><p className="text-sm"><strong>Carousel:</strong> {pkg.instagram.carouselConcept}</p></S>}
          {pkg.tiktok && <S title="🎵 TikTok 广告"><p className="text-sm"><strong>Hook:</strong> {pkg.tiktok.hook}</p><p className="text-sm"><strong>Opening:</strong> {pkg.tiktok.openingScene}</p><p className="text-sm"><strong>Retention:</strong> {pkg.tiktok.retentionStrategy}</p></S>}
          {pkg.xhs && <S title="📕 XHS Campaign"><p className="text-sm"><strong>Content:</strong> {pkg.xhs.contentAngle}</p><p className="text-sm"><strong>Keywords:</strong> {pkg.xhs.keywordDirection}</p><p className="text-sm"><strong>Titles:</strong> {pkg.xhs.titles.join(' | ')}</p></S>}

          <S title="💰 预算"><p className="text-sm"><strong>{pkg.budget.tier}:</strong> {pkg.budget.dailyBudget} → {pkg.budget.monthlyBudget}</p><p className="text-sm"><strong>预计:</strong> {pkg.budget.expectedLeads}</p><p className="text-sm"><strong>风险:</strong> {pkg.budget.riskLevel}</p></S>

          <S title="✅ 启动检查清单">
            {pkg.checklist.map(item => <div key={item.id} className="text-sm flex items-center gap-2"><span className="text-gray-300">☐</span> {item.label}</div>)}
          </S>

          <S title="📈 分析框架">
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
