import { describe, expect, it } from 'vitest';
import {
  createWorkspaceId,
  resolveWorkspaceContext,
} from '@/modules/workspace/workspace-resolver';
import {
  InMemoryWorkspaceRepository,
} from '@/modules/workspace/workspace-repository';
import {
  defaultWorkspaceRegistry,
} from '@/modules/workspace/workspace-registry';
import {
  resolveRequestWorkspaceContext,
} from '@/modules/workspace/request-workspace-context';
import {
  createWorkspaceEngineContext,
} from '@/modules/workspace/workspace-engine-context';
import {
  selectWorkspace,
} from '@/modules/workspace/workspace-switcher';
import {
  type Workspace,
  type WorkspaceMembership,
} from '@/modules/workspace/types';

const tenantId = 'tenant-1';

const retailWorkspace: Workspace = {
  workspaceId: createWorkspaceId('workspace-retail'),
  tenantId,
  workspaceType: 'retail',
  status: 'active',
  displayName: 'Retail',
  isDefault: true,
};

const recruitmentWorkspace: Workspace = {
  workspaceId: createWorkspaceId('workspace-recruitment'),
  tenantId,
  workspaceType: 'recruitment',
  status: 'active',
  displayName: 'Recruitment',
};

const retailMembership: WorkspaceMembership = {
  workspaceId: retailWorkspace.workspaceId,
  tenantId,
  memberId: 'member-1' as WorkspaceMembership['memberId'],
  role: 'owner',
  permissions: ['workspace:read', 'crm:read', 'landing:read'],
  status: 'active',
};

describe('workspace context resolver', () => {
  it('resolves the default legacy workspace when no workspace records exist', () => {
    const context = resolveWorkspaceContext({ tenantId });

    expect(context.activeWorkspaceId).toBe('tenant-1:legacy-default-workspace');
    expect(context.workspaceId).toBe(context.activeWorkspaceId);
    expect(context.activeWorkspaceType).toBe('retail');
    expect(context.workspaceType).toBe('retail');
    expect(context.capabilities).toContain('crm');
    expect(context.templateNamespace).toBe('retail');
    expect(context.themeKey).toBe('retail');
  });

  it('resolves a preferred workspace through configuration', () => {
    const context = resolveWorkspaceContext({
      tenantId,
      workspaces: [retailWorkspace, recruitmentWorkspace],
      memberships: [retailMembership],
      memberId: 'member-1',
      preferredWorkspaceId: recruitmentWorkspace.workspaceId,
    });

    expect(context.activeWorkspaceId).toBe(recruitmentWorkspace.workspaceId);
    expect(context.activeWorkspaceType).toBe('recruitment');
    expect(context.dashboardContext.focus).toContain('activation');
    expect(context.contentContext.focus).toContain('opportunity education');
    expect(context.landingContext.language).toContain('duplication path');
  });

  it('switches workspace without duplicating engine state', () => {
    const selection = selectWorkspace(
      tenantId,
      [retailWorkspace, recruitmentWorkspace],
      recruitmentWorkspace.workspaceId,
    );

    expect(selection.workspaceContext.activeWorkspaceType).toBe('recruitment');
    expect(selection.workspaceContext.navigationContext.capabilityRoutes.crm).toBe('/crm-center');
  });

  it('rejects inactive workspace selection', () => {
    expect(() =>
      selectWorkspace(
        tenantId,
        [{ ...retailWorkspace, status: 'archived' }],
        retailWorkspace.workspaceId,
      ),
    ).toThrow('Selected workspace is not available.');
  });

  it('exposes workspace repository lookup methods', async () => {
    const repository = new InMemoryWorkspaceRepository(
      [retailWorkspace, recruitmentWorkspace],
      [retailMembership],
    );

    await expect(repository.findById(retailWorkspace.workspaceId)).resolves.toEqual(retailWorkspace);
    await expect(repository.findByMember(retailMembership.memberId)).resolves.toEqual([retailWorkspace]);
    await expect(repository.findDefaultWorkspace(tenantId)).resolves.toEqual(retailWorkspace);
    await expect(repository.listMemberships(retailMembership.memberId)).resolves.toEqual([retailMembership]);
  });

  it('resolves manifest-backed registry profiles', () => {
    expect(defaultWorkspaceRegistry.getTemplateNamespace('recruitment')).toBe('recruitment');
    expect(defaultWorkspaceRegistry.getThemeKey('recruitment')).toBe('recruitment');
    expect(defaultWorkspaceRegistry.getNavigation('retail').capabilityRoutes.landing).toBe('/funnel-builder');
    expect(defaultWorkspaceRegistry.getCapabilityProfile('retail', 'landing').focus).toContain('lead capture');
    expect(defaultWorkspaceRegistry.getPromptProfile('recruitment').namespace).toBe('recruitment');
  });

  it('resolves request workspace context through repository records', async () => {
    const repository = new InMemoryWorkspaceRepository(
      [retailWorkspace, recruitmentWorkspace],
      [
        retailMembership,
        {
          workspaceId: recruitmentWorkspace.workspaceId,
          tenantId,
          memberId: retailMembership.memberId,
          role: 'leader',
          permissions: ['workspace:read', 'content:read'],
          status: 'active',
        },
      ],
    );

    const context = await resolveRequestWorkspaceContext({
      user: { id: retailMembership.memberId, tenantId },
      body: { workspaceId: recruitmentWorkspace.workspaceId },
      repository,
    });

    expect(context.workspaceId).toBe(recruitmentWorkspace.workspaceId);
    expect(context.workspaceType).toBe('recruitment');
    expect(context.role).toBe('leader');
    expect(context.permissions).toContain('content:read');
  });

  it('creates a normalized engine context from workspace context', () => {
    const workspaceContext = resolveWorkspaceContext({ tenantId, legacyWorkspaceType: 'recruitment' });
    const engineContext = createWorkspaceEngineContext(workspaceContext);

    expect(engineContext.workspaceContext.workspaceType).toBe('recruitment');
    expect(engineContext.templateNamespace).toBe('recruitment');
    expect(engineContext.promptNamespace).toBe('recruitment');
    expect(engineContext.capabilityRegistry.some((entry) => entry.capability === 'landing')).toBe(true);
  });
});
