import { beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { MissionAuthoritySnapshot, MissionPlan } from '@/modules/mission-engine/contracts/MissionAuthority';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import {
  getExecutionAgentsForMission,
  invokeMissionAgent,
  readAgentGeneratedAssets,
  updateAgentGeneratedAssetStatus,
} from '@/modules/mission-workspace/services/MissionAgentAssistanceService';

vi.mock('@/lib/prisma', () => ({
  default: {
    user: {
      findUnique: vi.fn(),
    },
    brandProfile: {
      findUnique: vi.fn(),
    },
    brandInterview: {
      findFirst: vi.fn(),
    },
    content: {
      findMany: vi.fn(),
    },
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

vi.mock('@/modules/mission-engine/services/MissionEngineAuthorityService', () => ({
  missionEngineAuthorityService: {
    getCurrentMission: vi.fn(),
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

const leadMagnetPlan: MissionPlan = {
  id: 'mission-plan-lead_magnet',
  objective: 'Create Your First Lead Magnet',
  description: 'Build a lead capture asset.',
  steps: [
    { id: 'leadMagnet.type', title: 'Select Lead Magnet Type', description: 'Choose the format.', estimatedMinutes: 5, required: true },
    { id: 'leadMagnet.content', title: 'Generate Lead Magnet Content', description: 'Create content.', estimatedMinutes: 15, required: true },
    { id: 'leadMagnet.publish', title: 'Publish Lead Magnet', description: 'Publish the asset.', estimatedMinutes: 10, required: true },
    { id: 'leadMagnet.cta', title: 'Connect CTA', description: 'Connect the CTA.', estimatedMinutes: 5, required: true },
  ],
  estimatedTime: 35,
  successCriteria: ['Lead Magnet Exists'],
  completionChecks: ['leadMagnet.exists', 'leadMagnet.published', 'cta.active'],
  route: '/lead-magnet',
  missionType: 'LEAD_MAGNET',
  nextMilestone: '建立漏斗',
};

function planFor(missionType: MissionPlan['missionType']): MissionPlan {
  return {
    ...leadMagnetPlan,
    id: `mission-plan-${missionType.toLowerCase()}`,
    missionType,
    objective: `Execute ${missionType} Mission`,
    route: `/${missionType.toLowerCase()}`,
    steps: [
      { id: `${missionType.toLowerCase()}.step`, title: `${missionType} Step`, description: 'Complete the step.', estimatedMinutes: 10, required: true },
    ],
    completionChecks: [`${missionType.toLowerCase()}.complete`],
  };
}

function authorityFor(plan: MissionPlan): MissionAuthoritySnapshot {
  return { missionPlan: plan } as MissionAuthoritySnapshot;
}

describe('EXEC-002A Mission Agent Real Outputs', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.user.findUnique).mockResolvedValue({
      languagePreference: 'zh',
      metadata: { region: 'Malaysia' },
    } as never);
    vi.mocked(prisma.brandProfile.findUnique).mockResolvedValue({
      id: 'brand_profile_1',
      brandName: 'Fit Coach Mei',
      personalName: 'Mei',
      brandPositioning: 'Practical weight loss coach for busy mothers',
      targetAudience: 'busy mothers who want weight loss',
      audiencePainPoints: ['they try diets but cannot keep consistent habits'],
      audienceGoals: ['lose fat without extreme dieting'],
      audienceObjections: ['I have no time'],
      coreMessage: 'Small habits create visible change',
      contentTone: 'warm and direct',
      primaryOffer: 'Weight Management Coaching Program',
      transformationPromise: 'lose fat with simple daily habits',
      createdAt: new Date('2026-06-22T00:00:00.000Z'),
      updatedAt: new Date('2026-06-22T00:00:00.000Z'),
    } as never);
    vi.mocked(prisma.brandInterview.findFirst).mockResolvedValue(null);
    vi.mocked(prisma.content.findMany).mockResolvedValue([]);
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([]);
    vi.mocked(missionEngineAuthorityService.getCurrentMission).mockResolvedValue(authorityFor(leadMagnetPlan));
  });

  it('recommends agents for the active mission type', () => {
    const agents = getExecutionAgentsForMission(leadMagnetPlan);

    expect(agents.map((agent) => agent.name)).toEqual(['Lead Magnet Agent', 'Funnel Agent']);
    expect(agents[0]).toMatchObject({
      id: 'lead-magnet-agent',
      status: 'IDLE',
      actions: expect.arrayContaining([
        expect.objectContaining({ id: 'generate_lead_magnet', label: 'Generate Lead Magnet' }),
      ]),
    });
  });

  it.each([
    ['CONTENT', 'content-agent', 'generate_content', 'CONTENT_ASSET'],
    ['LEAD_MAGNET', 'lead-magnet-agent', 'generate_lead_magnet', 'LEAD_MAGNET_ASSET'],
    ['FUNNEL', 'funnel-agent', 'create_landing_page', 'FUNNEL_ASSET'],
    ['TRAFFIC', 'traffic-agent', 'recommend_traffic_sources', 'TRAFFIC_ASSET'],
    ['CUSTOMERS', 'crm-agent', 'follow_up_script', 'CRM_ASSET'],
    ['POSITIONING', 'offer-agent', 'offer_review', 'OFFER_ASSET'],
  ] as const)('generates a real draft asset for %s through %s', async (missionType, agentId, actionId, assetType) => {
    const plan = planFor(missionType);
    vi.mocked(missionEngineAuthorityService.getCurrentMission).mockResolvedValue(authorityFor(plan));

    const result = await invokeMissionAgent({
      user,
      missionId: plan.id,
      agentId,
      actionId,
    });

    expect(result.generatedAsset).toMatchObject({
      assetType,
      status: 'DRAFT',
      outputLevel: 'DRAFT_ASSET',
      missionId: plan.id,
      sourceAgentId: agentId,
      agentActionId: actionId,
    });
    expect(result.generatedAsset.content?.length).toBeGreaterThan(80);
    expect(result.generatedAsset.preview?.length).toBeGreaterThan(20);
  });

  it('invokes an allowed agent action and stores the generated asset audit trail', async () => {
    const result = await invokeMissionAgent({
      user,
      missionId: 'mission-plan-lead_magnet',
      agentId: 'lead-magnet-agent',
      actionId: 'generate_lead_magnet',
    });

    expect(result).toMatchObject({
      missionId: 'mission-plan-lead_magnet',
      missionType: 'LEAD_MAGNET',
      agentId: 'lead-magnet-agent',
      actionId: 'generate_lead_magnet',
      status: 'COMPLETED',
      verificationBoundary: 'agent_output_not_completion',
      generatedAsset: {
        title: '引流赠品草稿: 创建你的第一个引流赠品',
        assetType: 'LEAD_MAGNET_ASSET',
        status: 'DRAFT',
        route: '/lead-magnet',
        generatedBy: 'Lead Magnet Agent',
        sourceAgentId: 'lead-magnet-agent',
        agentActionId: 'generate_lead_magnet',
        missionId: 'mission-plan-lead_magnet',
        outputLevel: 'DRAFT_ASSET',
      },
    });
    expect(result.localization).toMatchObject({
      locale: 'zh',
      translationSource: 'registry',
      fallbackUsed: false,
    });
    expect(result.generatedAsset.content).toContain('阻碍减脂的7个隐藏习惯');
    expect(result.generatedAsset.content).toContain('适合对象：');
    expect(result.generatedAsset.content).toContain('busy mothers who want weight loss');
    expect(result.generatedAsset.content).toContain('Weight Management Coaching Program');
    expect(result.generatedAsset.content).not.toContain('Write in Chinese');
    expect(result.generatedAsset.preview).toContain('引流赠品草稿');
    expect(result).not.toHaveProperty('missionCompletion');
    expect(result).not.toHaveProperty('verificationStatus');
    expect(prisma.auditLog.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
      data: expect.objectContaining({
        action: 'mission_agent.invoked',
        targetType: 'mission_agent',
        metadata: expect.objectContaining({
          missionId: 'mission-plan-lead_magnet',
          agentId: 'lead-magnet-agent',
          actionId: 'generate_lead_magnet',
          verificationBoundary: 'agent_output_not_completion',
        }),
      }),
    }));
    expect(prisma.auditLog.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
      data: expect.objectContaining({
        action: 'agent.asset.generated',
        targetType: 'mission_agent',
        metadata: expect.objectContaining({
          assetType: 'LEAD_MAGNET_ASSET',
          generatedAsset: expect.objectContaining({
            title: '引流赠品草稿: 创建你的第一个引流赠品',
            generatedBy: 'Lead Magnet Agent',
            content: expect.stringContaining('阻碍减脂的7个隐藏习惯'),
            status: 'DRAFT',
          }),
          personalization: expect.objectContaining({
            audience: 'busy mothers who want weight loss',
            offer: 'Weight Management Coaching Program',
            language: 'zh',
            internalScore: expect.objectContaining({
              relevance: expect.any(Number),
            }),
            verificationBoundary: 'personalization_does_not_affect_completion',
          }),
          localization: expect.objectContaining({
            locale: 'zh',
            translationSource: 'registry',
            fallbackUsed: false,
          }),
          executionTimeMs: expect.any(Number),
        }),
      }),
    }));
  });

  it('rejects agents that do not support the active mission', async () => {
    await expect(invokeMissionAgent({
      user,
      missionId: 'mission-plan-lead_magnet',
      agentId: 'traffic-agent',
      actionId: 'recommend_traffic_sources',
    })).rejects.toMatchObject({
      code: 'INVALID_AGENT_FOR_MISSION',
      statusCode: 400,
    });
  });

  it('reads generated assets for the active mission only', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      {
        metadata: {
          missionId: 'mission-plan-lead_magnet',
          generatedAsset: {
            id: 'asset_1',
            title: 'Lead Magnet Draft: Create Your First Lead Magnet',
            description: 'Lead Magnet Agent generated a draft.',
            assetType: 'LEAD_MAGNET_ASSET',
            content: 'Lead Magnet Draft\nCTA\nFollow-Up Message',
            preview: 'Lead Magnet Draft\nCTA',
            status: 'DRAFT',
            route: '/lead-magnet',
            generatedBy: 'Lead Magnet Agent',
            sourceAgentId: 'lead-magnet-agent',
            agentActionId: 'generate_lead_magnet',
            missionId: 'mission-plan-lead_magnet',
            createdAt: '2026-06-22T00:00:00.000Z',
            updatedAt: '2026-06-22T00:00:00.000Z',
            outputLevel: 'DRAFT_ASSET',
          },
        },
      },
      {
        metadata: {
          missionId: 'mission-plan-content',
          generatedAsset: {
            title: 'Content Draft',
            description: 'Not this workspace.',
          },
        },
      },
    ] as never);

    await expect(readAgentGeneratedAssets({
      user,
      missionId: 'mission-plan-lead_magnet',
    })).resolves.toEqual([
      {
        id: 'asset_1',
        title: 'Lead Magnet Draft: Create Your First Lead Magnet',
        description: 'Lead Magnet Agent generated a draft.',
        assetType: 'LEAD_MAGNET_ASSET',
        content: 'Lead Magnet Draft\nCTA\nFollow-Up Message',
        preview: 'Lead Magnet Draft\nCTA',
        status: 'DRAFT',
        route: '/lead-magnet',
        generatedBy: 'Lead Magnet Agent',
        sourceAgentId: 'lead-magnet-agent',
        agentActionId: 'generate_lead_magnet',
        missionId: 'mission-plan-lead_magnet',
        createdAt: '2026-06-22T00:00:00.000Z',
        updatedAt: '2026-06-22T00:00:00.000Z',
        outputLevel: 'DRAFT_ASSET',
      },
    ]);
  });

  it('approves a draft asset without completing the mission', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      {
        metadata: {
          missionId: 'mission-plan-lead_magnet',
          generatedAsset: {
            id: 'asset_1',
            title: 'Lead Magnet Draft: Create Your First Lead Magnet',
            description: 'Lead Magnet Agent generated a draft.',
            assetType: 'LEAD_MAGNET_ASSET',
            content: 'Lead Magnet Draft\nCTA\nFollow-Up Message',
            preview: 'Lead Magnet Draft\nCTA',
            status: 'DRAFT',
            route: '/lead-magnet',
            generatedBy: 'Lead Magnet Agent',
            sourceAgentId: 'lead-magnet-agent',
            agentActionId: 'generate_lead_magnet',
            missionId: 'mission-plan-lead_magnet',
            outputLevel: 'DRAFT_ASSET',
          },
        },
      },
    ] as never);

    const result = await updateAgentGeneratedAssetStatus({
      user,
      missionId: 'mission-plan-lead_magnet',
      assetId: 'asset_1',
      status: 'APPROVED',
    });

    expect(result).toMatchObject({
      missionId: 'mission-plan-lead_magnet',
      assetId: 'asset_1',
      status: 'APPROVED',
      verificationBoundary: 'asset_approval_not_completion',
      asset: {
        status: 'APPROVED',
        content: 'Lead Magnet Draft\nCTA\nFollow-Up Message',
      },
    });
    expect(result).not.toHaveProperty('missionCompletion');
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'agent.asset.approved',
        targetType: 'mission_agent',
        metadata: expect.objectContaining({
          assetId: 'asset_1',
          assetType: 'LEAD_MAGNET_ASSET',
          verificationBoundary: 'agent_output_not_completion',
          generatedAsset: expect.objectContaining({
            status: 'APPROVED',
          }),
        }),
      }),
    }));
  });
});
