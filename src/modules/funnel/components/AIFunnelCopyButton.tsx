'use client';
import { useState } from 'react';
import { Sparkles, X, RefreshCw, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/stores/toast-store';
import type { FunnelCopyOutput } from '@/modules/ai/services/funnel-copy-service';

type Props = {
  funnelId: string;
  funnelType: 'landing' | 'quiz' | 'lead_magnet';
  context: {
    audience: string;
    offer: string;
    product?: string;
    language?: 'zh' | 'en' | 'ms';
  };
  onApply: (copy: Partial<FunnelCopyOutput>) => void;
};

const SECTION_LABELS: Record<string, string> = {
  hero: '🎯 Hero', pain: '😰 痛点', mechanism: '🔧 原理',
  benefits: '✅ 优势', faq: '❓ FAQ', cta: '📢 CTA', quiz: '🧪 测试',
};

export function AIFunnelCopyButton({ funnelId, funnelType, context, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copy, setCopy] = useState<FunnelCopyOutput | null>(null);
  const { toast } = useToast();
  const copyContext = {
    audience: context.audience.trim() || 'Brand DNA target audience',
    offer: context.offer.trim() || 'Canonical funnel offer',
    product: context.product?.trim() || context.offer.trim() || undefined,
    language: context.language ?? 'zh',
  };

  async function handleGenerate() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai/generate/funnel-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelType, ...copyContext }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error?.message ?? '生成失败'); }
      const data = await res.json();
      setCopy(data.data.copy);
      toast('success', '文案已生成！');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : '生成失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleApplyAll() {
    if (!copy) return;
    onApply(copy);
    // Also persist via API
    await fetch('/api/v1/ai/generate/funnel-copy/apply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ funnelId, copy }),
    });
    toast('success', '全部文案已应用');
    setOpen(false);
  }

  function handleApplySection(key: string) {
    if (!copy) return;
    onApply({ [key]: (copy as unknown as Record<string, unknown>)[key] } as Partial<FunnelCopyOutput>);
    toast('success', `${SECTION_LABELS[key] ?? key} 已应用`);
  }

  return (
    <>
      <Button size="sm" variant="secondary" icon={<Sparkles className="h-4 w-4 text-purple-500" />}
        onClick={() => setOpen(true)}>
        AI 生成文案
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="flex max-h-[90vh] w-full max-w-2xl flex-col rounded-[var(--radius-lg)] bg-white shadow-xl">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
              <h2 className="flex items-center gap-2 text-base font-semibold">
                <Sparkles className="h-5 w-5 text-purple-500" /> AI 生成漏斗文案
              </h2>
              <button onClick={() => setOpen(false)}><X className="h-5 w-5 text-gray-400" /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
              {!copy ? (
                <>
                  <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-gray-50 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">当前漏斗上下文</p>
                    <dl className="mt-3 space-y-2 text-sm">
                      <div>
                        <dt className="text-xs text-gray-500">受众</dt>
                        <dd className="mt-0.5 text-gray-800">{copyContext.audience}</dd>
                      </div>
                      <div>
                        <dt className="text-xs text-gray-500">优惠</dt>
                        <dd className="mt-0.5 text-gray-800">{copyContext.offer}</dd>
                      </div>
                      {copyContext.product ? (
                        <div>
                          <dt className="text-xs text-gray-500">产品/服务</dt>
                          <dd className="mt-0.5 text-gray-800">{copyContext.product}</dd>
                        </div>
                      ) : null}
                    </dl>
                  </div>
                </>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600">已生成以下文案，可单独应用或全部应用：</p>
                    <button onClick={() => setCopy(null)} className="flex items-center gap-1 text-xs text-blue-600 hover:underline">
                      <RefreshCw className="h-3.5 w-3.5" /> 重新生成
                    </button>
                  </div>
                  {Object.entries(copy).map(([key, value]) => (
                    <div key={key} className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">{SECTION_LABELS[key] ?? key}</span>
                        <button onClick={() => handleApplySection(key)}
                          className="flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline">
                          <CheckCheck className="h-3.5 w-3.5" /> 应用
                        </button>
                      </div>
                      <pre className="max-h-32 overflow-auto rounded bg-gray-50 p-2 text-xs text-gray-600">
                        {JSON.stringify(value, null, 2)}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
              <Button variant="secondary" onClick={() => setOpen(false)}>关闭</Button>
              {!copy
                ? <Button onClick={handleGenerate} loading={loading} icon={<Sparkles className="h-4 w-4" />}>生成文案</Button>
                : <Button onClick={handleApplyAll} icon={<CheckCheck className="h-4 w-4" />}>应用全部</Button>
              }
            </div>
          </div>
        </div>
      )}
    </>
  );
}
