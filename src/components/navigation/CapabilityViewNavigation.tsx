import Link from 'next/link';
import { cn } from '@/lib/cn';

export type CapabilityViewItem = {
  id: string;
  label: string;
  href: string;
};

export function CapabilityViewNavigation({
  activeId,
  items,
  label,
}: {
  activeId: string;
  items: readonly CapabilityViewItem[];
  label: string;
}) {
  return (
    <nav aria-label={label} className="mb-6 flex flex-wrap gap-2 rounded-xl border border-[var(--color-border)] bg-white p-2">
      {items.map((item) => (
        <Link
          key={item.id}
          href={item.href}
          aria-current={activeId === item.id ? 'page' : undefined}
          className={cn(
            'rounded-lg px-3 py-2 text-sm font-semibold transition-colors',
            activeId === item.id
              ? 'bg-[var(--color-primary)] text-white'
              : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
          )}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
