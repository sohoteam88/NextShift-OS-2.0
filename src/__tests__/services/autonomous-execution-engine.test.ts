import { describe, expect, it } from 'vitest';
import type { AICOODecision } from '@/modules/ai-coo/contracts/AICOODecision';
import { planExecutionAction } from '@/modules/autonomous-execution/services/action-planner';
import { buildExecutionProjection } from '@/modules/autonomous-execution/services/execution-projection';
import { shouldAutoExecute } from '@/modules/autonomous-execution/services/execution-orchestrator';
import { evaluateGuardrail } from '@/modules/autonomous-execution/services/guardrail-engine';

const baseDecision: AICOODecision = {
  decisionId: 'decision-1',
  focusArea: 'generate_leads',
  currentFocus: 'Generate Leads',
  reason: 'Traffic is missing.',
  priority: 'high',
  confidence: 'high',
  estimatedImpact: 'high',
  estimatedEffort: 'medium',
  recommendedAction: {
    id: 'action-1',
    title: '创建第一个引流磁铁',
    reason: 'Prepare a lead magnet.',
    route: '/lead-magnet',
    successMetric: 'Capture the first qualified lead',
  },
  nextBestAction: {
    id: 'action-1',
    title: '创建第一个引流磁铁',
    reason: 'Prepare a lead magnet.',
    route: '/lead-magnet',
    successMetric: 'Capture the first qualified lead',
  },
  successMetric: 'Capture the first qualified lead',
  primaryRisk: {
    code: 'traffic_missing',
    title: 'Traffic missing',
    reason: 'No qualified lead flow exists yet.',
    domain: 'traffic',
    priority: 'high',
  },
  primaryOpportunity: null,
  recommendedMission: {
    id: 'MISSION_005',
    title: '创建第一个引流磁铁',
    route: '/lead-magnet',
  },
  decisionReason: 'Why now: traffic is missing.',
  supportingActions: [],
};

describe('AI-004 autonomous execution engine', () => {
  it('plans lead magnet decisions as assisted execution without approval', () => {
    const action = planExecutionAction(baseDecision, new Date('2026-06-19T00:00:00.000Z'));

    expect(action).toMatchObject({
      actionType: 'LEAD_MAGNET_GENERATION',
      executionMode: 'assisted',
      requiresApproval: false,
      riskClass: 'MEDIUM',
      executionLevel: 'GENERATE',
      approvalStatus: 'not_required',
      state: 'queued',
    });
    expect(shouldAutoExecute(action)).toBe(false);
  });

  it('requires approval for high-priority offer launch actions', () => {
    const action = planExecutionAction({
      ...baseDecision,
      decisionId: 'decision-2',
      focusArea: 'launch_offer',
      currentFocus: 'Launch Offer',
      nextBestAction: {
        ...baseDecision.nextBestAction,
        title: '发布销售漏斗',
        route: '/funnel',
      },
    }, new Date('2026-06-19T00:00:00.000Z'));

    expect(action).toMatchObject({
      actionType: 'FUNNEL_GENERATION',
      executionMode: 'assisted',
      requiresApproval: true,
      riskClass: 'HIGH',
      executionLevel: 'APPROVAL_REQUIRED',
      approvalStatus: 'pending',
    });
    expect(action.approvalExpiresAt).toBe('2026-06-20T00:00:00.000Z');
  });

  it('blocks permanently forbidden actions', () => {
    const guardrail = evaluateGuardrail({
      action: 'DELETE_CUSTOMER_DATA',
      requestedBy: 'user-1',
      affectedResources: ['customer:123'],
      now: new Date('2026-06-19T00:00:00.000Z'),
    });

    expect(guardrail).toMatchObject({
      risk: 'CRITICAL',
      executionLevel: 'FORBIDDEN',
      approvalRequired: false,
      approvalStatus: 'blocked',
      allowed: false,
      autonomousAllowed: false,
    });
  });

  it('uses the autonomy kill switch for level 4 actions', () => {
    const original = process.env.AI_AUTONOMY_ENABLED;
    try {
      process.env.AI_AUTONOMY_ENABLED = 'false';
      const action = planExecutionAction({
        ...baseDecision,
        decisionId: 'decision-3',
        focusArea: 'realize_value',
        currentFocus: 'Summarize Progress',
        nextBestAction: {
          ...baseDecision.nextBestAction,
          title: 'Generate progress report',
          route: '/dashboard',
        },
      }, new Date('2026-06-19T00:00:00.000Z'));

      expect(action).toMatchObject({
        actionType: 'TASK_CREATION',
        executionMode: 'manual',
        riskClass: 'LOW',
        executionLevel: 'AUTONOMOUS',
        approvalStatus: 'blocked',
        state: 'cancelled',
        outcome: 'Autonomous execution is disabled by kill switch.',
      });
      expect(shouldAutoExecute(action)).toBe(false);
    } finally {
      if (original === undefined) {
        delete process.env.AI_AUTONOMY_ENABLED;
      } else {
        process.env.AI_AUTONOMY_ENABLED = original;
      }
    }
  });

  it('allows level 4 low-risk actions only when guardrails permit autonomy', () => {
    const action = planExecutionAction({
      ...baseDecision,
      decisionId: 'decision-4',
      focusArea: 'realize_value',
      currentFocus: 'Summarize Progress',
      nextBestAction: {
        ...baseDecision.nextBestAction,
        title: 'Generate progress report',
        route: '/dashboard',
      },
    }, new Date('2026-06-19T00:00:00.000Z'));

    expect(action).toMatchObject({
      actionType: 'TASK_CREATION',
      executionMode: 'autonomous',
      riskClass: 'LOW',
      executionLevel: 'AUTONOMOUS',
      approvalStatus: 'not_required',
      state: 'queued',
    });
    expect(shouldAutoExecute(action)).toBe(true);
  });

  it('projects queue state for dashboard consumers without decision logic', () => {
    const queued = planExecutionAction(baseDecision, new Date('2026-06-19T00:00:00.000Z'));
    const completed = {
      ...queued,
      actionId: 'exec-completed',
      state: 'completed' as const,
      updatedAt: '2026-06-19T01:00:00.000Z',
    };
    const projection = buildExecutionProjection([queued, completed]);

    expect(projection.currentExecution?.actionId).toBe(queued.actionId);
    expect(projection.queuedExecutions).toHaveLength(1);
    expect(projection.completedExecutions).toHaveLength(1);
    expect(projection.automationLevel).toBe('assisted');
  });
});
