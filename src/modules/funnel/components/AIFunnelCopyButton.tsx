'use client';
import { useState } from 'react';
import { Sparkles, X, RefreshCw, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/stores/toast-store';
import type { FunnelCopyOutput } from '@/modules/ai/services/funnel-copy-service';
import type { FunnelConfig } from '../types';

type Props = {
  funnelId: string;
  funnelType: 'landing' | 'quiz' | 'lead_magnet';
  onApply: (copy: Partial<FunnelCopyOutput>) => void;
};

const SECTION_LABELS: Record<string, string> = {
  hero: '🎯 Hero', pain: '😰 痛点', mechanism: '🔧 原理',
  benefits: '✅ 优势', faq: '❓ FAQ', cta: '📢 CTA', quiz: '🧪 测试',
};

export function AIFunnelCopyButton({ funnelId, funnelType, onApply }: Props) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ audience: '', offer: '', product: '', language: 'zh' as 'zh' | 'en' | 'ms' });
  const [loading, setLoading] = useState(false);
  const [copy, setCopy] = useState<FunnelCopyOutput | null>(null);
  const { toast } = useToast();

  async function handleGenerate() {
    if (!form.audience || !form.offer) { toast('error', '请填写目标受众和优惠内容'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/v1/ai/generate/funnel-copy', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ funnelType, audience: form.audience, offer: form.offer, product: form.product || undefined, language: form.language }),
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
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">目标受众 *</label>
                    <textarea className={inp} rows={2} placeholder="例如：30-45 岁忙碌的职业妈妈"
                      value={form.audience} onChange={e => setForm(f => ({ ...f, audience: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">优惠内容 *</label>
                    <textarea className={inp} rows={2} placeholder="例如：免费 30 分钟健康咨询"
                      value={form.offer} onChange={e => setForm(f => ({ ...f, offer: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">产品/服务（可选）</label>
                    <input className={inp} placeholder="例如：体重管理指导"
                      value={form.product} onChange={e => setForm(f => ({ ...f, product: e.target.value }))} />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700">语言</label>
                    <select className={inp} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value as 'zh' | 'en' | 'ms' }))}>
                      <option value="zh">中文</option>
                      <option value="en">English</option>
                      <option value="ms">Bahasa Malaysia</option>
                    </select>
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
const inp = 'w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]';
