import { describe, expect, it } from 'vitest';
import type { BusinessMemoryEvent } from '@/modules/business-context-memory/contracts/BusinessContextMemory';
import { buildBusinessContextProjection } from '@/modules/business-context-memory/services/business-memory-projection';
import { deriveExecutionPattern } from '@/modules/business-context-memory/services/execution-pattern-engine';

const events: BusinessMemoryEvent[] = [
  {
    id: 'evt_1',
    type: 'MISSION_COMPLETED',
    tenantId: 'tenant_1',
    userId: 'user_1',
    occurredAt: '2026-06-18T10:00:00.000Z',
    title: '发布第一篇内容',
    summary: '用户完成内容启动任务。',
    referenceId: 'MISSION_004',
  },
  {
    id: 'evt_2',
    type: 'RECOMMENDATION_ISSUED',
    tenantId: 'tenant_1',
    userId: 'user_1',
    occurredAt: '2026-06-17T10:00:00.000Z',
    title: '创建第一个引流磁铁',
    summary: 'COO 建议用户先创建引流磁铁。',
    referenceId: 'mission-current-MISSION_005',
  },
  {
    id: 'evt_3',
    type: 'MISSION_BLOCKED',
    tenantId: 'tenant_1',
    userId: 'user_1',
    occurredAt: '2026-06-16T10:00:00.000Z',
    title: '漏斗页面',
    summary: '落地页还没有发布。',
    referenceId: 'MISSION_006',
  },
];

describe('AI-002 business context memory projection', () => {
  it('builds projection from memory events and existing business read models', () => {
    const projection = buildBusinessContextProjection({
      events,
      completedChecks: ['brand_interview_completed', 'first_content_generated'],
      achievementTitles: ['Brand Architect 徽章'],
      businessBottlenecks: [{ title: 'Build the funnel', domain: 'funnel' }],
      currentMissionTitle: '创建第一个引流磁铁',
      now: new Date('2026-06-19T00:00:00.000Z'),
    });

    expect(projection.currentFocus).toBe('创建第一个引流磁铁');
    expect(projection.recentActivities.map((activity) => activity.title)).toEqual([
      '发布第一篇内容',
      '创建第一个引流磁铁',
      '漏斗页面',
    ]);
    expect(projection.blockedAreas).toEqual(['漏斗页面', 'Build the funnel']);
    expect(projection.completedMilestones).toEqual([
      '完成品牌访谈',
      '发布第一篇内容',
      'Brand Architect 徽章',
    ]);
    expect(projection.recommendedFocus).toBe('先处理：漏斗页面');
    expect(projection.recommendationMemory.recentlyIssuedIds).toEqual(['mission-current-MISSION_005']);
  });

  it('derives execution pattern without exposing raw event logs to consumers', () => {
    const pattern = deriveExecutionPattern([
      ...events,
      {
        ...events[0],
        id: 'evt_4',
        title: '完成品牌 DNA',
        referenceId: 'MISSION_003',
        occurredAt: '2026-06-15T10:00:00.000Z',
      },
      {
        ...events[0],
        id: 'evt_5',
        title: '完成品牌访谈',
        referenceId: 'MISSION_002',
        occurredAt: '2026-06-14T10:00:00.000Z',
      },
    ], new Date('2026-06-19T00:00:00.000Z'));

    expect(pattern).toMatchObject({
      activityLevel: 'active',
      completionVelocity: 'steady',
      consistency: 'medium',
    });
  });
});
