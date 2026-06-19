import { beforeEach, describe, expect, it, vi } from 'vitest';

const authMocks = vi.hoisted(() => ({
  requireAuthApi: vi.fn(),
}));

const prismaMocks = vi.hoisted(() => ({
  tenant: { findUnique: vi.fn() },
  userProgress: { findUnique: vi.fn() },
}));

const agentMocks = vi.hoisted(() => ({
  agentManager: {
    executeAgent: vi.fn(),
    getRecommendedAgents: vi.fn(),
    executeMultiAgent: vi.fn(),
  },
  orchestrateForGoal: vi.fn(),
  agentMemoryService: { remember: vi.fn() },
}));

const runtimeMocks = vi.hoisted(() => ({
  runtimeStateService: { getRuntimeState: vi.fn() },
}));

vi.mock('@/modules/auth/middleware/require-auth-api', () => authMocks);
vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));
vi.mock('@/modules/ai/services/agent-manager', () => ({ agentManager: agentMocks.agentManager }));
vi.mock('@/modules/ai/services/workforce-orchestrator', () => ({ orchestrateForGoal: agentMocks.orchestrateForGoal }));
vi.mock('@/modules/ai/services/agent-memory', () => ({ agentMemoryService: agentMocks.agentMemoryService }));
vi.mock('@/modules/agent-runtime/services/RuntimeStateService', () => runtimeMocks);

import { POST } from '@/app/api/v1/ai-workforce/execute/route';

const authUser = {
  id: 'user_1',
  email: 'user@example.com',
  tenantId: 'tenant_1',
  role: 'admin',
  name: 'User',
  preferredLanguage: 'zh',
  status: 'active' as const,
};

const makeReq = (body: Record<string, unknown>) =>
  new Request('https://example.com/api/v1/ai-workforce/execute', {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' },
  });

describe('AI workforce execute API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(console, 'info').mockImplementation(() => undefined);
    vi.spyOn(console, 'error').mockImplementation(() => undefined);
    authMocks.requireAuthApi.mockResolvedValue(authUser);
    prismaMocks.tenant.findUnique.mockResolvedValue({ plan: 'free' });
    prismaMocks.userProgress.findUnique.mockResolvedValue({ currentStageId: 'account_approved' });
    agentMocks.agentMemoryService.remember.mockResolvedValue(undefined);
    runtimeMocks.runtimeStateService.getRuntimeState.mockResolvedValue({
      pendingAssignments: [
        {
          source: 'COOPlan.assignments',
          scope: 'user',
          confidence: 'derived',
          fallback: 'none',
          assignmentId: 'runtime-assignment-1',
          basis: 'coo_assignment',
          objective: 'Generate Lead Magnet',
          selectedAgents: ['brand_strategist', 'funnel_architect'],
          executionMode: 'multi_agent',
          branchPreserved: true,
          reasoning: ['test assignment'],
        },
      ],
    });
  });

  it('AUTH-002 executes a runtime assignment by assignmentId', async () => {
    const firstReport = {
      agent: 'brand_strategist',
      objective: 'Generate Lead Magnet',
      findings: [],
      recommendations: [],
      actions: [],
      confidenceScore: 90,
      executedAt: '2026-06-19T00:00:00.000Z',
    };
    const result = {
      summary: 'assignment done',
      agents: [firstReport],
      recommendedActions: [],
      overallConfidence: 90,
    };
    agentMocks.agentManager.executeMultiAgent.mockResolvedValue(result);

    const res = await POST(makeReq({ assignmentId: 'runtime-assignment-1' }) as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(result);
    expect(runtimeMocks.runtimeStateService.getRuntimeState).toHaveBeenCalledWith('user_1');
    expect(agentMocks.agentManager.executeMultiAgent).toHaveBeenCalledWith(
      ['brand_strategist', 'funnel_architect'],
      expect.objectContaining({
        userId: 'user_1',
        tenantId: 'tenant_1',
        objective: 'Generate Lead Magnet',
        context: expect.objectContaining({
          executionSource: 'assignment',
          assignmentId: 'runtime-assignment-1',
        }),
      }),
    );
    expect(agentMocks.agentMemoryService.remember).toHaveBeenCalledWith('user_1', firstReport);
  });

  it('C3-RUNTIME-007 keeps the single agent execution response and stores memory', async () => {
    const report = {
      agent: 'brand_strategist',
      summary: 'done',
      findings: [],
      actions: [],
      confidenceScore: 88,
    };
    agentMocks.agentManager.executeAgent.mockResolvedValue(report);

    const res = await POST(makeReq({ agentId: 'brand_strategist' }) as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(report);
    expect(agentMocks.agentManager.executeAgent).toHaveBeenCalledWith({
      agentId: 'brand_strategist',
      userId: 'user_1',
      tenantId: 'tenant_1',
      objective: '分析并给出建议',
      context: {
        executionSource: 'manual_override',
        overrideReason: 'direct_agent_request',
      },
    });
    expect(agentMocks.agentMemoryService.remember).toHaveBeenCalledWith('user_1', report);
  });

  it('C3-RUNTIME-008 keeps the multi-agent orchestration response and stores memory', async () => {
    const firstReport = {
      agent: 'brand_strategist',
      summary: 'brand done',
      findings: [],
      actions: [],
      confidenceScore: 90,
    };
    const result = {
      summary: 'multi done',
      agents: [firstReport],
      recommendedActions: [],
      overallConfidence: 90,
    };
    agentMocks.orchestrateForGoal.mockResolvedValue(result);

    const res = await POST(makeReq({ goal: '开发客户', multi: true, overrideReason: 'Need to override today assignment' }) as any);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(result);
    expect(agentMocks.orchestrateForGoal).toHaveBeenCalledWith(
      { objective: '开发客户', userId: 'user_1', tenantId: 'tenant_1' },
      'free',
    );
    expect(agentMocks.agentMemoryService.remember).toHaveBeenCalledWith('user_1', firstReport);
  });

  it('AUTH-002 rejects manual goal override without overrideReason', async () => {
    const res = await POST(makeReq({ goal: '开发客户', multi: true }) as any);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(agentMocks.orchestrateForGoal).not.toHaveBeenCalled();
  });
});
