import { beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { MissionAuthoritySnapshot } from '@/modules/mission-engine/contracts/MissionAuthority';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import {
  registryForMissionPlan,
  validateMissionWorkspaceCheck,
} from '@/modules/mission-workspace/services/MissionCheckRegistry';

vi.mock('@/lib/prisma', () => ({
  default: {
    auditLog: {
      create: vi.fn(),
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

function authority(overrides: Partial<MissionAuthoritySnapshot['missionPlan']> = {}): MissionAuthoritySnapshot {
  const missionPlan: MissionAuthoritySnapshot['missionPlan'] = {
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
    ...overrides,
  };

  return {
    source: 'MissionEngineAuthorityService',
    scope: 'user',
    confidence: 'derived',
    fallback: 'none',
    currentJourney: { type: 'retail', title: 'Retail Journey', reason: 'Selected from business state.' },
    businessStage: 'LEAD_MAGNET',
    bottleneck: 'NO_LEAD_MAGNET',
    bottleneckResult: { bottleneck: 'NO_LEAD_MAGNET', confidence: 80, evidence: [], severity: 'High', explainability: '' },
    priorityResult: {
      priorityAction: 'Create Lead Magnet',
      priorityReason: 'Needs lead capture.',
      expectedImpact: 'Leads can opt in.',
      urgency: 'High',
      confidence: 80,
      category: 'LEADS',
      missionType: missionPlan.missionType,
      route: missionPlan.route,
      ctaLabel: '开始任务',
    },
    currentMission: {
      id: 'MISSION_005',
      title: '引流磁铁',
      description: 'Create lead magnet.',
      expectedOutcome: 'Lead magnet exists.',
      estimatedMinutes: 20,
      status: 'active',
      priority: 70,
      unlockConditions: [],
      completionConditions: ['lead_magnet_created'],
      route: missionPlan.route,
    },
    nextMission: null,
    priorityAction: {
      missionType: missionPlan.missionType,
      title: 'Create Lead Magnet',
      route: missionPlan.route,
      ctaLabel: '开始任务',
      priority: 'High',
    },
    explainability: {
      locale: 'zh',
      source: 'ExplainabilityEngine',
      completed: [],
      currentGap: 'NO_LEAD_MAGNET',
      reasoning: '',
      decisionReason: '',
      whyThis: '',
      whyNow: '',
      whyNotOthers: '',
      expectedOutcome: '',
      expectedRisk: '',
      nextMilestone: missionPlan.nextMilestone,
      evidence: [],
      severity: 'High',
      confidence: 80,
    },
    missionPlan,
    missionCompletion: {
      completed: false,
      completionPercentage: 0,
      completionChecks: missionPlan.completionChecks,
      passedChecks: [],
      failedChecks: missionPlan.completionChecks,
      missingChecks: missionPlan.completionChecks,
      nextRequiredCheck: missionPlan.completionChecks[0] ?? null,
      verificationStatus: 'BLOCKED',
      verificationSource: 'signal',
      verifiedAt: '2026-06-22T00:00:00.000Z',
      source: 'MissionCompletionVerifier',
    },
    dashboardCommandCenter: {
      currentStage: 'LEAD_MAGNET',
      missionTitle: missionPlan.objective,
      missionDescription: missionPlan.description,
      reasoning: '',
      expectedOutcome: '',
      estimatedTime: '35 分钟',
      route: missionPlan.route,
      ctaLabel: '开始任务',
      decisionReason: '',
      priority: 'High',
    },
    lifecycle: 'ACTIVE',
    progress: { completionPercentage: 50, completedMissions: 4, totalMissions: 8, nextMilestone: '建立漏斗', progressPath: [] },
    estimatedCompletion: { minutes: 35, label: '35 分钟' },
  };
}

describe('HOTFIX-010 Mission Check Registry', () => {
  beforeEach(() => {
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
    vi.mocked(missionEngineAuthorityService.getCurrentMission).mockResolvedValue(authority());
  });

  it('accepts a key that belongs to the active mission type', async () => {
    await expect(validateMissionWorkspaceCheck({
      user,
      checkKey: 'workspace.step.lead_magnet.3.leadMagnet_publish',
    })).resolves.toMatchObject({
      missionId: 'mission-plan-lead_magnet',
      missionType: 'LEAD_MAGNET',
      result: 'accepted',
    });
  });

  it('rejects a cross-mission key', async () => {
    await expect(validateMissionWorkspaceCheck({
      user,
      checkKey: 'workspace.step.funnel.3.funnel_route',
    })).rejects.toMatchObject({
      code: 'INVALID_CHECK_KEY',
      statusCode: 400,
    });
  });

  it('rejects an arbitrary completion key and writes audit metadata', async () => {
    await expect(validateMissionWorkspaceCheck({
      user,
      checkKey: 'positioning_completed',
    })).rejects.toMatchObject({
      code: 'INVALID_CHECK_KEY',
      message: 'The supplied check does not belong to the active mission.',
    });
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'completion_check.rejected',
        targetType: 'mission_workspace_check',
        targetId: null,
        metadata: expect.objectContaining({
          target_key: 'mission-plan-lead_magnet',
          missionId: 'mission-plan-lead_magnet',
          missionType: 'LEAD_MAGNET',
          checkKey: 'positioning_completed',
          result: 'rejected',
        }),
      }),
    }));
  });

  it('builds a registry only from workspace step checks, not completion checks', () => {
    const registry = registryForMissionPlan(authority().missionPlan);

    expect(registry.allowedChecks).toContain('workspace.step.lead_magnet.4.leadMagnet_cta');
    expect(registry.allowedChecks).not.toContain('leadMagnet.published');
    expect(registry.allowedChecks.every((check) => check.startsWith('workspace.step.'))).toBe(true);
  });
});
