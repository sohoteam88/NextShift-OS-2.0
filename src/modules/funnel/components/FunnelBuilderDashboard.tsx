'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, ChevronDown, ChevronUp, Loader2, Rocket, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { FunnelBuilderType, FunnelPackage } from '../types/funnel-builder';
import { FUNNEL_TYPES } from '../types/funnel-builder';
import { funnelHealthService } from '@/modules/funnel/services/funnel-health-service';

function useFunnel() { return useQuery({ queryKey: ['funnel-builder'], queryFn: async () => { const r = await fetch('/api/v1/funnel-builder'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: FunnelPackage | null }>; }, staleTime: 30_000 }); }
function useGenerate() { const qc = useQueryClient(); return useMutation({ mutationFn: async (funnelType: FunnelBuilderType) => { const r = await fetch('/api/v1/funnel-builder/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ funnelType }) }); if (!r.ok) throw new Error('Failed'); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['funnel-builder'] }) }); }
function isRenderablePackage(pkg: FunnelPackage | null): pkg is FunnelPackage {
  return Boolean(
    pkg?.landingPage &&
    pkg.thankYouPage &&
    pkg.whatsappFlow &&
    Array.isArray(pkg.emailSequence) &&
    Array.isArray(pkg.adAngles) &&
    Array.isArray(pkg.launchPlan),
  );
}

export function FunnelBuilderDashboard() {
  const router = useRouter();
  const q = useFunnel(); const gen = useGenerate();
  const pkg = isRenderablePackage(q.data?.data ?? null) ? q.data?.data ?? null : null;
  const [type, setType] = React.useState<FunnelBuilderType>('lead_magnet');
  const [collapsed, setCollapsed] = React.useState(true);
  const health = pkg ? funnelHealthService.evaluatePackage(pkg) : null;

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">Funnel Builder 2.0</h1><p className="text-xs text-gray-500">把引流磁铁、Webinar、WhatsApp串联成完整成交漏斗。</p></div></div>
        {pkg && <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700"><Trophy className="inline h-3 w-3 mr-1" />{pkg.healthScore}%</div>}
      </div>

      {!pkg && (
        <div className="rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-8 text-center">
          <Rocket className="h-8 w-8 text-blue-500 mx-auto mb-3" />
          <h2 className="text-lg font-bold mb-2">选择漏斗类型</h2>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {(Object.entries(FUNNEL_TYPES) as [FunnelBuilderType, typeof FUNNEL_TYPES[FunnelBuilderType]][]).map(([k, v]) => (
              <button key={k} onClick={() => setType(k)} className={cn('rounded-lg px-4 py-2 text-sm font-semibold text-left', type===k?'bg-blue-600 text-white':'bg-white border text-gray-600 hover:bg-blue-50')}>
                <div className="font-bold">{v.label}</div><div className="text-xs opacity-70">{v.useCase}</div>
              </button>
            ))}
          </div>
          <button onClick={() => gen.mutate(type)} disabled={gen.isPending} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}生成完整漏斗</button>
        </div>
      )}

      {pkg && health && (
        <>
          <S title="📊 漏斗健康度">
            <div className="grid grid-cols-3 gap-2 text-xs">
              {[{k:'受众匹配',v:health.audienceFit},{k:'Offer清晰',v:health.offerClarity},{k:'页面清晰',v:health.pageClarity},{k:'CTA强度',v:health.ctaStrength},{k:'信任元素',v:health.trustElements},{k:'跟进就绪',v:health.followUpReadiness},{k:'流量就绪',v:health.trafficReadiness}].map(d => <div key={d.k} className="bg-gray-50 rounded p-2"><div className="font-bold">{d.k}</div><div className={d.v>=70?'text-emerald-600':d.v>=40?'text-amber-600':'text-red-500'}>{d.v}%</div></div>)}
            </div>
            <p className="text-sm mt-3"><strong>Next Best Action:</strong> {pkg.nextBestAction}</p>
          </S>

          <button onClick={() => setCollapsed(!collapsed)} className="w-full flex items-center justify-between rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 text-sm font-bold">
            📋 完整报告 {collapsed ? <ChevronDown className="h-4 w-4" /> : <ChevronUp className="h-4 w-4" />}
          </button>

          {!collapsed && (
            <>
              <S title="📄 着陆页"><p className="text-lg font-bold">{pkg.landingPage.headline}</p><p className="text-sm text-blue-600">{pkg.landingPage.subheadline}</p><div className="mt-2 inline-block rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-bold">{pkg.landingPage.heroCta}</div><p className="text-sm mt-2"><strong>Problem:</strong> {pkg.landingPage.problem}</p><p className="text-sm"><strong>Solution:</strong> {pkg.landingPage.solution}</p>{pkg.landingPage.benefits.map((b,i)=><p key={i} className="text-sm">{b}</p>)}<p className="text-sm"><strong>FAQ:</strong> {pkg.landingPage.faq.map(f=><span key={f.q} className="block text-xs text-gray-500">Q: {f.q} → {f.a}</span>)}</p></S>
              <S title="🙏 感谢页"><p className="font-bold">{pkg.thankYouPage.confirmation}</p><p className="text-sm">{pkg.thankYouPage.nextStep}</p><p className="text-sm text-blue-600">WhatsApp: {pkg.thankYouPage.whatsappCta}</p></S>
              <S title="💬 WhatsApp 流程"><p className="text-sm"><strong>预设:</strong> {pkg.whatsappFlow.prefilledMessage}</p><p className="text-sm"><strong>第一回复:</strong> {pkg.whatsappFlow.firstReply}</p>{pkg.whatsappFlow.qualificationQuestions.map((q,i)=><p key={i} className="text-xs text-gray-500">Q{i+1}: {q}</p>)}</S>
              <S title="📧 邮件序列 (7封)">{pkg.emailSequence.map(e=><div key={e.order} className="text-sm py-1.5 border-b last:border-0"><strong>{e.order}. {e.type}:</strong> {e.subject}<br /><span className="text-xs text-gray-500">{e.preview} | CTA: {e.cta}</span></div>)}</S>
              <S title="📣 广告角度">{pkg.adAngles.map((a,i)=><div key={i} className="text-sm py-1.5 border-b last:border-0"><strong>{a.platform}:</strong> {a.hook}<br /><span className="text-xs text-gray-500">{a.creativeDirection} | {a.funnelStage}</span></div>)}</S>
              <S title="🚀 7天启动计划">{pkg.launchPlan.map(d=><div key={d.day} className="text-sm py-1"><strong>Day {d.day}: {d.title}</strong> — {d.task}</div>)}</S>
            </>
          )}
        </>
      )}
    </div>
  );
}
function S({ title, children }: { title: string; children: React.ReactNode }) { return <section className="rounded-xl border border-[var(--color-border)] bg-white p-5"><h3 className="text-sm font-bold mb-3">{title}</h3>{children}</section>; }
