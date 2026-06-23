import { beforeEach, describe, expect, it, vi } from 'vitest';
import prisma from '@/lib/prisma';
import type { AutonomousExecutionAction } from '@/modules/autonomous-execution/contracts/AutonomousExecution';
import { executionQueue } from '@/modules/autonomous-execution/services/execution-queue';
import {
  executionStateMachine,
  validateExecutionTransition,
} from '@/modules/autonomous-execution/services/ExecutionStateMachine';

vi.mock('@/lib/prisma', () => ({
  default: {
    auditLog: {
      create: vi.fn(),
      findMany: vi.fn(),
    },
  },
}));

const baseAction: AutonomousExecutionAction = {
  actionId: 'exec_123',
  decisionId: 'decision_123',
  actionType: 'REPORT_GENERATION',
  title: 'Generate Internal Report',
  reason: 'Low-risk autonomous work.',
  priority: 'medium',
  executionMode: 'autonomous',
  requiresApproval: false,
  estimatedImpact: 'medium',
  estimatedEffort: 'low',
  successMetric: 'Report generated.',
  riskClass: 'LOW',
  executionLevel: 'AUTONOMOUS',
  approvalStatus: 'not_required',
  state: 'queued',
  createdAt: '2026-06-22T00:00:00.000Z',
  updatedAt: '2026-06-22T00:00:00.000Z',
};

function rowFor(action: AutonomousExecutionAction, eventAction = 'EXECUTION_QUEUED') {
  return {
    action: eventAction,
    metadata: {
      actionId: action.actionId,
      decisionId: action.decisionId,
      action,
    },
    createdAt: new Date(action.updatedAt),
  };
}

describe('HOTFIX-013 Execution State Machine', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(prisma.auditLog.create).mockResolvedValue({} as never);
  });

  it.each([
    ['queued', 'executing', true],
    ['executing', 'completed', true],
    ['completed', 'executing', false],
    ['failed', 'queued', true],
    ['cancelled', 'executing', false],
    ['blocked', 'completed', false],
  ] as const)('validates %s -> %s as allowed=%s', (from, to, allowed) => {
    expect(validateExecutionTransition({ from, to })).toMatchObject({
      from,
      to,
      allowed,
      result: allowed ? 'allowed' : 'rejected',
    });
  });

  it('treats completed and cancelled as terminal states', () => {
    expect(executionStateMachine.isTerminal('completed')).toBe(true);
    expect(executionStateMachine.isTerminal('cancelled')).toBe(true);
    expect(executionStateMachine.isTerminal('failed')).toBe(false);
  });

  it('allows queued executions to start and writes transition audit', async () => {
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      rowFor(baseAction),
    ] as never);

    await expect(executionQueue.transition({
      userId: 'user_1',
      tenantId: 'tenant_1',
      actionId: 'exec_123',
      state: 'executing',
      outcome: 'Started.',
    })).resolves.toMatchObject({
      actionId: 'exec_123',
      state: 'executing',
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'execution.transition.allowed',
        targetType: 'autonomous_execution_transition',
        metadata: expect.objectContaining({
          executionId: 'exec_123',
          from: 'queued',
          to: 'executing',
          result: 'allowed',
        }),
      }),
    }));
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'EXECUTION_EXECUTING',
        targetType: 'autonomous_execution',
      }),
    }));
  });

  it('rejects completed executions from running again before persistence', async () => {
    const completed = {
      ...baseAction,
      state: 'completed' as const,
      updatedAt: '2026-06-22T01:00:00.000Z',
    };
    vi.mocked(prisma.auditLog.findMany).mockResolvedValue([
      rowFor(completed, 'EXECUTION_COMPLETED'),
    ] as never);

    await expect(executionQueue.transition({
      userId: 'user_1',
      tenantId: 'tenant_1',
      actionId: 'exec_123',
      state: 'executing',
      outcome: 'Invalid restart.',
    })).rejects.toMatchObject({
      code: 'INVALID_EXECUTION_TRANSITION',
      statusCode: 409,
      details: {
        from: 'completed',
        to: 'executing',
      },
    });

    expect(prisma.auditLog.create).toHaveBeenCalledTimes(1);
    expect(prisma.auditLog.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        action: 'execution.transition.rejected',
        targetType: 'autonomous_execution_transition',
        metadata: expect.objectContaining({
          executionId: 'exec_123',
          from: 'completed',
          to: 'executing',
          result: 'rejected',
        }),
      }),
    }));
  });
});
