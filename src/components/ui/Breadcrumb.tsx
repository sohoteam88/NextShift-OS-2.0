import Link from 'next/link';
import { ChevronRight } from 'lucide-react';
import { cn } from '@/lib/cn';

export type BreadcrumbItem = {
  label: string;
  href?: string;
};

type BreadcrumbProps = {
  items: BreadcrumbItem[];
  className?: string;
};

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" className={cn('flex items-center gap-1.5', className)}>
      {items.map((item, i) => {
        const isLast = i === items.length - 1;

        return (
          <span key={`${item.label}-${i}`} className="flex items-center gap-1.5">
            {i > 0 && (
              <ChevronRight
                className="h-3.5 w-3.5 text-[var(--color-text-muted)]"
                aria-hidden="true"
              />
            )}
            {item.href && !isLast ? (
              <Link
                href={item.href}
                className="text-xs font-medium text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-primary)]"
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  'text-xs font-medium',
                  isLast
                    ? 'text-[var(--color-text)]'
                    : 'text-[var(--color-text-muted)]',
                )}
              >
                {item.label}
              </span>
            )}
          </span>
        );
      })}
    </nav>
  );
}
