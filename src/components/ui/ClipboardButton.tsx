'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { writeClipboardText } from '@/lib/clipboard';

export function ClipboardButton({ text, label = '复制', sessionKey }: { text: string; label?: string; sessionKey: string }) {
  const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const operation = useRef(0);
  useEffect(() => { operation.current += 1; setStatus('idle'); }, [sessionKey]);
  async function copy() {
    const current = ++operation.current;
    try {
      await writeClipboardText(text);
      if (current === operation.current) setStatus('success');
    } catch {
      if (current === operation.current) setStatus('error');
    }
  }
  return (
    <span className="inline-flex flex-col items-start gap-1">
      <button type="button" onClick={() => void copy()} className="inline-flex min-h-9 items-center gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] px-3 text-sm focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]">
        {status === 'success' ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}{status === 'success' ? '已复制' : label}
      </button>
      <span role="status" aria-live="polite" className={`text-xs ${status === 'error' ? 'text-red-700' : 'text-green-700'}`}>
        {status === 'error' ? '复制失败，请允许剪贴板权限后重试。' : status === 'success' ? '复制成功。' : ''}
      </span>
    </span>
  );
}
