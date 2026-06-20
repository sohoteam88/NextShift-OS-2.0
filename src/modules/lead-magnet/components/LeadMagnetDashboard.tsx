'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ExternalLink, FileText, Loader2, Rocket, Sparkles } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { LeadMagnetType, LeadMagnetConfig, ChecklistItem, LeadMagnetSection } from '../types';
import { getLMAdvisorTips } from '../leadMagnetAdvisor';

function useLeadMagnet() {
  return useQuery({ queryKey: ['lead-magnet'], queryFn: async () => {
    const res = await fetch('/api/v1/lead-magnet');
    if (!res.ok) throw new Error('Failed');
    return res.json() as Promise<{ data: LeadMagnetConfig | null }>;
  }, staleTime: 30_000 });
}

function useGenerateLM() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async (opts: { type: Extract<LeadMagnetType, 'guide' | 'checklist' | 'template'> }) => {
    const res = await fetch('/api/v1/lead-magnet/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-magnet'] }) });
}

function usePublishLM() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: async () => {
    const res = await fetch('/api/v1/lead-magnet/publish', { method: 'POST' });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-magnet'] }) });
}

function authoritySourceLabel(source: string) {
  if (source === 'interview_authority') return 'AI 访谈';
  if (source === 'brand_dna') return '品牌资料';
  if (source === 'business_state') return '当前业务状态';
  return source;
}

export function LeadMagnetDashboard() {
  const router = useRouter();
  const query = useLeadMagnet();
  const generate = useGenerateLM();
  const publish = usePublishLM();
  const lm = query.data?.data ?? null;
  const [type, setType] = React.useState<Extract<LeadMagnetType, 'guide' | 'checklist' | 'template'>>('guide');
  const advisorTips = getLMAdvisorTips(!!lm, lm?.qualityScore ?? 0);

  if (query.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button>
          <div><h1 className="text-xl font-bold">引流资源中心</h1><p className="text-xs text-[var(--color-text-muted)]">创建能吸引潜在客户留下联系方式的免费资源。</p></div>
        </div>
        {lm && <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700">{lm.status === 'published' ? '已发布' : '已生成'}</div>}
      </div>

      {advisorTips.length > 0 && advisorTips[0].priority < 99 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold text-amber-700 mb-1">💡 建议</p><p className="text-sm text-amber-800">{advisorTips[0].body}</p></div>
      )}

      {/* Generator */}
      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <div className="mb-4 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-blue-600" />
          <h3 className="text-sm font-bold">创建引流资源和领取页</h3>
        </div>
        <div className="mb-4 rounded-lg border border-blue-100 bg-blue-50 p-3 text-xs text-blue-800">
          系统会结合你的 AI 访谈、品牌资料和当前业务状态。这里只需要选择资源类型。
        </div>
        <div className="grid gap-2 sm:grid-cols-3">
          {([
            { id: 'guide', label: '启动指南', desc: '适合教育与建立信任' },
            { id: 'checklist', label: '行动清单', desc: '适合快速执行' },
            { id: 'template', label: '套用模板', desc: '适合直接复制使用' },
          ] as const).map((option) => (
            <button key={option.id} type="button" onClick={() => setType(option.id)} className={cn('rounded-lg border p-3 text-left transition-colors', type === option.id ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-[var(--color-border)] bg-white text-gray-600 hover:bg-gray-50')}>
              <p className="text-sm font-semibold">{option.label}</p>
              <p className="mt-1 text-xs opacity-80">{option.desc}</p>
            </button>
          ))}
        </div>
        <button type="button" onClick={() => generate.mutate({ type })} disabled={generate.isPending} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          生成资源和领取页
        </button>
      </section>

      {/* Generated LM */}
      {lm && (
        <>
          <section className="rounded-xl border border-emerald-200 bg-white p-5">
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold">{lm.title}</h3><span className="text-xs font-bold text-emerald-600">已就绪</span></div>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">{lm.promise}</p>
            {lm.authorityContext && (
              <div className="mb-4 grid gap-2 rounded-lg bg-emerald-50 p-3 text-xs text-emerald-800 sm:grid-cols-2">
                <p><strong>受众:</strong> {lm.authorityContext.audience}</p>
                <p><strong>痛点:</strong> {lm.authorityContext.audiencePain}</p>
                <p><strong>服务:</strong> {lm.authorityContext.offer}</p>
                <p><strong>资料来源:</strong> {lm.authorityContext.sources.map(authoritySourceLabel).join(' + ')}</p>
              </div>
            )}

            {lm.sections && lm.sections.length > 0 && (
              <div className="space-y-3">
                {(lm.sections as LeadMagnetSection[]).map((section) => (
                  <div key={section.id} className="rounded-lg bg-gray-50 p-3">
                    <p className="text-sm font-semibold">{section.title}</p>
                    <p className="mt-1 text-sm text-gray-600">{section.body}</p>
                    {section.bullets.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {section.bullets.map((bullet) => <p key={bullet} className="text-xs text-gray-500">• {bullet}</p>)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Checklist items */}
            {lm.type === 'checklist' && lm.checklistItems && (
              <div className="space-y-1.5">
                {(lm.checklistItems as ChecklistItem[]).map((item) => (
                  <div key={item.id} className="flex items-center gap-2 text-sm"><span className="text-gray-300">☐</span> {item.text}</div>
                ))}
              </div>
            )}

            {!lm.sections?.length && !lm.checklistItems?.length && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                这是旧版评估型引流资源。请选择上方资源类型，重新生成新版资源和领取页。
              </div>
            )}
          </section>

          {/* Landing page preview */}
          <section className="rounded-xl border border-purple-200 bg-white p-5">
            <div className="mb-3 flex items-center gap-2">
              <FileText className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold">领取页预览</h3>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-4 text-center">
              <p className="text-2xl font-bold text-purple-700">{lm.landingPage?.headline ?? lm.title}</p>
              <p className="mx-auto mt-2 max-w-xl text-sm text-gray-600">{lm.landingPage?.subheadline ?? lm.promise}</p>
              <div className="mt-4 grid gap-2 text-left sm:grid-cols-3">
                {(lm.landingPage?.benefitBullets ?? []).map((item) => (
                  <div key={item} className="rounded-lg bg-white p-3 text-xs text-gray-600 shadow-sm">
                    <CheckCircle2 className="mb-1 h-3.5 w-3.5 text-emerald-600" />
                    {item}
                  </div>
                ))}
              </div>
              <button type="button" className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white">{lm.landingPage?.ctaText ?? lm.cta.buttonText}</button>
            </div>
          </section>

          {/* Publish */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold">发布领取页</h3>
                <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                  {lm.landingPage?.publicPath ? `已发布：${lm.landingPage.publicPath}` : '生成真实领取页，并开放资料领取表单。'}
                </p>
              </div>
              {lm.landingPage?.publicPath ? (
                <button type="button" onClick={() => router.push(lm.landingPage!.publicPath!)} className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-semibold text-white hover:bg-emerald-700">
                  打开页面 <ExternalLink className="h-4 w-4" />
                </button>
              ) : (
                <button type="button" onClick={() => publish.mutate()} disabled={publish.isPending} className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-700 disabled:opacity-50">
                  {publish.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Rocket className="h-4 w-4" />}
                  发布领取页
                </button>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
