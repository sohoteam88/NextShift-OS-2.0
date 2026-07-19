'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { Loader2, Pencil, Trash2 } from 'lucide-react';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';
import { ClipboardButton } from '@/components/ui/ClipboardButton';
import type { LeadMagnetConfig, LeadMagnetTrack } from '../types';

type Draft = { title: string; promise: string; description: string; whatsappCta: string };
const draftOf = (value: LeadMagnetConfig): Draft => ({ title: value.title, promise: value.promise, description: value.description, whatsappCta: value.cta.whatsappCta });
const equal = (a: Draft, b: Draft) => JSON.stringify(a) === JSON.stringify(b);

export function LeadMagnetWorkingLoopCard({ resource, track, onChanged }: { resource: LeadMagnetConfig; track: LeadMagnetTrack; onChanged: () => void }) {
  const [saved, setSaved] = useState(() => draftOf(resource));
  const [draft, setDraft] = useState(() => draftOf(resource));
  const [editing, setEditing] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState('');
  const session = useRef(0);
  useEffect(() => { session.current += 1; const next = draftOf(resource); setSaved(next); setDraft(next); setMessage(''); setEditing(false); setDeleting(false); }, [resource.id, track]);
  const dirty = !equal(draft, saved);
  const copyText = useMemo(() => [draft.title, draft.promise, draft.description, draft.whatsappCta].join('\n\n'), [draft]);

  async function save() {
    if (pending || !dirty) return;
    const ownedSession = session.current; const submitted = draft;
    setPending(true); setMessage('');
    try {
      const response = await fetch('/api/v1/lead-magnet', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: resource.id, track, ...submitted }) });
      const payload = await response.json() as { data?: LeadMagnetConfig };
      if (!response.ok || !payload.data) throw new Error('保存失败，输入已保留。');
      if (ownedSession !== session.current) return;
      const persisted = draftOf(payload.data); setSaved(persisted); setDraft((current) => equal(current, submitted) ? persisted : current); setMessage('保存成功。'); onChanged();
    } catch (error) { if (ownedSession === session.current) setMessage(error instanceof Error ? error.message : '保存失败，输入已保留。'); }
    finally { if (ownedSession === session.current) setPending(false); }
  }

  async function remove() {
    if (pending) return;
    const ownedSession = session.current; setPending(true); setMessage('');
    try {
      const response = await fetch('/api/v1/lead-magnet', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id: resource.id, track }) });
      if (!response.ok) throw new Error('删除失败，资源仍然保留。');
      if (ownedSession === session.current) { setDeleting(false); onChanged(); }
    } catch (error) { if (ownedSession === session.current) setMessage(error instanceof Error ? error.message : '删除失败，资源仍然保留。'); }
    finally { if (ownedSession === session.current) setPending(false); }
  }

  return <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4" data-canonical-id={resource.id}>
    <div className="flex flex-wrap items-start justify-between gap-3"><div><h3 className="font-semibold">{draft.title}</h3><p className="text-xs text-[var(--color-text-muted)]">{track === 'retail' ? 'Retail' : 'Recruitment'} · {resource.id}</p></div><div className="flex flex-wrap gap-2"><button type="button" onClick={() => setEditing(true)} className="inline-flex min-h-10 items-center gap-2 rounded-md border px-3 text-sm"><Pencil className="h-4 w-4" />编辑</button><ClipboardButton sessionKey={`${track}:${resource.id}`} text={copyText} label="复制当前内容" /><button type="button" onClick={() => { setMessage(''); setDeleting(true); }} className="inline-flex min-h-10 items-center gap-2 rounded-md border border-red-200 px-3 text-sm text-red-700"><Trash2 className="h-4 w-4" />删除</button></div></div>
    <p className="mt-2 text-sm">{draft.promise}</p><p className="mt-2 text-sm text-[var(--color-text-muted)]">{draft.description}</p>
    {message ? <p role="status" aria-live="polite" className={`mt-3 text-sm ${message.includes('失败') ? 'text-red-700' : 'text-green-700'}`}>{message}</p> : null}
    <AccessibleDialog open={editing} title={`编辑 ${track === 'retail' ? 'Retail' : 'Recruitment'} 引流资源`} description={`保存同一个 canonical ID：${resource.id}`} onRequestClose={() => { if (!pending) setEditing(false); }}>
      <div className="space-y-4 p-5">{([['title','标题',200],['promise','承诺',1000],['description','正文',4000],['whatsappCta','WhatsApp CTA',1000]] as const).map(([key,label,max]) => <label key={key} className="block text-sm font-medium">{label}<textarea value={draft[key]} maxLength={max} rows={key === 'description' ? 6 : 3} onChange={(event) => setDraft((value) => ({ ...value, [key]: event.target.value }))} className="mt-1 w-full rounded-md border p-3" /></label>)}<div className="flex justify-end gap-3"><button type="button" disabled={pending} onClick={() => { setDraft(saved); setEditing(false); }} className="min-h-11 rounded-md border px-4">取消</button><button type="button" disabled={pending || !dirty} onClick={() => void save()} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-blue-600 px-4 text-white disabled:opacity-50">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}保存</button></div></div>
    </AccessibleDialog>
    <AccessibleDialog open={deleting} title="删除这条引流资源？" description="只删除当前 track，另一条 track 和其他 metadata 不受影响。" onRequestClose={() => { if (!pending) setDeleting(false); }} className="max-w-md"><div className="space-y-4 p-5">{message.includes('失败') ? <p role="alert" className="text-sm text-red-700">{message}</p> : null}<div className="flex justify-end gap-3"><button type="button" disabled={pending} onClick={() => setDeleting(false)} className="min-h-11 rounded-md border px-4">取消</button><button type="button" disabled={pending} onClick={() => void remove()} className="inline-flex min-h-11 items-center gap-2 rounded-md bg-red-600 px-4 text-white disabled:opacity-50">{pending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}{message.includes('失败') ? '重试删除' : '确认删除'}</button></div></div></AccessibleDialog>
  </div>;
}
