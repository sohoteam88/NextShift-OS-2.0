import type { NextRequest } from 'next/server';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { Workspace, WorkspaceContext, WorkspaceId, WorkspaceType } from './types';
import { resolveWorkspaceContext } from './workspace-resolver';
import {
  createLegacyWorkspaceRepository,
  type WorkspaceRepository,
} from './workspace-repository';

interface ResolveRequestWorkspaceContextInput {
  readonly user: Pick<AuthUser, 'id' | 'tenantId'>;
  readonly request?: NextRequest;
  readonly body?: unknown;
  readonly workspaceId?: string | null;
  readonly legacyWorkspaceType?: WorkspaceType;
  readonly repository?: WorkspaceRepository;
}

function isObjectMap(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
}

function workspaceIdFromBody(body: unknown): string | null {
  if (!isObjectMap(body)) return null;
  const value = body.workspaceId;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function workspaceIdFromRequest(request?: NextRequest): string | null {
  if (!request) return null;
  const headerValue = request.headers.get('x-workspace-id');
  if (headerValue?.trim()) return headerValue.trim();

  const queryValue = request.nextUrl.searchParams.get('workspaceId');
  return queryValue?.trim() || null;
}

function uniqueWorkspaces(workspaces: readonly (Workspace | null)[]): readonly Workspace[] {
  const seen = new Set<WorkspaceId>();
  return workspaces.filter((workspace): workspace is Workspace => {
    if (!workspace || seen.has(workspace.workspaceId)) return false;
    seen.add(workspace.workspaceId);
    return true;
  });
}

export async function resolveRequestWorkspaceContext({
  user,
  request,
  body,
  workspaceId,
  legacyWorkspaceType,
  repository,
}: ResolveRequestWorkspaceContextInput): Promise<WorkspaceContext> {
  const preferredWorkspaceId =
    workspaceId?.trim() ||
    workspaceIdFromBody(body) ||
    workspaceIdFromRequest(request);

  const workspaceRepository =
    repository ??
    createLegacyWorkspaceRepository({
      tenantId: user.tenantId,
      memberId: user.id,
      workspaceType: legacyWorkspaceType,
    });

  const [memberships, memberWorkspaces, preferredWorkspace, defaultWorkspace] = await Promise.all([
    workspaceRepository.listMemberships(user.id),
    workspaceRepository.findByMember(user.id),
    preferredWorkspaceId ? workspaceRepository.findById(preferredWorkspaceId) : Promise.resolve(null),
    workspaceRepository.findDefaultWorkspace(user.tenantId),
  ]);

  return resolveWorkspaceContext({
    tenantId: user.tenantId,
    memberId: user.id,
    preferredWorkspaceId,
    legacyWorkspaceType,
    memberships,
    workspaces: uniqueWorkspaces([
      preferredWorkspace,
      defaultWorkspace,
      ...memberWorkspaces,
    ]),
  });
}
