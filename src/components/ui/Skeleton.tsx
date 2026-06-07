import * as React from 'react';
import { cn } from '@/lib/cn';

export type SkeletonProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: 'rectangle' | 'circle';
};

export const Skeleton = React.forwardRef<HTMLDivElement, SkeletonProps>(
  ({ className, variant = 'rectangle', ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'animate-pulse bg-gray-200',
        variant === 'circle' ? 'rounded-[var(--radius-full)]' : 'rounded-[var(--radius-md)]',
        className,
      )}
      {...props}
    />
  ),
);

Skeleton.displayName = 'Skeleton';
