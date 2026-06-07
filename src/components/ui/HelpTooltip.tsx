'use client';

import { CircleHelp } from 'lucide-react';

type HelpTooltipProps = {
  text: string;
  className?: string;
};

export function HelpTooltip({ text, className }: HelpTooltipProps) {
  return (
    <button
      type="button"
      title={text}
      aria-label={text}
      className={className ?? 'inline-flex h-4 w-4 items-center justify-center text-[var(--color-text-muted)] hover:text-[var(--color-text)]'}
    >
      <CircleHelp className="h-3.5 w-3.5" aria-hidden="true" />
    </button>
  );
}
