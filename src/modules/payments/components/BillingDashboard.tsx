'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CreditCard, Loader2, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/cn';
import { PLAN_PRICES, formatPrice } from '../billingPlanMapper';
import type { PaymentRecord, BillingCycle } from '../types';

function useBilling() { return useQuery({ queryKey: ['billing'], queryFn: async () => { const r = await fetch('/api/v1/saas'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: { subscription: any } }>; }, staleTime: 60_000 }); }
function useCheckout() { return useMutation({ mutationFn: async (opts: { planId: string; billingCycle: BillingCycle }) => { const r = await fetch('/api/payments/billplz/checkout', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) }); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: { checkoutUrl: string } }>; } }); }

export function BillingDashboard() {
  const router = useRouter(); const q = useBilling(); const checkout = useCheckout();
  const sub = q.data?.data?.subscription; const [cycle, setCycle] = React.useState<BillingCycle>('monthly');

  function handleUpgrade(planId: string) {
    checkout.mutate({ planId, billingCycle: cycle }, { onSuccess: (data) => { window.open(data.data.checkoutUrl, '_blank'); } });
  }

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">Billing & Plans</h1><p className="text-xs text-gray-500">管理你的订阅和付款。</p></div></div>

      {sub && (
        <section className="rounded-xl border-2 border-blue-200 bg-blue-50 p-5">
          <div className="flex items-center justify-between"><h2 className="text-lg font-bold">当前计划: {sub.plan}</h2><span className={cn('rounded-full px-3 py-1 text-xs font-bold', sub.status === 'active' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700')}>{sub.status}</span></div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-white rounded-lg p-2"><div className="text-gray-400">AI额度</div><div className="font-bold">{sub.aiCreditsUsed}/{sub.aiCreditsLimit}</div></div>
            <div className="bg-white rounded-lg p-2"><div className="text-gray-400">Leads</div><div className="font-bold">{sub.leadsUsed}/{sub.leadsLimit}</div></div>
            <div className="bg-white rounded-lg p-2"><div className="text-gray-400">席位</div><div className="font-bold">{sub.seatsUsed}/{sub.seatsLimit}</div></div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <div className="flex items-center justify-between mb-4"><h3 className="text-sm font-bold">选择计划</h3><div className="flex gap-1">{(['monthly','yearly'] as BillingCycle[]).map(c => <button key={c} onClick={() => setCycle(c)} className={cn('text-xs rounded-lg px-3 py-1', cycle===c?'bg-blue-600 text-white':'bg-gray-100')}>{c==='monthly'?'月付':'年付'}</button>)}</div></div>
        <div className="grid gap-4 sm:grid-cols-3">
          {['starter','pro','agency'].map(id => {
            const price = PLAN_PRICES.find(p => p.planId === id && p.billingCycle === cycle && p.provider === 'billplz');
            if (!price) return null;
            const isCurrent = sub?.plan === id;
            return (
              <div key={id} className={cn('rounded-xl border p-4 text-center', isCurrent ? 'border-blue-400 bg-blue-50 ring-2 ring-blue-200' : 'border-gray-200')}>
                <div className="text-lg font-bold capitalize">{id}</div>
                <div className="text-2xl font-bold mt-2">{formatPrice(price)}<span className="text-sm text-gray-400">/{cycle==='monthly'?'月':'年'}</span></div>
                {isCurrent ? <span className="mt-3 inline-block rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">当前计划</span> :
                 <button onClick={() => handleUpgrade(id)} disabled={checkout.isPending} className="mt-3 inline-flex items-center gap-1 rounded-lg bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50">
                   {checkout.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <CreditCard className="h-3 w-3" />}升级
                 </button>
                }
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
