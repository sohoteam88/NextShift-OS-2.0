import type {
  MemberId,
  ResolveWorkspaceContextInput,
  Workspace,
  WorkspaceContext,
  WorkspaceId,
  WorkspaceType,
} from './types';
import { getWorkspaceConfig } from './workspace-config';

const LEGACY_WORKSPACE_SUFFIX = 'legacy-default-workspace';

export function createWorkspaceId(value: string): WorkspaceId {
  const normalized = value.trim();
  if (!normalized) {
    throw new Error('Workspace ID is required.');
  }

  return normalized as WorkspaceId;
}

export function createLegacyWorkspace(
  tenantId: string,
  workspaceType: WorkspaceType = 'retail',
): Workspace {
  if (!tenantId.trim()) {
    throw new Error('Tenant ID is required to resolve a workspace.');
  }

  return {
    workspaceId: createWorkspaceId(`${tenantId}:${LEGACY_WORKSPACE_SUFFIX}`),
    tenantId,
    workspaceType,
    status: 'active',
    displayName: getWorkspaceConfig(workspaceType).label,
    isDefault: true,
  };
}

export function resolveActiveWorkspace(input: ResolveWorkspaceContextInput): Workspace {
  const activeWorkspaces = (input.workspaces ?? []).filter(
    (workspace) => workspace.status === 'active',
  );

  const preferred = input.preferredWorkspaceId
    ? activeWorkspaces.find((workspace) => workspace.workspaceId === input.preferredWorkspaceId)
    : undefined;

  if (preferred) {
    return preferred;
  }

  const defaultWorkspace = activeWorkspaces.find((workspace) => workspace.isDefault);
  if (defaultWorkspace) {
    return defaultWorkspace;
  }

  const firstWorkspace = activeWorkspaces[0];
  if (firstWorkspace) {
    return firstWorkspace;
  }

  return createLegacyWorkspace(input.tenantId, input.legacyWorkspaceType);
}

export function resolveWorkspaceContext(input: ResolveWorkspaceContextInput): WorkspaceContext {
  const activeWorkspace = resolveActiveWorkspace(input);
  const workspaceConfig = getWorkspaceConfig(activeWorkspace.workspaceType);
  const activeMembership = input.memberId
    ? input.memberships?.find(
        (membership) =>
          membership.workspaceId === activeWorkspace.workspaceId &&
          membership.memberId === (input.memberId as MemberId) &&
          membership.status === 'active',
      )
    : undefined;
  const memberId = input.memberId ? (input.memberId as MemberId) : activeMembership?.memberId;
  const permissions = activeMembership?.permissions ?? ['workspace:read'];

  return {
    workspaceId: activeWorkspace.workspaceId,
    workspaceType: activeWorkspace.workspaceType,
    memberId,
    membership: activeMembership,
    role: activeMembership?.role,
    permissions,
    capabilities: workspaceConfig.enabledCapabilities,
    templateNamespace: workspaceConfig.templateNamespace,
    themeKey: workspaceConfig.themeKey,
    promptProfile: workspaceConfig.promptProfile,
    activeWorkspaceId: activeWorkspace.workspaceId,
    activeWorkspaceType: activeWorkspace.workspaceType,
    activeMembership,
    workspaceConfig,
    enabledCapabilities: workspaceConfig.enabledCapabilities,
    navigationContext: workspaceConfig.navigation,
    dashboardContext: workspaceConfig.dashboard,
    crmContext: workspaceConfig.crm,
    funnelContext: workspaceConfig.funnel,
    landingContext: workspaceConfig.landing,
    contentContext: workspaceConfig.content,
    analyticsContext: workspaceConfig.analytics,
    aiContext: workspaceConfig.ai,
  };
}
