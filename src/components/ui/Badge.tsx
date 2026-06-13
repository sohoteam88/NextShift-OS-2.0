import * as React from 'react';
import { cn } from '@/lib/cn';

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export type BadgeProps = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: BadgeVariant;
  filled?: boolean;
};

const variants: Record<BadgeVariant, string> = {
  default: 'bg-gray-100 text-gray-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  info: 'bg-blue-50 text-blue-700',
};

const filledVariants: Record<BadgeVariant, string> = {
  default: 'bg-gray-600 text-white',
  success: 'bg-emerald-600 text-white',
  warning: 'bg-amber-500 text-white',
  danger: 'bg-red-600 text-white',
  info: 'bg-blue-600 text-white',
};

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'default', filled = false, ...props }, ref) => (
    <span
      ref={ref}
      className={cn(
        'inline-flex items-center rounded-[var(--radius-full)] px-2.5 py-0.5 text-xs font-medium',
        filled ? filledVariants[variant] : variants[variant],
        className,
      )}
      {...props}
    />
  ),
);

Badge.displayName = 'Badge';
