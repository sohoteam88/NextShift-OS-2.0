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
  getWorkspacePresentationModel,
} from '@/modules/workspace/workspace-presentation';
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

  it('exposes Retail Business OS configuration through the manifest registry', () => {
    const retailConfig = defaultWorkspaceRegistry.getConfiguration('retail');
    const retailNavigation = defaultWorkspaceRegistry.getNavigationItems('retail');
    const retailWidgets = defaultWorkspaceRegistry.getDashboardWidgets('retail');
    const retailTemplates = defaultWorkspaceRegistry.getTemplates('retail');
    const retailAIProfile = defaultWorkspaceRegistry.getAIProfile('retail');
    const retailAICOOProfile = defaultWorkspaceRegistry.getAICOOProfile('retail');

    expect(retailConfig.workspaceName).toBe('Retail Business OS');
    expect(retailConfig.label).toBe('Retail Business OS');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('retail')).toContain('repeat_purchase');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('retail')).toContain('referral');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('retail')).toContain('ai_coo');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('retail')).toContain('lead_magnet');
    expect(retailNavigation.map((item) => item.id)).toContain('retail_offer_builder');
    expect(retailNavigation.map((item) => item.id)).toContain('retail_ai_coo');
    expect(retailNavigation.map((item) => item.id)).toContain('retail_customer_journey');
    expect(retailWidgets.map((widget) => widget.id)).toContain('retail_repeat_purchase_health');
    expect(retailWidgets.map((widget) => widget.id)).toContain('retail_ai_coo_recommendations');
    expect(retailTemplates.map((template) => template.id)).toContain('retail_offer_landing_page');
    expect(retailTemplates.map((template) => template.id)).toContain('retail_lead_magnet_education');
    expect(retailAIProfile?.guardrails).toContain('Do not introduce recruitment or duplication language.');
    expect(retailAICOOProfile?.directives).toContain('Prioritize sales, customer pipeline, retention, repeat orders, referral activity, and funnel conversion.');
  });

  it('exposes Recruitment Business OS configuration through the manifest registry', () => {
    const recruitmentConfig = defaultWorkspaceRegistry.getConfiguration('recruitment');
    const recruitmentNavigation = defaultWorkspaceRegistry.getNavigationItems('recruitment');
    const recruitmentWidgets = defaultWorkspaceRegistry.getDashboardWidgets('recruitment');
    const recruitmentTemplates = defaultWorkspaceRegistry.getTemplates('recruitment');
    const recruitmentAIProfile = defaultWorkspaceRegistry.getAIProfile('recruitment');
    const recruitmentAICOOProfile = defaultWorkspaceRegistry.getAICOOProfile('recruitment');

    expect(recruitmentConfig.workspaceName).toBe('Recruitment Business OS');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('recruitment')).toContain('duplication');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('recruitment')).toContain('leadership');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('recruitment')).toContain('webinar');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('recruitment')).toContain('fast_start');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('recruitment')).toContain('personal_brand');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('recruitment')).toContain('authority_building');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('recruitment')).toContain('lead_generation');
    expect(defaultWorkspaceRegistry.getBusinessCapabilities('recruitment')).toContain('team_building');
    expect(recruitmentNavigation.map((item) => item.id)).toContain('recruitment_leads');
    expect(recruitmentNavigation.map((item) => item.id)).toContain('recruitment_opportunity_funnel');
    expect(recruitmentNavigation.map((item) => item.id)).toContain('recruitment_ai_coo');
    expect(recruitmentNavigation.map((item) => item.id)).toContain('recruitment_duplication');
    expect(recruitmentWidgets.map((widget) => widget.id)).toContain('recruitment_webinar_readiness');
    expect(recruitmentWidgets.map((widget) => widget.id)).toContain('recruitment_team_growth');
    expect(recruitmentWidgets.map((widget) => widget.id)).toContain('recruitment_ai_coo_recommendations');
    expect(recruitmentTemplates.map((template) => template.id)).toContain('recruitment_opportunity_landing_page');
    expect(recruitmentTemplates.map((template) => template.id)).toContain('recruitment_authority_building_post');
    expect(recruitmentTemplates.map((template) => template.id)).toContain('recruitment_webinar_invitation');
    expect(recruitmentAIProfile?.guardrails).toContain('Do not introduce retail customer-only framing.');
    expect(recruitmentAICOOProfile?.directives).toContain('Prioritize lead pipeline, appointments, presentations, activation, duplication, webinar readiness, and leadership growth.');
  });

  it('builds distinct workspace presentation models from registry metadata', () => {
    const retail = getWorkspacePresentationModel('retail');
    const recruitment = getWorkspacePresentationModel('recruitment');

    expect(retail.workspaceName).toBe('Retail Business OS');
    expect(recruitment.workspaceName).toBe('Recruitment Business OS');
    expect(retail.navigationItems.map((item) => item.id)).toContain('retail_customers');
    expect(recruitment.navigationItems.map((item) => item.id)).toContain('recruitment_leads');
    expect(retail.dashboardWidgets.map((widget) => widget.id)).toContain('retail_repeat_purchase_health');
    expect(recruitment.dashboardWidgets.map((widget) => widget.id)).toContain('recruitment_team_growth');
    expect(retail.templates.map((template) => template.id)).toContain('retail_lead_magnet_education');
    expect(recruitment.templates.map((template) => template.id)).toContain('recruitment_authority_building_post');
    expect(retail.businessCapabilities).toContain('customer_success');
    expect(recruitment.businessCapabilities).toContain('authority_building');
  });

  it('falls back to legacy retail presentation metadata for unknown workspace types', () => {
    const fallback = getWorkspacePresentationModel('unknown-workspace');

    expect(fallback.workspaceType).toBe('unknown-workspace');
    expect(fallback.workspaceName).toBe('Retail Business OS');
    expect(fallback.navigationItems.map((item) => item.id)).toContain('retail_dashboard');
    expect(fallback.dashboardWidgets.map((widget) => widget.id)).toContain('retail_customer_pipeline');
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
