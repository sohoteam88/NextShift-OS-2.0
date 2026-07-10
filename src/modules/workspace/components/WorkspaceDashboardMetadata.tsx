'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { Brain, ClipboardList, LayoutTemplate, Sparkles } from 'lucide-react';
import { useOptionalWorkspaceContext } from '../WorkspaceProvider';
import { getWorkspacePresentationModel } from '../workspace-presentation';

function labelFromCapability(value: string) {
  return value
    .split('_')
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(' ');
}

export function WorkspaceDashboardMetadata() {
  const workspace = useOptionalWorkspaceContext();
  const activeWorkspaceType = workspace?.workspaceContext.activeWorkspaceType;
  const model = useMemo(
    () => activeWorkspaceType ? getWorkspacePresentationModel(activeWorkspaceType) : null,
    [activeWorkspaceType],
  );

  if (!model) return null;

  return (
    <section className="space-y-4 rounded-[var(--radius-lg)] border border-[var(--color-border)] bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--color-text-muted)]">Workspace OS</p>
          <h2 className="text-xl font-bold text-[var(--color-text)]">{model.workspaceName}</h2>
        </div>
        <div className="text-sm text-[var(--color-text-muted)]">
          {model.businessCapabilities.length} capabilities
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {model.dashboardWidgets.map((widget) => (
          <Link
            key={widget.id}
            href={widget.route}
            className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4 transition-colors hover:border-blue-200 hover:bg-blue-50"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
              <ClipboardList className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
              {widget.title}
            </div>
            <p className="mt-2 text-xs text-[var(--color-text-muted)]">{labelFromCapability(widget.metric)}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Sparkles className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            Capabilities
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {model.businessCapabilities.map((capability) => (
              <span key={capability} className="rounded-full bg-[var(--color-surface)] px-2.5 py-1 text-xs font-medium text-[var(--color-text-muted)]">
                {labelFromCapability(capability)}
              </span>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <LayoutTemplate className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            Templates
          </div>
          <div className="mt-3 space-y-2">
            {model.templates.map((template) => (
              <div key={template.id} className="text-xs">
                <p className="font-semibold text-[var(--color-text)]">{template.name}</p>
                <p className="truncate text-[var(--color-text-muted)]">{template.purpose}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[var(--radius-md)] border border-[var(--color-border)] p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-[var(--color-text)]">
            <Brain className="h-4 w-4 text-[var(--color-primary)]" aria-hidden="true" />
            AI Profile
          </div>
          <p className="mt-3 text-xs leading-relaxed text-[var(--color-text-muted)]">
            {model.aiProfile?.mission ?? model.aiCooProfile?.mission ?? 'Workspace AI profile is available through the registry.'}
          </p>
        </div>
      </div>
    </section>
  );
}
