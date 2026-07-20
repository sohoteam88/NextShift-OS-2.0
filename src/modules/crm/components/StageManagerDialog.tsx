'use client';
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { X, GripVertical, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/stores/toast-store';
import { type PipelineStage } from '../hooks/use-pipeline';

type Props = { open: boolean; onClose: () => void; stages: PipelineStage[] };

export function StageManagerDialog({ open, onClose, stages }: Props) {
  const [items, setItems] = useState<PipelineStage[]>(stages);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState('#6366f1');
  const [loading, setLoading] = useState(false);
  const qc = useQueryClient();
  const { toast } = useToast();

  if (!open) return null;

  async function handleSaveOrder() {
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/crm/pipeline-stages/reorder', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stage_ids: items.map((s) => s.id) }),
      });
      if (!res.ok) throw new Error();
      qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      toast('success', '阶段顺序已保存');
    } catch {
      toast('error', '保存失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleAddStage() {
    if (!newName.trim()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/v1/admin/crm/pipeline-stages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName.trim(), color: newColor }),
      });
      if (!res.ok) throw new Error();
      const { data } = await res.json();
      setItems((prev) => [...prev, data]);
      setNewName('');
      qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      toast('success', '阶段已添加');
    } catch {
      toast('error', '添加失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/v1/admin/crm/pipeline-stages/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error((err as { error?: { message?: string } }).error?.message ?? '删除失败');
      }
      setItems((prev) => prev.filter((s) => s.id !== id));
      qc.invalidateQueries({ queryKey: ['pipeline-stages'] });
      toast('success', '阶段已删除');
    } catch (e) {
      toast('error', e instanceof Error ? e.message : '删除失败');
    } finally {
      setLoading(false);
    }
  }

  function moveItem(from: number, to: number) {
    setItems((prev) => {
      const next = [...prev];
      const [item] = next.splice(from, 1);
      next.splice(to, 0, item);
      return next;
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-white shadow-lg">
        <div className="flex items-center justify-between border-b border-[var(--color-border)] px-6 py-4">
          <h2 className="text-base font-semibold text-[var(--color-text)]">管理阶段</h2>
          <button onClick={onClose} className="text-[var(--color-text-muted)] hover:text-[var(--color-text)]">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="max-h-80 overflow-y-auto px-6 py-4">
          <ul className="space-y-2">
            {items.map((stage, i) => (
              <li key={stage.id} className="flex items-center gap-3 rounded-[var(--radius-md)] border border-[var(--color-border)] p-2">
                <div className="flex flex-col gap-0.5">
                  <button
                    disabled={i === 0}
                    onClick={() => moveItem(i, i - 1)}
                    className="text-[var(--color-text-muted)] hover:text-[var(--color-text)] disabled:opacity-30"
                  >
                    <GripVertical className="h-4 w-4" />
                  </button>
                </div>
                <span
                  className="h-4 w-4 shrink-0 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="flex-1 text-sm text-[var(--color-text)]">{stage.name}</span>
                <button
                  onClick={() => handleDelete(stage.id)}
                  className="text-[var(--color-text-muted)] hover:text-[var(--color-danger)]"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Add new stage */}
        <div className="border-t border-[var(--color-border)] px-6 py-4">
          <p className="mb-2 text-xs font-medium text-[var(--color-text-muted)]">添加新阶段</p>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={newColor}
              onChange={(e) => setNewColor(e.target.value)}
              className="h-9 w-9 cursor-pointer rounded border border-[var(--color-border)] p-1"
            />
            <input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="阶段名称"
              className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]"
              onKeyDown={(e) => e.key === 'Enter' && handleAddStage()}
            />
            <Button size="sm" icon={<Plus className="h-4 w-4" />} onClick={handleAddStage} loading={loading}>
              添加
            </Button>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-[var(--color-border)] px-6 py-4">
          <Button variant="secondary" onClick={onClose}>关闭</Button>
          <Button onClick={handleSaveOrder} loading={loading}>保存顺序</Button>
        </div>
      </div>
    </div>
  );
}
