'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Layers, Loader2, ShoppingBag, TrendingUp, UserPlus } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FunnelContextMap, FunnelContext } from '../types';

function useFC() { return useQuery({ queryKey: ['funnel-context'], queryFn: async () => { const r = await fetch('/api/v1/funnel-context'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: FunnelContextMap }>; }, staleTime: 60_000 }); }

const FUNNEL_META: Record<string, { icon: any; color: string; label: string }> = {
  retail: { icon: ShoppingBag, color: 'text-emerald-600 bg-emerald-50 border-emerald-200', label: '零售漏斗' },
  recruitment: { icon: UserPlus, color: 'text-blue-600 bg-blue-50 border-blue-200', label: '招募漏斗' },
  upgrade: { icon: TrendingUp, color: 'text-purple-600 bg-purple-50 border-purple-200', label: '升级漏斗' },
};

export function FunnelContextDashboard() {
  const router = useRouter(); const q = useFC();
  const map = q.data?.data;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-4xl space-y-4 pb-12">
      <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">多漏斗管理</h1><p className="text-xs text-gray-500">一个品牌，三个漏斗系统。共享Brand DNA。</p></div></div>

      {map && Object.entries(map).map(([key, ctx]) => {
        if (!ctx) return null;
        const meta = FUNNEL_META[key] ?? FUNNEL_META.retail;
        const Icon = meta.icon;
        return (
          <section key={key} className={cn('rounded-xl border-2 p-5', meta.color)}>
            <div className="flex items-center gap-2 mb-3"><Icon className="h-5 w-5" /><h3 className="text-sm font-bold">{meta.label}</h3></div>
            <div className="grid gap-3 sm:grid-cols-2 text-sm">
              <div><span className="font-semibold">受众:</span> {ctx.audience}</div>
              <div><span className="font-semibold">定位:</span> {ctx.positioning}</div>
              <div><span className="font-semibold">Offer:</span> {ctx.offer}</div>
              <div><span className="font-semibold">CTA:</span> {ctx.cta}</div>
            </div>
            <div className="mt-3">
              <p className="text-xs font-semibold mb-1">痛点:</p>
              <div className="flex flex-wrap gap-1">{ctx.painPoints.map((p: string) => <span key={p} className="text-xs bg-white rounded-full px-2 py-0.5 border">{p}</span>)}</div>
            </div>
            <div className="mt-2">
              <p className="text-xs font-semibold mb-1">内容支柱:</p>
              <div className="flex flex-wrap gap-1">{ctx.contentPillars.map((p: any) => <span key={p.name} className="text-xs bg-white rounded-full px-2 py-0.5 border">{p.emoji} {p.name} {p.percentage}%</span>)}</div>
            </div>
            <div className="mt-2 grid gap-1 text-xs">
              <p><strong>Webinar:</strong> {ctx.webinarTheme}</p>
              <p><strong>Lead Magnet:</strong> {ctx.leadMagnetTheme}</p>
              <p><strong>视频方向:</strong> {ctx.videoTheme}</p>
              <p><strong>销售方式:</strong> {ctx.salesApproach}</p>
            </div>
            <div className="mt-3 pt-2 border-t flex gap-2">
              <button onClick={() => router.push('/content-engine')} className="text-xs font-bold text-blue-600">生成内容 →</button>
              <button onClick={() => router.push('/lead-magnet')} className="text-xs font-bold text-blue-600">创建Lead Magnet →</button>
              <button onClick={() => router.push('/webinar-center')} className="text-xs font-bold text-blue-600">准备Webinar →</button>
            </div>
          </section>
        );
      })}
    </div>
  );
}
