import { describe, expect, it } from 'vitest';
import { resolvePriority } from '@/modules/mission-engine/services/PriorityEngine';
import type { BottleneckResult, MissionBottleneck } from '@/modules/mission-engine/contracts/MissionAuthority';

function bottleneckResult(bottleneck: MissionBottleneck, overrides: Partial<BottleneckResult> = {}): BottleneckResult {
  return {
    bottleneck,
    confidence: 80,
    evidence: [`bottleneck=${bottleneck}`],
    severity: 'High',
    explainability: `Resolved ${bottleneck}.`,
    ...overrides,
  };
}

describe('COO-003 Priority Engine', () => {
  it.each([
    ['NO_BRAND', 'Complete AI Interview', 'FOUNDATION', 'BRAND', '/brand-builder/step/interview', 'Critical'],
    ['NO_POSITIONING', 'Define Market Position', 'FOUNDATION', 'POSITIONING', '/brand-builder/step/profile', 'High'],
    ['NO_CONTENT', 'Build Content Foundation', 'CONTENT', 'CONTENT', '/content-engine', 'High'],
    ['NO_AUDIENCE', 'Publish Audience Growth Content', 'CONTENT', 'CONTENT', '/content-engine', 'High'],
    ['NO_LEAD_MAGNET', 'Create Lead Magnet', 'LEADS', 'LEAD_MAGNET', '/lead-magnet', 'High'],
    ['NO_FUNNEL', 'Build Funnel', 'LEADS', 'FUNNEL', '/funnel', 'High'],
    ['NO_TRAFFIC', 'Activate Traffic Source', 'LEADS', 'TRAFFIC', '/traffic-engine', 'High'],
    ['NO_LEADS', 'Improve Lead Capture', 'LEADS', 'FUNNEL', '/funnel', 'High'],
    ['NO_CONVERSION', 'Generate Webinar Conversion System', 'CONVERSION', 'WEBINAR', '/webinar-center', 'High'],
    ['NO_CUSTOMERS', 'Convert Existing Leads', 'CONVERSION', 'CUSTOMERS', '/leads', 'High'],
    ['NO_RETENTION', 'Build Retention System', 'RETENTION', 'RETENTION', '/crm', 'High'],
    ['NO_TEAM', 'Create SOP', 'SCALE', 'TEAM', '/team/growth', 'Normal'],
    ['BUSINESS_HEALTHY', 'Optimize Growth', 'OPTIMIZATION', 'OPTIMIZATION', '/dashboard', 'Normal'],
    ['NO_SYSTEM', 'Restore Business Signals', 'SYSTEM', 'SYSTEM', '/dashboard', 'High'],
  ] as const)('maps %s to exactly one priority action', (bottleneck, action, category, missionType, route, urgency) => {
    const severity = urgency === 'Critical' ? 'Critical' : urgency === 'Normal' ? 'None' : 'High';
    const result = resolvePriority({
      bottleneckResult: bottleneckResult(bottleneck, { severity }),
    });

    expect(result).toMatchObject({
      priorityAction: action,
      category,
      missionType,
      route,
      urgency,
    });
    expect(result.priorityReason.length).toBeGreaterThan(20);
    expect(result.expectedImpact.length).toBeGreaterThan(20);
    expect(result.confidence).toBeGreaterThanOrEqual(50);
  });

  it('keeps healthy businesses on optimization actions only', () => {
    const result = resolvePriority({
      bottleneckResult: bottleneckResult('BUSINESS_HEALTHY', {
        confidence: 90,
        severity: 'None',
        evidence: ['No active bottleneck candidates found.'],
      }),
    });

    expect(result).toMatchObject({
      priorityAction: 'Optimize Growth',
      category: 'OPTIMIZATION',
      urgency: 'Normal',
      route: '/dashboard',
    });
    expect(result.priorityReason).not.toMatch(/repair|restore|fix/i);
  });

  it('uses system recovery only for NO_SYSTEM signal failures', () => {
    const result = resolvePriority({
      bottleneckResult: bottleneckResult('NO_SYSTEM', {
        confidence: 80,
        severity: 'High',
        evidence: ['Business signals unavailable.'],
      }),
    });

    expect(result).toMatchObject({
      priorityAction: 'Restore Business Signals',
      category: 'SYSTEM',
      urgency: 'High',
    });
  });

  it('applies a 30 point dedup penalty when the recent action was completed and resolved', () => {
    const baseline = resolvePriority({
      bottleneckResult: bottleneckResult('NO_LEAD_MAGNET'),
    });
    const deduped = resolvePriority({
      bottleneckResult: bottleneckResult('NO_LEAD_MAGNET'),
      recentPriorityHistory: [{
        priorityAction: 'Create Lead Magnet',
        bottleneck: 'NO_FUNNEL',
        completionStatus: 'completed',
        resolved: true,
      }],
    });

    expect(deduped.priorityAction).toBe('Create Lead Magnet');
    expect(deduped.dedup).toEqual({
      applied: true,
      action: 'Create Lead Magnet',
      baseScore: 76,
      penalty: 30,
      finalScore: 46,
      reason: 'Completed within 7 days and bottleneck resolved.',
    });
    expect(deduped.confidence).toBeLessThan(baseline.confidence);
  });

  it('does not apply a dedup penalty when the repeated action did not resolve the current bottleneck', () => {
    const result = resolvePriority({
      bottleneckResult: bottleneckResult('NO_LEAD_MAGNET'),
      recentPriorityHistory: [{
        priorityAction: 'Create Lead Magnet',
        bottleneck: 'NO_LEAD_MAGNET',
        completionStatus: 'completed',
        resolved: false,
      }],
    });

    expect(result.priorityAction).toBe('Create Lead Magnet');
    expect(result.dedup).toBeUndefined();
  });

  it('does not apply a dedup penalty when the repeated action was not completed', () => {
    const result = resolvePriority({
      bottleneckResult: bottleneckResult('NO_LEAD_MAGNET'),
      recentPriorityHistory: [{
        priorityAction: 'Create Lead Magnet',
        bottleneck: 'NO_LEAD_MAGNET',
        completionStatus: 'active',
        resolved: false,
      }],
    });

    expect(result.priorityAction).toBe('Create Lead Magnet');
    expect(result.dedup).toBeUndefined();
  });

  it('does not apply a dedup penalty when no matching history exists', () => {
    const result = resolvePriority({
      bottleneckResult: bottleneckResult('NO_LEAD_MAGNET'),
      recentPriorityHistory: [{
        priorityAction: 'Build Funnel',
        bottleneck: 'NO_FUNNEL',
        completionStatus: 'completed',
        resolved: true,
      }],
    });

    expect(result.priorityAction).toBe('Create Lead Magnet');
    expect(result.dedup).toBeUndefined();
  });
});
