import { describe, expect, it } from 'vitest';
import type { AICOODecision } from '@/modules/ai-coo/contracts/AICOODecision';
import { planExecutionAction } from '@/modules/autonomous-execution/services/action-planner';
import { buildExecutionProjection } from '@/modules/autonomous-execution/services/execution-projection';
import { shouldAutoExecute } from '@/modules/autonomous-execution/services/execution-orchestrator';

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
        route: '/funnel-builder',
      },
    }, new Date('2026-06-19T00:00:00.000Z'));

    expect(action).toMatchObject({
      actionType: 'FUNNEL_GENERATION',
      executionMode: 'assisted',
      requiresApproval: true,
    });
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
