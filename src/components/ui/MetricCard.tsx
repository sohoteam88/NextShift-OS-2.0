import type { ElementType, ReactNode } from 'react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

type MetricCardProps = {
  label: string;
  value: string | number;
  helper?: string;
  icon?: ElementType;
  trend?: {
    direction: 'up' | 'down';
    value: string;
  };
  href?: string;
  className?: string;
  children?: ReactNode;
};

export function MetricCard({
  label,
  value,
  helper,
  icon: Icon,
  trend,
  href,
  className,
  children,
}: MetricCardProps) {
  const content = (
    <>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm text-[var(--color-text-muted)]">{label}</span>
        {Icon && (
          <Icon
            className="h-4 w-4 text-[var(--color-primary)]"
            aria-hidden="true"
          />
        )}
      </div>
      <p className="mt-3 text-3xl font-semibold text-[var(--color-text)]">
        {value}
      </p>
      {trend && (
        <p
          className={cn(
            'mt-1 text-xs font-medium',
            trend.direction === 'up'
              ? 'text-emerald-600'
              : 'text-rose-600',
          )}
        >
          {trend.direction === 'up' ? '↑' : '↓'} {trend.value}
        </p>
      )}
      {helper && !trend && (
        <p className="mt-1 text-xs text-[var(--color-text-muted)]">
          {helper}
        </p>
      )}
      {children}
    </>
  );

  const cardClasses = cn(
    'rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-4 shadow-sm',
    href && 'transition-shadow hover:shadow-md',
    className,
  );

  if (href) {
    return (
      <Link href={href} className={cn(cardClasses, 'block')}>
        {content}
      </Link>
    );
  }

  return <div className={cardClasses}>{content}</div>;
}
