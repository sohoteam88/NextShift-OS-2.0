import { CAPABILITY_REGISTRY } from './workspace-config';
import type { EngineContextSkeleton, WorkspaceContext } from './types';

export function createWorkspaceEngineContext(
  workspaceContext: WorkspaceContext,
): EngineContextSkeleton {
  return {
    workspaceContext,
    templateNamespace: workspaceContext.templateNamespace,
    promptNamespace: workspaceContext.promptProfile.namespace,
    capabilityRegistry: CAPABILITY_REGISTRY,
  };
}
