import prisma from '@/lib/prisma';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import type { COORecommendation } from '@/modules/ai-coo/contracts/COORecommendation';
import type { BusinessContextProjection, BusinessMemoryEvent } from '../contracts/BusinessContextMemory';
import { buildBusinessContextProjection } from './business-memory-projection';
import { businessMemoryEventStore } from './business-memory-event-store';

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [];
}

function missionToEvent(mission: {
  id: string;
  tenantId: string;
  userId: string;
  title: string;
  description: string;
  status: string;
  completedAt: Date | null;
  createdAt: Date;
}): BusinessMemoryEvent | null {
  if (mission.status !== 'completed' && mission.status !== 'blocked' && mission.status !== 'abandoned') return null;

  const type =
    mission.status === 'completed'
      ? 'MISSION_COMPLETED'
      : mission.status === 'blocked'
        ? 'MISSION_BLOCKED'
        : 'MISSION_ABANDONED';

  return {
    id: `mission:${mission.id}:${mission.status}`,
    type,
    tenantId: mission.tenantId,
    userId: mission.userId,
    occurredAt: (mission.completedAt ?? mission.createdAt).toISOString(),
    title: mission.title,
    summary: mission.description,
    referenceId: mission.id,
    metadata: { source: 'mission_read_model', status: mission.status },
  };
}

export const businessContextMemoryService = {
  async getBusinessContext(userId: string, tenantId?: string): Promise<BusinessContextProjection> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, tenantId: true },
    });

    if (!user) throw new Error('User not found');

    const resolvedTenantId = tenantId ?? user.tenantId;
    const [businessState, missionAuthority, memoryEvents, progress, achievements, missions] = await Promise.all([
      businessStateService.getBusinessState(user.id),
      missionEngineAuthorityService.getCurrentMission(user.id),
      businessMemoryEventStore.list(user.id, resolvedTenantId),
      prisma.userProgress.findUnique({
        where: { userId: user.id },
        select: { completedChecks: true },
      }),
      prisma.achievement.findMany({
        where: { userId: user.id, tenantId: resolvedTenantId },
        orderBy: { unlockedAt: 'desc' },
        take: 8,
        select: { title: true },
      }),
      prisma.mission.findMany({
        where: {
          userId: user.id,
          tenantId: resolvedTenantId,
          status: { in: ['completed', 'blocked', 'abandoned'] },
        },
        orderBy: { createdAt: 'desc' },
        take: 20,
        select: {
          id: true,
          tenantId: true,
          userId: true,
          title: true,
          description: true,
          status: true,
          completedAt: true,
          createdAt: true,
        },
      }),
    ]);

    const missionEvents = missions.map(missionToEvent).filter((event): event is BusinessMemoryEvent => Boolean(event));

    return buildBusinessContextProjection({
      events: [...memoryEvents, ...missionEvents],
      completedChecks: stringArray(progress?.completedChecks),
      achievementTitles: achievements.map((achievement) => achievement.title),
      businessBottlenecks: businessState.bottlenecks,
      currentMissionTitle: missionAuthority.currentMission.title,
      currentMissionDescription: missionAuthority.currentMission.description,
    });
  },

  async recordRecommendationIssued(input: {
    userId: string;
    tenantId: string;
    recommendation: COORecommendation;
  }) {
    return businessMemoryEventStore.appendOnce({
      type: 'RECOMMENDATION_ISSUED',
      tenantId: input.tenantId,
      userId: input.userId,
      title: input.recommendation.title,
      summary: input.recommendation.summary,
      referenceId: input.recommendation.id,
      metadata: {
        recommendationSource: input.recommendation.recommendationSource,
        domain: input.recommendation.domain,
        priority: input.recommendation.priority,
      },
    });
  },
};
