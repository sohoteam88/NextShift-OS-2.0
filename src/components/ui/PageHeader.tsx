import type { ReactNode } from 'react';
import { cn } from '@/lib/cn';

type PageHeaderProps = {
  title: string;
  description?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
};

export function PageHeader({
  title,
  description,
  eyebrow,
  action,
  className,
}: PageHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-wrap items-end justify-between gap-3',
        className,
      )}
    >
      <div>
        {eyebrow && (
          <p className="text-sm font-medium text-[var(--color-text-muted)]">
            {eyebrow}
          </p>
        )}
        <h1
          className={cn(
            'font-semibold text-[var(--color-text)]',
            eyebrow ? 'mt-1 text-2xl' : 'text-2xl',
          )}
        >
          {title}
        </h1>
        {description && (
          <p className="mt-1 max-w-3xl text-sm text-[var(--color-text-muted)]">
            {description}
          </p>
        )}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}
