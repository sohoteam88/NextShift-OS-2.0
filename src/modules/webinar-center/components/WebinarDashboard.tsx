'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Mic, Presentation, Send, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import { RevenueDriverIntentResolver } from '@/modules/revenue-drivers/components/RevenueDriverIntentResolver';
import type { RevenueDriverResolvedIntent } from '@/modules/revenue-drivers/constants/revenue-driver-intents';
import type { WebinarPackage } from '../types';

function useWebinar() { return useQuery({ queryKey: ['webinar'], queryFn: async () => { const r = await fetch('/api/v1/webinar-center'); if (!r.ok) throw new Error('Failed'); return r.json() as Promise<{ data: WebinarPackage | null }>; }, staleTime: 30_000 }); }
function useGenerate() { const qc = useQueryClient(); return useMutation({ mutationFn: async () => { const r = await fetch('/api/v1/webinar-center/generate', { method: 'POST' }); if (!r.ok) throw new Error('Failed'); return r.json(); }, onSuccess: () => qc.invalidateQueries({ queryKey: ['webinar'] }) }); }

export function WebinarDashboard() {
  const router = useRouter();
  const q = useWebinar();
  const gen = useGenerate();
  const pkg = q.data?.data ?? null;
  const [activeOutput, setActiveOutput] = React.useState('strategy');
  const handleIntentResolved = React.useCallback((resolution: RevenueDriverResolvedIntent) => {
    if (typeof resolution.state.output === 'string') {
      setActiveOutput(resolution.state.output);
    }
  }, []);

  if (q.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      <RevenueDriverIntentResolver route="/webinar-center" onResolved={handleIntentResolved} />
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3"><button onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button><div><h1 className="text-xl font-bold">线上讲座中心</h1><p className="text-xs text-gray-500">创建教育型讲座，把兴趣变成信任和成交。</p></div></div>
        {pkg && <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700"><Trophy className="inline h-3 w-3 mr-1" />已生成</div>}
      </div>

      {!pkg && (
        <div id="webinar-generator-output" className="scroll-mt-24 rounded-xl border-2 border-dashed border-blue-200 bg-blue-50 p-8 text-center">
          <Presentation className="h-8 w-8 text-blue-500 mx-auto mb-3" /><h2 className="text-lg font-bold mb-2">生成你的第一场Webinar</h2><p className="text-sm text-gray-500 mb-4">从策略到跟进序列，AI帮你全部准备好。</p>
          <button onClick={() => gen.mutate()} disabled={gen.isPending} className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-50">{gen.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}生成完整Webinar</button>
        </div>
      )}

      {pkg && (
        <div id="webinar-generator-output" className="scroll-mt-24 space-y-4">
          <Section title="🎯 策略" active={activeOutput === 'strategy'}><p className="text-sm"><strong>受众:</strong> {pkg.strategy.targetAudience}</p><p className="text-sm"><strong>目标:</strong> {pkg.strategy.desiredOutcome}</p><p className="text-sm"><strong>转化目标:</strong> {pkg.strategy.conversionObjective}</p></Section>
          <Section title="📝 主题"><p className="text-lg font-bold">{pkg.topic.title}</p><p className="text-sm text-blue-600">{pkg.topic.promise}</p><p className="text-xs text-gray-500">{pkg.topic.subtitle}</p></Section>
          <Section title={`📋 大纲 (${pkg.outline.recommendedDuration})`}>
            {['opening','story','problem','opportunity','framework','caseStudy','offer','qa','cta'].map(k => <p key={k} className="text-sm mb-1"><strong>{k}:</strong> {(pkg.outline as any)[k]}</p>)}
          </Section>
          <Section title="🎙️ Speaker Script" active={activeOutput === 'script'}><pre className="text-xs whitespace-pre-wrap bg-gray-50 rounded p-3 max-h-60 overflow-y-auto">{pkg.loomScript}</pre></Section>
          <Section title="🖼️ Presentation Slides" active={activeOutput === 'slides'}>
            {pkg.slideOutline.map(s => <div key={s.slideNumber} className="text-sm py-2 border-b last:border-0"><strong>Slide {s.slideNumber}: {s.title}</strong><br /><span className="text-xs text-gray-500">{s.keyMessage} | 视觉: {s.suggestedVisual}</span></div>)}
          </Section>
          <Section title="📄 注册页">
            <p className="text-lg font-bold">{pkg.registrationPage.headline}</p>
            <p className="text-sm text-blue-600">{pkg.registrationPage.subheadline}</p>
            {pkg.registrationPage.bulletPoints.map((b,i) => <p key={i} className="text-sm">{b}</p>)}
            <p className="mt-2 inline-block rounded-lg bg-blue-600 text-white px-4 py-2 text-sm font-bold">{pkg.registrationPage.cta}</p>
            <p className="text-xs text-red-500 mt-1">{pkg.registrationPage.urgency}</p>
          </Section>
          <Section title="🔄 回放页"><p className="font-bold">{pkg.replayPage.headline}</p><p className="text-sm">{pkg.replayPage.summary}</p><p className="text-sm text-blue-600">{pkg.replayPage.cta}</p><p className="text-xs text-red-500">{pkg.replayPage.deadline}</p></Section>
          <Section title="💼 Offer Stack" active={activeOutput === 'offer'}><p className="text-sm"><strong>CTA:</strong> {pkg.registrationPage.cta}</p><p className="text-sm"><strong>紧迫感:</strong> {pkg.registrationPage.urgency}</p><p className="text-sm"><strong>回放 CTA:</strong> {pkg.replayPage.cta}</p></Section>
          <Section title="❓ Q&A Generator" active={activeOutput === 'qa'}>
            {['Too expensive', 'Need to think', 'No time', 'Not sure it works', 'Already tried before'].map((item) => (
              <p key={item} className="text-sm py-1.5 border-b last:border-0">{item}: 回到讲座承诺、真实案例和下一步 CTA。</p>
            ))}
          </Section>
          <Section title="💬 Follow-Up Sequence (7天)" active={activeOutput === 'followUp'}>
            {pkg.followupSequence.map(f => <div key={f.day} className="text-sm py-2 border-b last:border-0"><strong>Day {f.day}: {f.label}</strong><p className="text-xs text-gray-600">{f.message}</p></div>)}
          </Section>
        </div>
      )}
    </div>
  );
}

function Section({ title, children, active = false }: { title: string; children: React.ReactNode; active?: boolean }) {
  return (
    <section className={cn('rounded-xl border bg-white p-5', active ? 'border-blue-300 ring-2 ring-blue-100' : 'border-[var(--color-border)]')}>
      <h3 className="text-sm font-bold mb-3">{title}</h3>
      {children}
    </section>
  );
}
