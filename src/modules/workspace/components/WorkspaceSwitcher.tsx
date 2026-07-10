'use client';

import { useOptionalWorkspaceContext } from '../WorkspaceProvider';
import { cn } from '@/lib/cn';

type WorkspaceSwitcherProps = {
  readonly className?: string;
};

export function WorkspaceSwitcher({ className }: WorkspaceSwitcherProps) {
  const workspace = useOptionalWorkspaceContext();

  if (!workspace || workspace.workspaces.length <= 1) return null;

  return (
    <div className={cn('hidden items-center gap-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-white p-1 lg:flex', className)}>
      {workspace.workspaces.map((item) => {
        const active = item.workspaceId === workspace.workspaceContext.activeWorkspaceId;

        return (
          <button
            key={item.workspaceId}
            type="button"
            onClick={() => workspace.selectActiveWorkspace(item.workspaceId)}
            className={cn(
              'h-8 rounded-[var(--radius-sm)] px-3 text-xs font-semibold transition-colors',
              active
                ? 'bg-blue-50 text-[var(--color-primary)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-surface)] hover:text-[var(--color-text)]',
            )}
          >
            {item.displayName.replace(' Business OS', '')}
          </button>
        );
      })}
    </div>
  );
}
