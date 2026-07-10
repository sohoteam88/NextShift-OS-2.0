import type { Workspace, WorkspaceContext, WorkspaceId } from './types';
import { resolveWorkspaceContext } from './workspace-resolver';

export interface WorkspaceSelectionState {
  readonly activeWorkspaceId: WorkspaceId;
  readonly workspaceContext: WorkspaceContext;
}

export function selectWorkspace(
  tenantId: string,
  workspaces: readonly Workspace[],
  selectedWorkspaceId: string,
): WorkspaceSelectionState {
  const selectedWorkspace = workspaces.find(
    (workspace) =>
      workspace.workspaceId === selectedWorkspaceId && workspace.status === 'active',
  );

  if (!selectedWorkspace) {
    throw new Error('Selected workspace is not available.');
  }

  const workspaceContext = resolveWorkspaceContext({
    tenantId,
    workspaces,
    preferredWorkspaceId: selectedWorkspace.workspaceId,
  });

  return {
    activeWorkspaceId: selectedWorkspace.workspaceId,
    workspaceContext,
  };
}
