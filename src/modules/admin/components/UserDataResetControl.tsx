'use client';

import { useState } from 'react';
import { RotateCcw } from 'lucide-react';
import { AccessibleDialog } from '@/components/ui/AccessibleDialog';

type Receipt = {
  perTableCounts: Record<string, number>;
  metadataKeysCleared: string[];
};

type Props = {
  userId: string;
  email: string;
};

export function UserDataResetControl({ userId, email }: Props) {
  const [open, setOpen] = useState(false);
  const [confirmation, setConfirmation] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const confirmed = confirmation === email;

  function close() {
    if (pending) return;
    setOpen(false);
    setConfirmation('');
    setError('');
  }

  async function reset() {
    if (!confirmed || pending) return;
    setPending(true);
    setError('');
    try {
      const response = await fetch(`/api/v1/superadmin/users/${userId}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: confirmation }),
      });
      const payload = await response.json().catch(() => null) as { data?: Receipt; error?: { message?: string } } | null;
      if (!response.ok || !payload?.data) throw new Error(payload?.error?.message ?? '重置失败，请稍后重试。');
      setReceipt(payload.data);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : '重置失败，请稍后重试。');
    } finally {
      setPending(false);
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={() => { setReceipt(null); setOpen(true); }}
        className="inline-flex min-h-9 items-center gap-1.5 rounded-[var(--radius-md)] border border-amber-300 px-2.5 py-1.5 text-xs font-medium text-amber-800 transition hover:bg-amber-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"
      >
        <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
        重置业务数据
      </button>

      <AccessibleDialog
        open={open}
        title={receipt ? '业务数据已重置' : '重置业务数据'}
        description={receipt ? '账号、登录方式、租户归属和角色均已保留。' : '这会清除该用户的业务记录，且不能撤销。'}
        onRequestClose={close}
        className="max-w-lg"
      >
        <div className="space-y-4 p-5">
          {receipt ? (
            <>
              <p className="text-sm text-[var(--color-text-muted)]">已清除以下记录：</p>
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 rounded-[var(--radius-md)] bg-[var(--color-surface)] p-4 text-sm">
                {Object.entries(receipt.perTableCounts).map(([table, count]) => (
                  <div key={table} className="flex justify-between gap-3"><dt className="text-[var(--color-text-muted)]">{table}</dt><dd className="font-medium text-[var(--color-text)]">{count}</dd></div>
                ))}
              </dl>
              <p className="text-xs text-[var(--color-text-muted)]">已清除的品牌资料键：{receipt.metadataKeysCleared.length ? receipt.metadataKeysCleared.join('、') : '无'}</p>
              <div className="flex justify-end"><button type="button" onClick={close} className="min-h-11 rounded-[var(--radius-md)] bg-[var(--color-primary)] px-4 text-sm font-medium text-white">完成</button></div>
            </>
          ) : (
            <>
              <div className="rounded-[var(--radius-md)] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950">
                <p>目标账号：<span className="font-medium">{email}</span></p>
                <p className="mt-1">请输入完整邮箱以确认。输入不一致时无法提交。</p>
              </div>
              <div>
                <label htmlFor={`reset-email-${userId}`} className="mb-1.5 block text-sm font-medium text-[var(--color-text)]">确认邮箱</label>
                <input id={`reset-email-${userId}`} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" spellCheck={false} className="min-h-11 w-full rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm focus:border-[var(--color-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/20" />
              </div>
              {error ? <p role="alert" className="text-sm text-red-700">{error}</p> : null}
              <div className="flex flex-wrap justify-end gap-3">
                <button type="button" disabled={pending} onClick={close} className="min-h-11 rounded-[var(--radius-md)] border border-[var(--color-border)] px-4 text-sm font-medium text-[var(--color-text)] disabled:opacity-50">取消</button>
                <button type="button" disabled={!confirmed || pending} onClick={() => void reset()} className="min-h-11 rounded-[var(--radius-md)] bg-amber-700 px-4 text-sm font-medium text-white disabled:cursor-not-allowed disabled:opacity-50">{pending ? '正在重置…' : '确认重置'}</button>
              </div>
            </>
          )}
        </div>
      </AccessibleDialog>
    </>
  );
}
