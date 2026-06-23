import { describe, expect, it, vi } from 'vitest';

const prismaMocks = vi.hoisted(() => ({
  auditLog: {
    findMany: vi.fn(),
  },
}));

vi.mock('@/lib/prisma', () => ({ default: prismaMocks }));

import { readRecentPriorityHistory } from '@/modules/mission-engine/services/MissionEngineAuthorityService';

describe('HOTFIX-003 priority history retrieval', () => {
  it('loads recent projected mission decisions and marks resolved actions', async () => {
    prismaMocks.auditLog.findMany.mockResolvedValueOnce([
      {
        metadata: {
          priorityAction: 'Create Lead Magnet',
          bottleneck: 'NO_FUNNEL',
          completionStatus: 'completed',
        },
      },
      {
        metadata: {
          priorityAction: 'Build Funnel',
          bottleneck: 'NO_FUNNEL',
          completionStatus: 'active',
        },
      },
    ]);

    const history = await readRecentPriorityHistory({
      userId: 'user_1',
      currentBottleneck: 'NO_LEAD_MAGNET',
      now: new Date('2026-06-22T00:00:00.000Z'),
    });

    expect(prismaMocks.auditLog.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        actorId: 'user_1',
        action: 'mission.decision.projected',
        createdAt: { gte: new Date('2026-06-15T00:00:00.000Z') },
      }),
      take: 20,
    }));
    expect(history).toEqual([
      {
        priorityAction: 'Create Lead Magnet',
        bottleneck: 'NO_FUNNEL',
        completionStatus: 'completed',
        resolved: true,
      },
      {
        priorityAction: 'Build Funnel',
        bottleneck: 'NO_FUNNEL',
        completionStatus: 'active',
        resolved: false,
      },
    ]);
  });

  it('treats same current bottleneck as not resolved', async () => {
    prismaMocks.auditLog.findMany.mockResolvedValueOnce([
      {
        metadata: {
          priorityAction: 'Create Lead Magnet',
          bottleneck: 'NO_LEAD_MAGNET',
          completionStatus: 'completed',
        },
      },
    ]);

    const history = await readRecentPriorityHistory({
      userId: 'user_1',
      currentBottleneck: 'NO_LEAD_MAGNET',
      now: new Date('2026-06-22T00:00:00.000Z'),
    });

    expect(history[0]).toMatchObject({
      priorityAction: 'Create Lead Magnet',
      bottleneck: 'NO_LEAD_MAGNET',
      completionStatus: 'completed',
      resolved: false,
    });
  });
});
