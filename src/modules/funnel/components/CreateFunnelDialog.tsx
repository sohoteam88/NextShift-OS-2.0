'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { useToast } from '@/stores/toast-store';
import { useFunnelTemplates, useCreateFunnel } from '../hooks/use-funnels';

type Props = { open: boolean; onClose: () => void };

const TYPE_LABELS: Record<string, { label: string; emoji: string; desc: string }> = {
  landing: { label: '落地页', emoji: '🎯', desc: '展示产品/服务，引导用户通过 WhatsApp 联系' },
  quiz:    { label: '测试问卷', emoji: '🧪', desc: '互动问卷，根据答案展示个性化结果' },
  lead_magnet: { label: '免费下载', emoji: '🎁', desc: '提供免费资源，换取用户联系方式' },
};

export function CreateFunnelDialog({ open, onClose }: Props) {
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [title, setTitle] = useState('');
  const router = useRouter();
  const { toast } = useToast();
  const { data: templatesData, isLoading } = useFunnelTemplates();
  const createFunnel = useCreateFunnel();
  const templates = templatesData?.data ?? [];

  if (!open) return null;

  function handleClose() {
    setStep(1);
    setSelectedTemplateId('');
    setTitle('');
    onClose();
  }

  async function handleCreate() {
    if (!title.trim()) return;
    try {
      const result = await createFunnel.mutateAsync({
        title: title.trim(),
        ...(selectedTemplateId && { template_id: selectedTemplateId }),
      });
      toast('success', '漏斗页面已创建');
      handleClose();
      router.push(`/funnel/${result.data.id}/edit`);
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '创建失败');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg rounded-[var(--radius-lg)] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-base font-semibold">新建漏斗页面</h2>
          <button onClick={handleClose}><X className="h-5 w-5 text-gray-400" /></button>
        </div>

        <div className="px-6 py-5">
          {step === 1 && (
            <div className="space-y-3">
              <p className="text-sm text-[var(--color-text-muted)]">选择模板开始（或直接跳过从空白创建）</p>
              {isLoading ? (
                <div className="space-y-2">{[1,2,3].map(i => <div key={i} className="h-16 animate-pulse rounded bg-gray-100" />)}</div>
              ) : (
                templates.map(t => {
                  const meta = TYPE_LABELS[t.type] ?? { label: t.type, emoji: '📄', desc: '' };
                  return (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTemplateId(t.id); setStep(2); }}
                      className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition-colors hover:border-[var(--color-primary)] hover:bg-blue-50 ${selectedTemplateId === t.id ? 'border-[var(--color-primary)] bg-blue-50' : 'border-[var(--color-border)]'}`}
                    >
                      <span className="text-2xl">{meta.emoji}</span>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-[var(--color-text)]">{t.name}</p>
                        <p className="text-xs text-[var(--color-text-muted)]">{meta.desc}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-gray-400 shrink-0" />
                    </button>
                  );
                })
              )}
              <button onClick={() => setStep(2)} className="mt-1 w-full text-center text-sm text-[var(--color-primary)] hover:underline">
                从空白创建 →
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <button onClick={() => setStep(1)} className="text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text)]">← 返回选模板</button>
              <Input
                label="漏斗名称"
                name="title"
                value={title}
                onChange={e => setTitle(e.target.value)}
                required
                placeholder="例如：健康咨询预约页"
                autoFocus
              />
              <div className="flex justify-end gap-3">
                <Button variant="secondary" onClick={handleClose}>取消</Button>
                <Button onClick={handleCreate} loading={createFunnel.isPending} disabled={!title.trim()}>创建并开始编辑</Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
