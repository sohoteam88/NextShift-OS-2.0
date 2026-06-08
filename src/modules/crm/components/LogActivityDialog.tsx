'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Phone, MessageCircle, Mail, Users, FileText } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/stores/toast-store';

type ActivityType = 'call' | 'whatsapp' | 'email' | 'meeting' | 'other';

const TYPE_OPTIONS: { type: ActivityType; icon: React.ReactNode; label: string }[] = [
  { type: 'call', icon: <Phone className="h-4 w-4" />, label: '电话' },
  { type: 'whatsapp', icon: <MessageCircle className="h-4 w-4" />, label: 'WhatsApp' },
  { type: 'email', icon: <Mail className="h-4 w-4" />, label: '邮件' },
  { type: 'meeting', icon: <Users className="h-4 w-4" />, label: '会面' },
  { type: 'other', icon: <FileText className="h-4 w-4" />, label: '其他' },
];

const OUTCOMES = [
  { value: 'positive', label: '👍 积极' },
  { value: 'neutral', label: '😐 中性' },
  { value: 'negative', label: '👎 消极' },
];

type Props = { open: boolean; onClose: () => void; leadId: string };

export function LogActivityDialog({ open, onClose, leadId }: Props) {
  const [type, setType] = useState<ActivityType>('call');
  const [description, setDescription] = useState('');
  const [durationMins, setDurationMins] = useState('');
  const [outcome, setOutcome] = useState('');
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  if (!open) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/crm/leads/${leadId}/activities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          description: description.trim(),
          metadata: {
            ...(durationMins && { duration_mins: Number(durationMins) }),
            ...(outcome && { outcome }),
          },
        }),
      });
      if (!res.ok) throw new Error('Failed to log activity');
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      qc.invalidateQueries({ queryKey: ['followup-counts'] });
      toast('success', '活动已记录');
      setDescription('');
      setDurationMins('');
      setOutcome('');
      onClose();
    } catch {
      toast('error', '记录失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">记录活动</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          {/* Type selector */}
          <div>
            <p className="mb-2 text-sm font-medium text-[var(--color-text)]">活动类型</p>
            <div className="flex flex-wrap gap-2">
              {TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.type}
                  type="button"
                  onClick={() => setType(opt.type)}
                  className={`flex items-center gap-1.5 rounded-[var(--radius-full)] border px-3 py-1.5 text-sm transition-colors ${
                    type === opt.type
                      ? 'border-[var(--color-primary)] bg-blue-50 text-[var(--color-primary)]'
                      : 'border-[var(--color-border)] text-[var(--color-text-muted)] hover:border-gray-400'
                  }`}
                >
                  {opt.icon}
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">备注内容</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="记录本次活动的内容..."
              rows={3}
              required
              className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
          </div>

          {/* Optional fields */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">时长（分钟）</label>
              <input
                type="number"
                value={durationMins}
                onChange={(e) => setDurationMins(e.target.value)}
                placeholder="可选"
                min={1}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">结果</label>
              <select
                value={outcome}
                onChange={(e) => setOutcome(e.target.value)}
                className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              >
                <option value="">可选</option>
                {OUTCOMES.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
            <Button type="submit" loading={loading} disabled={!description.trim()}>记录</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
