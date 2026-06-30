import type {
  MemberId,
  Workspace,
  WorkspaceId,
  WorkspaceMembership,
  WorkspacePermission,
  WorkspaceRole,
  WorkspaceType,
} from './types';
import { createLegacyWorkspace, createWorkspaceId } from './workspace-resolver';

export interface WorkspaceRepository {
  findById(workspaceId: WorkspaceId | string): Promise<Workspace | null>;
  findByMember(memberId: MemberId | string): Promise<readonly Workspace[]>;
  findDefaultWorkspace(tenantId: string): Promise<Workspace | null>;
  listMemberships(memberId: MemberId | string): Promise<readonly WorkspaceMembership[]>;
}

export class InMemoryWorkspaceRepository implements WorkspaceRepository {
  constructor(
    private readonly workspaces: readonly Workspace[] = [],
    private readonly memberships: readonly WorkspaceMembership[] = [],
  ) {}

  async findById(workspaceId: WorkspaceId | string): Promise<Workspace | null> {
    return this.workspaces.find((workspace) => workspace.workspaceId === workspaceId) ?? null;
  }

  async findByMember(memberId: MemberId | string): Promise<readonly Workspace[]> {
    const workspaceIds = new Set(
      this.memberships
        .filter((membership) => membership.memberId === memberId && membership.status === 'active')
        .map((membership) => membership.workspaceId),
    );

    return this.workspaces.filter(
      (workspace) => workspace.status === 'active' && workspaceIds.has(workspace.workspaceId),
    );
  }

  async findDefaultWorkspace(tenantId: string): Promise<Workspace | null> {
    return (
      this.workspaces.find(
        (workspace) =>
          workspace.tenantId === tenantId &&
          workspace.status === 'active' &&
          workspace.isDefault,
      ) ??
      this.workspaces.find(
        (workspace) => workspace.tenantId === tenantId && workspace.status === 'active',
      ) ??
      null
    );
  }

  async listMemberships(memberId: MemberId | string): Promise<readonly WorkspaceMembership[]> {
    return this.memberships.filter(
      (membership) => membership.memberId === memberId && membership.status === 'active',
    );
  }
}

export function createWorkspaceMembership(input: {
  tenantId: string;
  workspaceId: WorkspaceId | string;
  memberId: MemberId | string;
  role?: WorkspaceRole;
  permissions?: readonly WorkspacePermission[];
}): WorkspaceMembership {
  return {
    tenantId: input.tenantId,
    workspaceId: createWorkspaceId(String(input.workspaceId)),
    memberId: input.memberId as MemberId,
    role: input.role ?? 'owner',
    permissions: input.permissions ?? ['workspace:read'],
    status: 'active',
  };
}

export function createLegacyWorkspaceRepository(input: {
  tenantId: string;
  memberId?: MemberId | string | null;
  workspaceType?: WorkspaceType;
}): WorkspaceRepository {
  const workspace = createLegacyWorkspace(input.tenantId, input.workspaceType);
  const membership = input.memberId
    ? createWorkspaceMembership({
        tenantId: input.tenantId,
        workspaceId: workspace.workspaceId,
        memberId: input.memberId,
        role: 'owner',
        permissions: [
          'workspace:read',
          'workspace:manage',
          'dashboard:read',
          'crm:read',
          'content:read',
          'funnel:read',
          'landing:read',
          'analytics:read',
          'ai_coach:use',
        ],
      })
    : null;

  return new InMemoryWorkspaceRepository([workspace], membership ? [membership] : []);
}
