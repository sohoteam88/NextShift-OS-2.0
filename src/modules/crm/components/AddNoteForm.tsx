'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/stores/toast-store';

type Props = { leadId: string };

export function AddNoteForm({ leadId }: Props) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/crm/leads/${leadId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
      });
      if (!res.ok) throw new Error('Failed to add note');
      setContent('');
      qc.invalidateQueries({ queryKey: ['lead', leadId] });
      toast('success', '备注已添加');
    } catch {
      toast('error', '添加备注失败');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="添加备注..."
        rows={3}
        className="w-full resize-none rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
      />
      <div className="flex justify-end">
        <Button type="submit" size="sm" loading={loading} disabled={!content.trim()}>
          添加备注
        </Button>
      </div>
    </form>
  );
}
