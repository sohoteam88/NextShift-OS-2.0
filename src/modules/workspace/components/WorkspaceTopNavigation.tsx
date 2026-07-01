'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useMemo } from 'react';
import { useOptionalWorkspaceContext } from '../WorkspaceProvider';
import { getWorkspacePresentationModel } from '../workspace-presentation';
import { cn } from '@/lib/cn';

type WorkspaceTopNavigationProps = {
  readonly className?: string;
};

export function WorkspaceTopNavigation({ className }: WorkspaceTopNavigationProps) {
  const workspace = useOptionalWorkspaceContext();
  const pathname = usePathname();
  const activeWorkspaceType = workspace?.workspaceContext.activeWorkspaceType;
  const model = useMemo(
    () => activeWorkspaceType ? getWorkspacePresentationModel(activeWorkspaceType) : null,
    [activeWorkspaceType],
  );

  if (!model || model.navigationItems.length === 0) return null;

  return (
    <nav className={cn('hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto xl:flex', className)} aria-label={`${model.workspaceName} navigation`}>
      {model.navigationItems.map((item) => {
        const active = pathname === item.route || pathname.startsWith(`${item.route}/`);

        return (
          <Link
            key={item.id}
            href={item.route}
            className={cn(
              'inline-flex h-10 shrink-0 items-center rounded-[var(--radius-md)] px-2 text-xs font-semibold transition-colors',
              active
                ? 'bg-blue-50 text-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
