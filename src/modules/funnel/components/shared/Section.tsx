'use client';

import * as React from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export function Section({
  title,
  icon,
  defaultOpen = false,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between px-5 py-4 text-left"
      >
        <div className="flex items-center gap-3">
          <div className="rounded-[var(--radius-md)] bg-[var(--color-surface)] p-1.5 text-[var(--color-primary)]">
            {icon}
          </div>
          <span className="font-medium text-[var(--color-text)]">{title}</span>
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-[var(--color-text-muted)]" /> : <ChevronRight className="h-4 w-4 text-[var(--color-text-muted)]" />}
      </button>
      {open && <div className="border-t border-[var(--color-border)] px-5 py-4">{children}</div>}
    </div>
  );
}
