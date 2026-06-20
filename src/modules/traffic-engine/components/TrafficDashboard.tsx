'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Rocket, Sparkles, Target } from 'lucide-react';
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

function checklistLabel(label: string) {
  const lower = label.toLowerCase();
  if (lower === 'funnel' || lower.includes('funnel')) return '确认漏斗页面已经可以收集客户资料';
  if (lower === 'lead_magnet' || lower.includes('lead magnet') || lower.includes('lead_magnet')) return '准备一个可以吸引客户留下资料的资源';
  if (lower.includes('traffic acquisition')) return '先完成流量来源设置，再启动广告测试';
  if (lower.includes('success criteria')) return '目标是先获得第一位潜在客户';
  if (lower.includes('tracking')) return '确认追踪参数已经设置';
  return label;
}

function trackingLabel(key: string) {
  const lower = key.toLowerCase();
  if (lower.includes('utm')) return 'UTM';
  if (lower.includes('pixel')) return '像素';
  if (lower.includes('conversion')) return '转化事件';
  return null;
}

export function TrafficDashboard() {
  const router = useRouter(); const q = useTraffic(); const gen = useGenerate();
  const pkg = q.data?.data ?? null;
  const [goal, setGoal] = React.useState<TrafficGoal>('lead_generation');
  const [platform, setPlatform] = React.useState<TrafficPlatform>('facebook');
  const [budget, setBudget] = React.useState<BudgetTier>('starter');
  const tips = pkg ? getTrafficAdvisorTips(pkg.readiness) : [];
  const trackingEntries = pkg ? Object.entries(pkg.analyticsConfig)
    .map(([key, value]) => ({ label: trackingLabel(key), value }))
    .filter((entry): entry is { label: string; value: string } => Boolean(entry.label)) : [];
  const blockedByFoundation = Boolean(pkg && (pkg.readiness.funnelReady < 50 || pkg.readiness.leadMagnetReady < 50));
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
        <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">流量测试中心</h1><p className="text-xs text-gray-500">这里是后续测试步骤；先用品牌资料生成承接页和引流资源。</p></div></div>
        {pkg && <div className={cn('rounded-full px-3 py-1.5 text-xs font-bold', pkg.readiness.level === 'high' ? 'bg-emerald-100 text-emerald-700' : pkg.readiness.level === 'medium' ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700')}>{statusLabel(pkg.readiness.level)}</div>}
      </div>

      {blockedByFoundation && (
        <section className="rounded-xl border border-blue-100 bg-blue-50 p-5">
          <div className="flex items-start gap-3">
            <div className="rounded-lg bg-white p-2 text-blue-600">
              <Target className="h-5 w-5" />
            </div>
            <div className="space-y-3">
              <div>
                <h2 className="text-base font-bold text-gray-950">这里还不是第一步</h2>
                <p className="mt-1 text-sm text-gray-600">
                  流量测试中心负责在承接页完成后生成测试渠道、预算和追踪设置。现在系统还缺少可接住客户的漏斗页面或引流资源，所以不建议直接启动广告。
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="rounded-lg border border-white bg-white p-3">
                  <div className="text-xs font-bold text-gray-500">先完成</div>
                  <div className="mt-1 text-sm font-semibold text-gray-950">根据品牌资料生成漏斗页面</div>
                </div>
                <div className="rounded-lg border border-white bg-white p-3">
                  <div className="text-xs font-bold text-gray-500">再完成</div>
                  <div className="mt-1 text-sm font-semibold text-gray-950">准备一个可领取的引流资源</div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => router.push('/funnel')} className="inline-flex h-10 items-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-bold text-white hover:bg-blue-700">
                  生成漏斗页面 <ArrowRight className="h-4 w-4" />
                </button>
                <button onClick={() => router.push('/lead-magnet')} className="inline-flex h-10 items-center gap-2 rounded-lg border border-blue-200 bg-white px-4 text-sm font-bold text-blue-700 hover:bg-blue-50">
                  创建引流资源
                </button>
              </div>
            </div>
          </div>
        </section>
      )}

      {!pkg && (
        <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-8 text-center">
          <Rocket className="h-8 w-8 text-blue-500 mx-auto mb-3" /><h2 className="text-lg font-bold mb-2">生成流量测试计划</h2>
          <p className="mx-auto mb-4 max-w-xl text-sm text-gray-600">系统会读取你的品牌资料、漏斗页面、引流资源和内容资产，生成小预算测试建议。</p>
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

      {pkg && !blockedByFoundation && (
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
            {pkg.checklist.map(item => <div key={item.id} className="text-sm flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gray-300" /> {checklistLabel(item.label)}</div>)}
          </S>

          <S title="📈 追踪设置">
            {trackingEntries.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 text-xs">
                {trackingEntries.map((entry) => <div key={entry.label} className="bg-gray-50 rounded p-2"><div className="font-bold text-gray-400">{entry.label}</div><div>{entry.value}</div></div>)}
              </div>
            ) : (
              <p className="text-sm text-gray-500">先完成漏斗页面和追踪设置，系统会在这里显示广告成效指标。</p>
            )}
          </S>
        </>
      )}
    </div>
  );
}
function S({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-3">{title}</h3>{children}</section>; }
