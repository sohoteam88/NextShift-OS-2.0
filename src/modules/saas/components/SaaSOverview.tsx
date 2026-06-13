'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Check, CreditCard, Lock, Loader2, TrendingUp, Zap } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { Subscription, UpgradeRecommendation } from '../types';
import { PLANS } from '../planDefinitions';

function useSaaS() { return useQuery({ queryKey: ['saas'], queryFn: async () => { const r = await fetch('/api/v1/saas'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: { subscription: Subscription; recommendations: UpgradeRecommendation[] } }>; }, staleTime: 60_000 }); }

export function SaaSOverview() {
  const router = useRouter(); const q = useSaaS();
  const d = q.data?.data; const sub = d?.subscription; const recs = d?.recommendations ?? [];
  const plan = sub ? PLANS[sub.plan] : null;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-purple-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">订阅 & 计划</h1><p className="text-xs text-gray-500">了解你的计划、用量和升级选项。</p></div></div>

      {sub && plan && (
        <>
          {/* Current Plan */}
          <section className="rounded-xl border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-white p-6">
            <div className="flex items-center justify-between"><h2 className="text-lg font-bold">当前计划: {plan.name}</h2><span className="rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">{sub.status}</span></div>
            <p className="text-sm text-gray-500 mt-1">{plan.recommendedFor}</p>
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[{k:'AI额度',v:`${sub.aiCreditsUsed}/${sub.aiCreditsLimit}`},{k:'视频',v:`${sub.videosUsed}/${plan.limits.videosPerMonth}`},{k:'Funnel',v:`${sub.funnelsUsed}/${plan.limits.funnels}`},{k:'Leads',v:`${sub.leadsUsed}/${plan.limits.leads}`},{k:'席位',v:`${sub.seatsUsed}/${sub.seatsLimit}`}].map(m => <div key={m.k} className="bg-white rounded-lg border p-2 text-center"><div className="text-gray-400">{m.k}</div><div className="font-bold">{m.v}</div></div>)}
            </div>
          </section>

          {/* Upgrade Recommendations */}
          {recs.length > 0 && (
            <section className="rounded-xl border border-amber-200 bg-amber-50 p-5">
              <h3 className="text-sm font-bold text-amber-700 mb-2">💡 升级建议</h3>
              {recs.map(r => <div key={r.id} className="mb-2 p-3 bg-white rounded-lg"><p className="text-sm font-bold">{r.reason}</p><p className="text-xs text-amber-700">👉 升级到{PLANS[r.targetPlan]?.name}: {r.benefit}</p></div>)}
            </section>
          )}

          {/* Plan Comparison */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold mb-4">📊 计划对比</h3>
            <div className="grid gap-4 sm:grid-cols-4">
              {Object.values(PLANS).map(p => {
                const isCurrent = p.id === sub.plan;
                return (
                  <div key={p.id} className={cn('rounded-xl border p-4 text-center', isCurrent ? 'border-purple-400 bg-purple-50 ring-2 ring-purple-200' : 'border-gray-200')}>
                    <div className="text-lg font-bold">{p.name}</div>
                    <div className="text-sm text-purple-600 font-bold mt-1">{p.priceLabel}</div>
                    <div className="mt-2 space-y-1 text-xs text-left">
                      <div className="text-gray-500">{p.targetUser}</div>
                      <div>🤖 {p.limits.aiCredits} AI credits</div>
                      <div>🎬 {p.limits.videosPerMonth} 视频/月</div>
                      <div>🚀 {p.limits.funnels} funnels</div>
                      <div>👥 {p.limits.leads} leads</div>
                      <div>💺 {p.limits.seats} 席位</div>
                    </div>
                    {isCurrent ? <span className="mt-3 inline-block rounded-full bg-purple-100 px-3 py-1 text-xs font-bold text-purple-700">当前计划</span> :
                     <button onClick={() => router.push('/saas')} className="mt-3 inline-block rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-bold text-white hover:bg-purple-700">升级</button>}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Billing Placeholder */}
          <section className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-5 text-center">
            <CreditCard className="h-6 w-6 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">支付网关即将上线。</p>
            <p className="text-xs text-gray-400">目前所有计划通过管理员手动调整。</p>
          </section>
        </>
      )}
    </div>
  );
}
