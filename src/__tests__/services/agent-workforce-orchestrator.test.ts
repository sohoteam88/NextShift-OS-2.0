import { describe, expect, it, vi } from 'vitest';
import type { MissionPlan } from '@/modules/mission-engine/contracts/MissionAuthority';
import type { MissionWorkspaceAsset } from '@/modules/mission-workspace/services/MissionExecutionWorkspaceService';
import { createWorkforcePlan } from '@/modules/agent-workforce/services/WorkforceOrchestrator';

vi.mock('@/lib/prisma', () => ({
  default: {
    auditLog: {
      findFirst: vi.fn(),
      create: vi.fn(),
    },
  },
}));

const leadMagnetPlan: MissionPlan = {
  id: 'mission-plan-lead_magnet',
  objective: 'Create Your First Lead Magnet',
  description: 'Build a lead capture asset.',
  steps: [],
  estimatedTime: 35,
  successCriteria: ['Lead Magnet Exists'],
  completionChecks: ['leadMagnet.exists'],
  route: '/lead-magnet',
  missionType: 'LEAD_MAGNET',
  nextMilestone: '建立漏斗',
};

describe('EXEC-005 Workforce Orchestrator', () => {
  it('creates the lead magnet workforce plan with ordered dependencies', () => {
    const workforcePlan = createWorkforcePlan({ plan: leadMagnetPlan, requestedBy: 'user_1' });

    expect(workforcePlan).toMatchObject({
      missionId: 'mission-plan-lead_magnet',
      missionType: 'LEAD_MAGNET',
      mode: 'hybrid',
      verificationBoundary: 'workforce_completion_not_mission_completion',
    });
    expect(workforcePlan.agents.map((assignment) => assignment.agentName)).toEqual([
      'Lead Magnet Agent',
      'Funnel Agent',
      'CRM Agent',
    ]);
    expect(workforcePlan.agents[1].dependsOn).toEqual(['workforce-mission-plan-lead_magnet-lead_magnet_agent']);
    expect(workforcePlan.agents[2].dependsOn).toEqual(['workforce-mission-plan-lead_magnet-funnel_agent']);
    expect(workforcePlan.dependencyGraph).toEqual(expect.arrayContaining([
      expect.objectContaining({
        assignmentId: 'workforce-mission-plan-lead_magnet-lead_magnet_agent',
        unlocks: ['workforce-mission-plan-lead_magnet-funnel_agent'],
      }),
    ]));
  });

  it('uses real output assets as handoffs instead of task descriptions', () => {
    const generatedAssets: MissionWorkspaceAsset[] = [
      {
        id: 'asset-lead-magnet-1',
        title: 'Lead Magnet Draft',
        description: 'Draft',
        status: 'DRAFT',
        sourceAgentId: 'lead-magnet-agent',
        agentActionId: 'generate_lead_magnet',
        missionId: leadMagnetPlan.id,
      },
    ];

    const workforcePlan = createWorkforcePlan({ plan: leadMagnetPlan, generatedAssets });
    const [leadMagnet, funnel, crm] = workforcePlan.agents;

    expect(leadMagnet).toMatchObject({
      status: 'COMPLETED',
      outputAssetIds: ['asset-lead-magnet-1'],
    });
    expect(funnel).toMatchObject({
      status: 'READY',
      handoffFrom: ['asset-lead-magnet-1'],
    });
    expect(crm.status).toBe('WAITING');
  });

  it('supports parallel inputs and hybrid completion for team missions', () => {
    const teamPlan: MissionPlan = {
      ...leadMagnetPlan,
      id: 'mission-plan-team',
      route: '/team/growth',
      missionType: 'TEAM',
    };

    const workforcePlan = createWorkforcePlan({ plan: teamPlan });

    expect(workforcePlan.mode).toBe('hybrid');
    expect(workforcePlan.agents.map((assignment) => assignment.agentName)).toEqual([
      'Content Agent',
      'CRM Agent',
      'SOP Generator Agent',
    ]);
    expect(workforcePlan.agents[0].status).toBe('READY');
    expect(workforcePlan.agents[1].status).toBe('READY');
    expect(workforcePlan.agents[2]).toMatchObject({
      status: 'WAITING',
      dependsOn: [
        'workforce-mission-plan-team-content_agent',
        'workforce-mission-plan-team-crm_agent',
      ],
    });
  });

  it('keeps blocked guardrail decisions on the assignment', () => {
    const previous = process.env.AI_AUTONOMY_ENABLED;
    process.env.AI_AUTONOMY_ENABLED = 'false';
    const forbiddenPlan: MissionPlan = {
      ...leadMagnetPlan,
      id: 'mission-plan-forbidden',
      missionType: 'SYSTEM',
      objective: 'Change business state',
    };

    try {
      const workforcePlan = createWorkforcePlan({
        plan: forbiddenPlan,
        generatedAssets: [],
      });

      expect(workforcePlan.agents[0]).toMatchObject({
        agentName: 'COO Agent',
        status: 'BLOCKED',
        executionLevel: 'AUTONOMOUS',
      });
    } finally {
      if (previous === undefined) delete process.env.AI_AUTONOMY_ENABLED;
      else process.env.AI_AUTONOMY_ENABLED = previous;
    }
  });
});
