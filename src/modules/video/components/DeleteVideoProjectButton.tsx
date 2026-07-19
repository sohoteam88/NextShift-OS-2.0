'use client';

import { useState } from 'react';
import { Loader2, Trash2 } from 'lucide-react';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';

export function DeleteVideoProjectButton({ projectId, onDeleted }: { projectId: string; onDeleted: () => void }) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  async function remove() {
    if (pending) return;
    setPending(true); setError('');
    try {
      const response = await fetch(`/api/v1/video/projects/${projectId}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('删除失败，项目仍然保留。');
      setOpen(false); onDeleted();
    } catch (reason) { setError(reason instanceof Error ? reason.message : '删除失败，项目仍然保留。'); }
    finally { setPending(false); }
  }
  return <>
    <button type="button" onClick={() => { setError(''); setOpen(true); }} className="inline-flex min-h-10 items-center gap-2 rounded-[var(--radius-md)] border border-red-200 px-3 text-sm font-medium text-red-700"><Trash2 className="h-4 w-4" />删除</button>
    <AccessibleDialog open={open} title="删除视频项目？" description="删除后无法恢复。" onRequestClose={() => { if (!pending) setOpen(false); }} className="max-w-md">
      <div className="space-y-4 p-5"><p className="text-sm">只会删除当前项目，不会影响其他视频。</p>{error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}<div className="flex justify-end gap-3"><button type="button" disabled={pending} onClick={() => setOpen(false)} className="min-h-11 rounded-[var(--radius-md)] border px-4">取消</button><button type="button" disabled={pending} onClick={() => void remove()} className="inline-flex min-h-11 items-center gap-2 rounded-[var(--radius-md)] bg-red-600 px-4 text-white disabled:opacity-50">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{error ? '重试删除' : '确认删除'}</button></div></div>
    </AccessibleDialog>
  </>;
}
