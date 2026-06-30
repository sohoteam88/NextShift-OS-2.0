'use client';

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Workspace, WorkspaceContext } from './types';
import { resolveWorkspaceContext } from './workspace-resolver';
import { selectWorkspace } from './workspace-switcher';

interface WorkspaceProviderValue {
  readonly workspaceContext: WorkspaceContext;
  readonly workspaces: readonly Workspace[];
  readonly selectActiveWorkspace: (workspaceId: string) => void;
}

interface WorkspaceProviderProps {
  readonly tenantId: string;
  readonly workspaces?: readonly Workspace[];
  readonly initialWorkspaceId?: string | null;
  readonly children: ReactNode;
}

const WorkspaceContextState = createContext<WorkspaceProviderValue | null>(null);

export function WorkspaceProvider({
  tenantId,
  workspaces = [],
  initialWorkspaceId,
  children,
}: WorkspaceProviderProps) {
  const initialContext = useMemo(
    () =>
      resolveWorkspaceContext({
        tenantId,
        workspaces,
        preferredWorkspaceId: initialWorkspaceId,
      }),
    [initialWorkspaceId, tenantId, workspaces],
  );
  const [workspaceContext, setWorkspaceContext] = useState(initialContext);

  const selectActiveWorkspace = useCallback(
    (workspaceId: string) => {
      const selection = selectWorkspace(tenantId, workspaces, workspaceId);
      setWorkspaceContext(selection.workspaceContext);
    },
    [tenantId, workspaces],
  );

  const value = useMemo(
    () => ({
      workspaceContext,
      workspaces,
      selectActiveWorkspace,
    }),
    [selectActiveWorkspace, workspaceContext, workspaces],
  );

  return (
    <WorkspaceContextState.Provider value={value}>
      {children}
    </WorkspaceContextState.Provider>
  );
}

export function useWorkspaceContext(): WorkspaceProviderValue {
  const value = useContext(WorkspaceContextState);
  if (!value) {
    throw new Error('useWorkspaceContext must be used within WorkspaceProvider.');
  }

  return value;
}
