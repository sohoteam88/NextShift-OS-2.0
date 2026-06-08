'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/stores/toast-store';
import { useTags, type Tag } from '../hooks/use-tags';

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f59e0b', '#10b981', '#06b6d4', '#64748b',
];

type Props = { open: boolean; onClose: () => void };

export function TagManagerDialog({ open, onClose }: Props) {
  const { data } = useTags();
  const qc = useQueryClient();
  const { toast } = useToast();
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState(PRESET_COLORS[0]);
  const [loading, setLoading] = useState(false);

  const tags = data?.data ?? [];

  if (!open) return null;

  async function handleCreate() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/crm/tags', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? '创建失败');
      }
      qc.invalidateQueries({ queryKey: ['tags'] });
      setNewName('');
      toast('success', '标签已创建');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : '创建失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(tag: Tag) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/crm/tags/${tag.id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error();
      qc.invalidateQueries({ queryKey: ['tags'] });
      toast('success', `标签 "${tag.name}" 已删除`);
    } catch {
      toast('error', '删除失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateColor(tag: Tag, color: string) {
    try {
      await fetch(`/api/v1/crm/tags/${tag.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ color }),
      });
      qc.invalidateQueries({ queryKey: ['tags'] });
    } catch {
      toast('error', '更新失败');
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">管理标签</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tag list */}
        <div className="max-h-72 overflow-y-auto px-6 py-4">
          {tags.length === 0 ? (
            <p className="py-4 text-center text-sm text-[var(--color-text-muted)]">还没有标签</p>
          ) : (
            <ul className="space-y-2">
              {tags.map((tag) => (
                <li key={tag.id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
                  {/* Color picker */}
                  <div className="relative">
                    <span
                      className="block h-5 w-5 cursor-pointer rounded-full"
                      style={{ backgroundColor: tag.color }}
                      title="点击更改颜色"
                    />
                    <select
                      className="absolute inset-0 cursor-pointer opacity-0"
                      value={tag.color}
                      onChange={(e) => handleUpdateColor(tag, e.target.value)}
                    >
                      {PRESET_COLORS.map((c) => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                  <span className="flex-1 text-sm text-[var(--color-text)]">{tag.name}</span>
                  <button
                    onClick={() => handleDelete(tag)}
                    disabled={loading}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)] disabled:opacity-40"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Create new */}
        <div className="border-t border-[var(--color-border)] px-6 py-4">
          <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">添加新标签</p>
          <div className="mb-2 flex gap-1.5">
            {PRESET_COLORS.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setNewColor(c)}
                className={`h-5 w-5 rounded-full transition-transform ${newColor === c ? 'scale-125 ring-2 ring-white ring-offset-1' : ''}`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="标签名称"
              onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
            />
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleCreate} loading={loading}>
              添加
            </Button>
          </div>
        </div>

        <div className="flex justify-end border-t border-[var(--color-border)] px-6 py-3">
          <Button variant="secondary" onClick={onClose}>关闭</Button>
        </div>
      </div>
    </div>
  );
}
