'use client';

import { useCallback, useEffect, useId, useRef, type ReactNode } from 'react';
import { X } from 'lucide-react';

type Props = {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  onRequestClose: () => void;
  className?: string;
};

const FOCUSABLE = [
  'button:not([disabled])', '[href]', 'input:not([disabled])',
  'select:not([disabled])', 'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

export function AccessibleDialog({ open, title, description, children, onRequestClose, className = 'max-w-3xl' }: Props) {
  const titleId = useId();
  const descriptionId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef(onRequestClose);
  useEffect(() => { closeRef.current = onRequestClose; }, [onRequestClose]);
  const close = useCallback(() => closeRef.current(), []);

  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    (dialog?.querySelector<HTMLElement>(FOCUSABLE) ?? dialog)?.focus();
    const keydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); close(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const items = Array.from(dialog.querySelectorAll<HTMLElement>(FOCUSABLE));
      if (!items.length) { event.preventDefault(); dialog.focus(); return; }
      if (event.shiftKey && document.activeElement === items[0]) { event.preventDefault(); items.at(-1)?.focus(); }
      else if (!event.shiftKey && document.activeElement === items.at(-1)) { event.preventDefault(); items[0].focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [open, close]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 sm:items-center sm:p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) close(); }}>
      <div ref={dialogRef} role="dialog" aria-modal="true" aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined} tabIndex={-1} className={`max-h-[92dvh] w-full overflow-y-auto rounded-t-[var(--radius-lg)] border border-[var(--color-border)] bg-white shadow-xl sm:rounded-[var(--radius-lg)] ${className}`}>
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-[var(--color-border)] bg-white px-5 py-4">
          <div><h2 id={titleId} className="text-lg font-semibold">{title}</h2>{description ? <p id={descriptionId} className="mt-1 text-sm text-[var(--color-text-muted)]">{description}</p> : null}</div>
          <button type="button" onClick={close} aria-label="关闭对话框" className="inline-flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] focus-visible:ring-2 focus-visible:ring-[var(--color-primary)]"><X className="h-5 w-5" /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
