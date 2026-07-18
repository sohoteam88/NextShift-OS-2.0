import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { missionAgentAssistanceService } from '@/modules/mission-workspace/services/MissionAgentAssistanceService';
import { executionQueue } from '@/modules/autonomous-execution/services/execution-queue';
import { runAutonomousExecution } from '@/modules/autonomous-execution/services/autonomous-scheduler';
import { assertTenantOperational } from '@/modules/tenant/services/tenant-operational-guard';

vi.mock('@/modules/tenant/services/tenant-operational-guard', () => ({
  assertTenantOperational: vi.fn(),
}));

vi.mock('@/modules/autonomous-execution/services/execution-queue', () => ({
  executionQueue: {
    enqueue: vi.fn(),
    transition: vi.fn(),
    list: vi.fn(),
  },
}));

vi.mock('@/modules/mission-workspace/services/MissionAgentAssistanceService', () => ({
  missionAgentAssistanceService: {
    invokeAgent: vi.fn(),
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

describe('EXEC-004 Autonomous Scheduler', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(assertTenantOperational).mockResolvedValue(undefined);
    vi.mocked(executionQueue.enqueue).mockResolvedValue({} as never);
    vi.mocked(executionQueue.transition).mockResolvedValue({} as never);
    vi.mocked(executionQueue.list).mockResolvedValue([]);
    vi.mocked(missionAgentAssistanceService.invokeAgent).mockResolvedValue({
      missionId: 'mission-plan-lead_magnet',
      missionType: 'LEAD_MAGNET',
      agentId: 'lead-magnet-agent',
      actionId: 'generate_lead_magnet',
      status: 'COMPLETED',
      generatedAsset: {
        id: 'asset_1',
        title: 'Lead Magnet Draft',
        description: 'Generated lead magnet draft.',
        status: 'DRAFT',
        assetType: 'LEAD_MAGNET_ASSET',
        content: 'Lead magnet draft content.',
        preview: 'Lead magnet draft content.',
        generatedBy: 'Lead Magnet Agent',
        sourceAgentId: 'lead-magnet-agent',
        agentActionId: 'generate_lead_magnet',
        missionId: 'mission-plan-lead_magnet',
        outputLevel: 'DRAFT_ASSET',
      },
      executionTimeMs: 10,
      verificationBoundary: 'agent_output_not_completion',
      localization: {
        locale: 'zh',
        translationSource: 'registry',
        fallbackUsed: false,
      },
    });
  });

  it('does not claim queued work for a deleted tenant', async () => {
    vi.mocked(assertTenantOperational).mockRejectedValueOnce(new Error('TENANT_DELETED_TERMINAL'));
    await expect(runAutonomousExecution({
      user,
      missionId: 'mission-plan-lead_magnet',
      action: 'AUTO_GENERATE_LEAD_MAGNET_DRAFT',
      triggerType: 'mission',
    })).rejects.toThrow('TENANT_DELETED_TERMINAL');
    expect(executionQueue.enqueue).not.toHaveBeenCalled();
    expect(missionAgentAssistanceService.invokeAgent).not.toHaveBeenCalled();
  });

  it('runs approved level 4 mission-triggered draft generation automatically', async () => {
    await runAutonomousExecution({
      user,
      missionId: 'mission-plan-lead_magnet',
      action: 'AUTO_GENERATE_LEAD_MAGNET_DRAFT',
      triggerType: 'mission',
      now: new Date('2026-06-22T00:00:00.000Z'),
    });

    expect(executionQueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({
      userId: 'user_1',
      tenantId: 'tenant_1',
      action: expect.objectContaining({
        actionType: 'LEAD_MAGNET_GENERATION',
        agentId: 'lead-magnet-agent',
        triggerType: 'mission',
        executionMode: 'autonomous',
        executionLevel: 'AUTONOMOUS',
        riskClass: 'LOW',
        approvalStatus: 'not_required',
        state: 'queued',
      }),
    }));
    expect(executionQueue.transition).toHaveBeenNthCalledWith(1, expect.objectContaining({
      actionId: expect.stringContaining('AUTO_GENERATE_LEAD_MAGNET_DRAFT'),
      state: 'executing',
      outcome: 'Autonomous execution started.',
    }));
    expect(missionAgentAssistanceService.invokeAgent).toHaveBeenCalledWith({
      user,
      missionId: 'mission-plan-lead_magnet',
      agentId: 'lead-magnet-agent',
      actionId: 'generate_lead_magnet',
    });
    expect(executionQueue.transition).toHaveBeenNthCalledWith(2, expect.objectContaining({
      state: 'completed',
      assetIds: ['asset_1'],
      outcome: expect.stringContaining('Lead Magnet Draft'),
    }));
  });

  it('does not execute level 4 actions when the kill switch is off', async () => {
    const original = process.env.AI_AUTONOMY_ENABLED;
    try {
      process.env.AI_AUTONOMY_ENABLED = 'false';

      await runAutonomousExecution({
        user,
        action: 'AUTO_GENERATE_INTERNAL_REPORT',
        triggerType: 'manual',
        now: new Date('2026-06-22T00:00:00.000Z'),
      });

      expect(executionQueue.enqueue).toHaveBeenCalledWith(expect.objectContaining({
        action: expect.objectContaining({
          executionLevel: 'AUTONOMOUS',
          approvalStatus: 'blocked',
          state: 'cancelled',
          outcome: 'Autonomous execution is disabled by kill switch.',
        }),
      }));
      expect(executionQueue.transition).not.toHaveBeenCalled();
      expect(missionAgentAssistanceService.invokeAgent).not.toHaveBeenCalled();
    } finally {
      if (original === undefined) {
        delete process.env.AI_AUTONOMY_ENABLED;
      } else {
        process.env.AI_AUTONOMY_ENABLED = original;
      }
    }
  });
});
