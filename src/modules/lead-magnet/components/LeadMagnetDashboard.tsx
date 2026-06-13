'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, ClipboardList, HelpCircle, Loader2, Sparkles, Trophy } from 'lucide-react';
import { cn } from '@/lib/cn';
import type { LeadMagnetType, LeadMagnetConfig, AssessmentQuestion, QuizQuestion, ChecklistItem } from '../types';
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
  return useMutation({ mutationFn: async (opts: { type: LeadMagnetType; audiencePain: string }) => {
    const res = await fetch('/api/v1/lead-magnet/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(opts) });
    if (!res.ok) throw new Error('Failed');
    return res.json();
  }, onSuccess: () => qc.invalidateQueries({ queryKey: ['lead-magnet'] }) });
}

export function LeadMagnetDashboard() {
  const router = useRouter();
  const query = useLeadMagnet();
  const generate = useGenerateLM();
  const lm = query.data?.data ?? null;
  const [type, setType] = React.useState<LeadMagnetType>('assessment');
  const [pain, setPain] = React.useState('不知道如何开始个人品牌');
  const advisorTips = getLMAdvisorTips(!!lm, lm?.qualityScore ?? 0);

  if (query.isLoading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;

  return (
    <div className="mx-auto max-w-3xl space-y-4 pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => router.push('/dashboard')}><ArrowLeft className="h-5 w-5 text-gray-400" /></button>
          <div><h1 className="text-xl font-bold">引流磁铁构建器</h1><p className="text-xs text-[var(--color-text-muted)]">创建吸引潜在客户的免费资源，收集联系方式。</p></div>
        </div>
        {lm && <div className="rounded-full bg-emerald-100 px-3 py-1.5 text-xs font-bold text-emerald-700"><Trophy className="inline h-3 w-3 mr-1" />{lm.qualityScore}%</div>}
      </div>

      {advisorTips.length > 0 && advisorTips[0].priority < 99 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4"><p className="text-xs font-bold text-amber-700 mb-1">💡 建议</p><p className="text-sm text-amber-800">{advisorTips[0].body}</p></div>
      )}

      {/* Generator */}
      <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
        <h3 className="text-sm font-bold mb-3">🧲 创建引流磁铁</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {(['assessment','quiz','checklist'] as LeadMagnetType[]).map(t => (
            <button key={t} type="button" onClick={() => setType(t)} className={cn('rounded-lg px-3 py-1.5 text-xs font-semibold', type === t ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600')}>
              {t === 'assessment' ? '📊 评估' : t === 'quiz' ? '❓ 测试' : '✅ 清单'}
            </button>
          ))}
        </div>
        <input value={pain} onChange={(e) => setPain(e.target.value)} placeholder="受众痛点，例如：不知道如何开始" className="w-full rounded-lg border px-3 py-2 text-sm bg-gray-50 mb-3" />
        <button type="button" onClick={() => generate.mutate({ type, audiencePain: pain })} disabled={generate.isPending} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50">
          {generate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
          生成引流磁铁
        </button>
      </section>

      {/* Generated LM */}
      {lm && (
        <>
          <section className="rounded-xl border border-emerald-200 bg-white p-5">
            <div className="flex items-center justify-between mb-2"><h3 className="text-sm font-bold">{lm.title}</h3><span className="text-xs font-bold text-emerald-600">{lm.qualityScore}%</span></div>
            <p className="text-sm text-[var(--color-text-muted)] mb-3">{lm.promise}</p>

            {/* Assessment/Quiz questions */}
            {lm.type !== 'checklist' && lm.questions && (
              <div className="space-y-2">
                {(lm.questions as (AssessmentQuestion | QuizQuestion)[]).map((q) => (
                  <div key={q.id} className="bg-gray-50 rounded-lg p-3">
                    <p className="text-sm font-semibold">{q.question}</p>
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {q.options.map((opt, i) => <span key={i} className="text-xs bg-white rounded-full px-2 py-0.5 border">{opt.label}</span>)}
                    </div>
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

            {/* Score categories */}
            {lm.scoreCategories && lm.scoreCategories.length > 0 && (
              <div className="mt-4 pt-3 border-t">
                <p className="text-xs font-bold mb-2">📊 评分分类</p>
                {lm.scoreCategories.map((cat, i) => <p key={i} className="text-xs mb-1"><strong>{cat.range[0]}-{cat.range[1]}:</strong> {cat.label} ({cat.segment}级) — {cat.recommendation}</p>)}
              </div>
            )}
          </section>

          {/* Result Page Preview */}
          <section className="rounded-xl border border-purple-200 bg-white p-5">
            <h3 className="text-sm font-bold mb-2">📄 结果页预览</h3>
            <div className="bg-gradient-to-br from-purple-50 to-white rounded-lg p-4 text-center">
              <p className="text-xs text-purple-500">{lm.resultPage.scoreLabel}</p>
              <p className="text-2xl font-bold text-purple-700 mt-1">78%</p>
              <p className="text-sm font-bold mt-2">{lm.resultPage.categoryLabel}</p>
              <p className="text-xs text-gray-500 mt-1">{lm.resultPage.explanation}</p>
              {lm.resultPage.recommendations.map((r, i) => <p key={i} className="text-xs text-purple-700 mt-2">💡 {r}</p>)}
              <button className="mt-4 inline-flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-2 text-sm font-bold text-white">{lm.cta.buttonText || '立即获取'}</button>
            </div>
          </section>

          {/* Segmentation */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold mb-2">🎯 客户分层</h3>
            <p className="text-sm"><strong>评级:</strong> {lm.segmentation.leadScore} 级</p>
            <p className="text-sm"><strong>下一步:</strong> {lm.segmentation.nextAction}</p>
            <p className="text-sm"><strong>跟进策略:</strong> {lm.segmentation.followUpStrategy}</p>
          </section>

          {/* CTA */}
          <section className="rounded-xl border border-[var(--color-border)] bg-white p-5">
            <h3 className="text-sm font-bold mb-2">📣 CTA 设置</h3>
            <p className="text-sm"><strong>标题:</strong> {lm.cta.headline}</p>
            <p className="text-sm"><strong>按钮:</strong> {lm.cta.buttonText}</p>
            <p className="text-sm"><strong>WhatsApp:</strong> {lm.cta.whatsappCta}</p>
            <p className="text-sm"><strong>漏斗:</strong> {lm.cta.funnelCta}</p>
          </section>
        </>
      )}
    </div>
  );
}
