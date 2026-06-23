import { beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import { missionService } from '@/modules/mission/services/mission-service';
import { getMissionExecutionWorkspace } from '@/modules/mission-workspace/services/MissionExecutionWorkspaceService';

vi.mock('@/modules/mission-engine/services/MissionEngineAuthorityService', () => ({
  missionEngineAuthorityService: {
    getCurrentMission: vi.fn(),
  },
}));

vi.mock('@/modules/mission/services/mission-service', () => ({
  missionService: {
    getState: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({
  default: {
    auditLog: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const user: AuthUser = {
  id: 'user_1',
  email: 'user@example.com',
  tenantId: 'tenant_1',
  role: 'member',
  name: 'User',
  preferredLanguage: 'zh',
  status: 'active',
};

const authority: MissionAuthoritySnapshot = {
  source: 'MissionEngineAuthorityService',
  scope: 'user',
  confidence: 'derived',
  fallback: 'none',
  currentJourney: { type: 'retail', title: 'Retail Journey', reason: 'Selected from business state.' },
  businessStage: 'LEAD_MAGNET',
  bottleneck: 'NO_LEAD_MAGNET',
  bottleneckResult: {
    bottleneck: 'NO_LEAD_MAGNET',
    confidence: 80,
    evidence: ['leadMagnetExists=false'],
    severity: 'High',
    explainability: 'internal_diagnostic:NO_LEAD_MAGNET',
  },
  bottleneckSignals: {
    validationFailed: false,
    signalSourceAvailable: true,
    requiredMetricsResolved: true,
    leadMagnetExists: true,
    leadMagnetPublished: true,
    leadMagnetCtaExists: false,
    leadCount: 0,
  },
  priorityResult: {
    priorityAction: 'Create Lead Magnet',
    priorityReason: 'The business needs a lead capture asset.',
    expectedImpact: 'Qualified visitors can become leads.',
    urgency: 'High',
    confidence: 82,
    category: 'LEADS',
    missionType: 'LEAD_MAGNET',
    route: '/lead-magnet',
    ctaLabel: '生成引流资源',
  },
  currentMission: {
    id: 'MISSION_005',
    title: '引流磁铁',
    description: 'Create a lead magnet.',
    expectedOutcome: 'Capture qualified leads.',
    estimatedMinutes: 20,
    status: 'active',
    priority: 70,
    unlockConditions: [],
    completionConditions: ['lead_magnet_created'],
    route: '/lead-magnet',
  },
  nextMission: null,
  priorityAction: {
    missionType: 'LEAD_MAGNET',
    title: 'Create Lead Magnet',
    route: '/lead-magnet',
    ctaLabel: '生成引流资源',
    priority: 'High',
  },
  explainability: {
    locale: 'zh',
    source: 'ExplainabilityEngine',
    completed: ['品牌访谈'],
    currentGap: 'NO_LEAD_MAGNET',
    reasoning: 'Create a lead magnet first.',
    decisionReason: 'Other work can wait.',
    whyThis: 'The current bottleneck is lead capture.',
    whyNow: 'Existing attention needs conversion.',
    whyNotOthers: 'Traffic can wait.',
    expectedOutcome: 'Lead magnet exists.',
    expectedRisk: 'Visitors leave without follow-up.',
    nextMilestone: '建立漏斗',
    evidence: ['leadMagnetExists=false'],
    severity: 'High',
    confidence: 80,
  },
  missionPlan: {
    id: 'mission-plan-lead_magnet',
    objective: 'Create Your First Lead Magnet',
    description: 'Build a lead capture asset that encourages prospects to exchange contact information.',
    steps: [
      { id: 'leadMagnet.type', title: 'Select Lead Magnet Type', description: 'Choose the format.', estimatedMinutes: 5, required: true },
      { id: 'leadMagnet.content', title: 'Generate Lead Magnet Content', description: 'Create the asset copy.', estimatedMinutes: 15, required: true },
      { id: 'leadMagnet.publish', title: 'Publish Lead Magnet', description: 'Publish the asset.', estimatedMinutes: 10, required: true },
      { id: 'leadMagnet.cta', title: 'Connect CTA', description: 'Connect the CTA.', estimatedMinutes: 5, required: true },
    ],
    estimatedTime: 35,
    successCriteria: ['Lead Magnet Exists', 'Lead Magnet Published', 'CTA Active'],
    completionChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
    route: '/lead-magnet',
    missionType: 'LEAD_MAGNET',
    nextMilestone: '建立漏斗',
  },
  missionCompletion: {
    completed: false,
    completionPercentage: 66,
    completionChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
    passedChecks: ['leadMagnet.exists', 'leadMagnet.published'],
    failedChecks: ['cta.active'],
    missingChecks: ['cta.active'],
    nextRequiredCheck: 'cta.active',
    verificationStatus: 'BLOCKED',
    verificationSource: 'signal',
    verifiedAt: '2026-06-22T00:00:00.000Z',
    source: 'MissionCompletionVerifier',
  },
  dashboardCommandCenter: {
    currentStage: 'LEAD_MAGNET',
    missionTitle: 'Create Your First Lead Magnet',
    missionDescription: 'Build a lead capture asset.',
    reasoning: 'Create a lead magnet first.',
    expectedOutcome: 'Lead magnet exists.',
    estimatedTime: '35 分钟',
    route: '/lead-magnet',
    ctaLabel: '生成引流资源',
    decisionReason: 'Other work can wait.',
    priority: 'High',
  },
  lifecycle: 'ACTIVE',
  progress: {
    completionPercentage: 50,
    completedMissions: 4,
    totalMissions: 8,
    nextMilestone: '建立漏斗',
    progressPath: [],
  },
  estimatedCompletion: { minutes: 35, label: '35 分钟' },
};

describe('EXEC-001 Mission Execution Workspace', () => {
  beforeEach(() => {
    vi.mocked(missionEngineAuthorityService.getCurrentMission).mockResolvedValue(authority);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
    vi.mocked(prisma.auditLog.findFirst).mockResolvedValue({ id: 'existing-workforce-plan-audit' } as never);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({ id: 'audit-created' } as never);
    vi.mocked(missionService.getState).mockResolvedValue({
      currentStage: null,
      nextStage: null,
      progressPercent: 50,
      totalXP: 40,
      completedChecks: ['workspace.step.lead_magnet.1.leadMagnet_type'],
      mode: 'guided',
      isJourneyComplete: false,
      estimatedTimeToNext: '约 20 分钟',
      estimatedTimeToFirstLead: null,
      estimatedTimeToFirstSale: null,
    });
  });

  it('renders the mission plan as an execution workspace', async () => {
    const workspace = await getMissionExecutionWorkspace(user, 'mission-plan-lead_magnet');

    expect(workspace).toMatchObject({
      missionId: 'mission-plan-lead_magnet',
      objective: 'Create Your First Lead Magnet',
      missionType: 'LEAD_MAGNET',
      priority: 'High',
      sourceRoute: '/lead-magnet',
      verificationStatus: 'BLOCKED',
      nextMilestone: '建立漏斗',
      progress: {
        completionPercentage: 66,
        completedSteps: 1,
        remainingSteps: 3,
      },
    });
    expect(workspace.steps).toHaveLength(4);
    expect(workspace.steps[0]).toMatchObject({
      title: 'Select Lead Magnet Type',
      state: 'COMPLETED',
    });
    expect(workspace.steps[1]).toMatchObject({
      title: 'Generate Lead Magnet Content',
      state: 'IN_PROGRESS',
    });
  });

  it('uses workspace step keys instead of mission completion checks', async () => {
    const workspace = await getMissionExecutionWorkspace(user, 'mission-plan-lead_magnet');

    expect(workspace.steps.map((step) => step.stepCheckKey)).not.toContain('leadMagnet.exists');
    expect(workspace.steps[0].stepCheckKey).toBe('workspace.step.lead_magnet.1.leadMagnet_type');
    expect(workspace.completion.failedChecks).toEqual(['cta.active']);
  });

  it('renders required assets, generated assets, and agent support', async () => {
    const workspace = await getMissionExecutionWorkspace(user, 'mission-plan-lead_magnet');

    expect(workspace.requiredAssets).toEqual([
      expect.objectContaining({ title: 'Lead Magnet Asset', status: 'ready', checkKey: 'leadMagnet.exists' }),
      expect.objectContaining({ title: 'Published Lead Magnet', status: 'ready', checkKey: 'leadMagnet.published' }),
      expect.objectContaining({ title: 'Active CTA', status: 'missing', checkKey: 'cta.active' }),
    ]);
    expect(workspace.generatedAssets[0]).toMatchObject({
      title: 'Select Lead Magnet Type',
      status: 'generated',
    });
    expect(workspace.agentSupport.map((agent) => agent.name)).toEqual(['Lead Magnet Agent', 'Funnel Agent']);
    expect(workspace.workforcePlan).toMatchObject({
      missionId: 'mission-plan-lead_magnet',
      missionType: 'LEAD_MAGNET',
      mode: 'hybrid',
      verificationBoundary: 'workforce_completion_not_mission_completion',
    });
    expect(workspace.workforcePlan.agents.map((assignment) => assignment.agentName)).toEqual([
      'Lead Magnet Agent',
      'Funnel Agent',
      'CRM Agent',
    ]);
    expect(workspace.businessOutcome).toMatchObject({
      id: 'outcome-first_lead',
      templateId: 'FIRST_LEAD',
      name: 'Acquire First Lead',
      status: 'ACTIVE',
      verificationBoundary: 'outcome_completion_requires_missions_and_signal',
      requiredSignal: expect.objectContaining({
        id: 'leadCount',
        currentValue: 0,
        verified: false,
      }),
    });
    expect(workspace.businessOutcome.missions.map((mission) => mission.status)).toEqual([
      'ACTIVE',
      'LOCKED',
      'LOCKED',
    ]);
    expect(workspace.recommendedAgent).toMatchObject({
      name: 'Lead Magnet Agent',
      actions: expect.arrayContaining([
        expect.objectContaining({ label: 'Generate Lead Magnet' }),
      ]),
    });
  });

  it('shows agent generated assets and completed agent status from audit history', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      {
        metadata: {
          missionId: 'mission-plan-lead_magnet',
          generatedAsset: {
            id: 'agent-asset-1',
            title: 'Lead Magnet Draft: Create Your First Lead Magnet',
            description: 'Lead Magnet Agent generated the draft.',
            status: 'generated',
            route: '/lead-magnet',
            generatedBy: 'Lead Magnet Agent',
            agentActionId: 'generate_lead_magnet',
          },
        },
      },
    ] as never);

    const workspace = await getMissionExecutionWorkspace(user, 'mission-plan-lead_magnet');

    expect(workspace.generatedAssets[0]).toMatchObject({
      id: 'agent-asset-1',
      generatedBy: 'Lead Magnet Agent',
      agentActionId: 'generate_lead_magnet',
    });
    expect(workspace.agentSupport[0]).toMatchObject({
      name: 'Lead Magnet Agent',
      status: 'COMPLETED',
    });
  });

  it('rejects stale workspace ids', async () => {
    await expect(getMissionExecutionWorkspace(user, 'mission-plan-content')).rejects.toThrow('MISSION_WORKSPACE_NOT_FOUND');
  });
});
