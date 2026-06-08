'use client';
import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { TagSelector } from './TagSelector';
import { useCreateLead, useUpdateLead } from '../hooks/use-leads';
import { useSetLeadTags } from '../hooks/use-tags';
import { useToast } from '@/stores/toast-store';

const SOURCES = ['Facebook', 'Instagram', 'TikTok', 'WhatsApp', 'referral', 'manual'];

type Props = { open: boolean; onClose: () => void };

export function AddLeadDialog({ open, onClose }: Props) {
  const [form, setForm] = useState({ name: '', phone: '', email: '', source: 'manual' });
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const createLead = useCreateLead();
  const setLeadTags = useSetLeadTags();
  const { toast } = useToast();

  if (!open) return null;

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      const result = await createLead.mutateAsync({
        name: form.name,
        ...(form.phone && { phone: form.phone }),
        ...(form.email && { email: form.email }),
        source: form.source,
      });
      if (selectedTagIds.length > 0 && result?.data?.id) {
        await setLeadTags.mutateAsync({ leadId: result.data.id, tagIds: selectedTagIds });
      }
      toast('success', '潜在客户已添加');
      setForm({ name: '', phone: '', email: '', source: 'manual' });
      setSelectedTagIds([]);
      onClose();
    } catch (err) {
      toast('error', err instanceof Error ? err.message : '添加失败');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">添加潜在客户</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <Input
            label="姓名"
            name="name"
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            required
          />
          <Input
            label="电话"
            name="phone"
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
          />
          <Input
            label="电子邮件"
            name="email"
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
          />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text)]">来源</label>
            <select
              value={form.source}
              onChange={(e) => set('source', e.target.value)}
              className="w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            >
              {SOURCES.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-[var(--color-text)]">标签</label>
            <TagSelector
              selectedIds={selectedTagIds}
              onChange={setSelectedTagIds}
              canCreate
              placeholder="选择标签（可选）"
            />
          </div>

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>取消</Button>
            <Button type="submit" loading={createLead.isPending || setLeadTags.isPending}>添加</Button>
          </div>
        </form>
      </div>
    </div>
  );
}
