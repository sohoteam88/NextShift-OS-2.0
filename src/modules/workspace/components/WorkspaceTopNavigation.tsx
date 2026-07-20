'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';
import { useOptionalWorkspaceContext } from '../WorkspaceProvider';
import {
  getMemberNavigationLabel,
  isMemberNavigationActive,
  MEMBER_PRIMARY_NAVIGATION,
} from '@/config/canonical-routes';
import { cn } from '@/lib/cn';

type WorkspaceTopNavigationProps = {
  readonly className?: string;
};

export function WorkspaceTopNavigation({ className }: WorkspaceTopNavigationProps) {
  const workspace = useOptionalWorkspaceContext();
  const pathname = usePathname();
  const locale = useLocale();
  const workspaceMode = workspace?.workspaceContext.activeWorkspaceType;
  const workspaceName = workspace?.workspaces.find(
    (item) => item.workspaceId === workspace.workspaceContext.activeWorkspaceId,
  )?.displayName ?? 'Member';

  return (
    <nav className={cn('hidden min-w-0 flex-1 items-center justify-center gap-1 overflow-x-auto xl:flex', className)} aria-label={`${workspaceName} navigation`}>
      {MEMBER_PRIMARY_NAVIGATION.map((item) => {
        const active = isMemberNavigationActive(pathname, item.href);

        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={active ? 'page' : undefined}
            className={cn(
              'inline-flex h-10 shrink-0 items-center rounded-[var(--radius-md)] px-2 text-xs font-semibold transition-colors',
              active
                ? 'bg-blue-50 text-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
            )}
          >
            {getMemberNavigationLabel(item, locale, workspaceMode)}
          </Link>
        );
      })}
    </nav>
  );
}
