import prisma from '@/lib/prisma';
import { businessStateService } from '@/modules/business-state/services/BusinessStateService';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import type { COORecommendation } from '@/modules/ai-coo/contracts/COORecommendation';
import type { BusinessContextProjection, BusinessMemoryEvent } from '../contracts/BusinessContextMemory';
import { buildBusinessContextProjection } from './business-memory-projection';
import { businessMemoryEventStore } from './business-memory-event-store';
import {
  buildWeeklyReviewProjection,
  type WeeklyReviewProjection,
} from './weekly-review-projection';

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

async function loadMergedMemoryEvents(userId: string, tenantId?: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true },
  });

  if (!user) throw new Error('User not found');

  const resolvedTenantId = tenantId ?? user.tenantId;
  const [memoryEvents, missions] = await Promise.all([
    businessMemoryEventStore.list(user.id, resolvedTenantId),
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

  const missionEvents = missions
    .map(missionToEvent)
    .filter((event): event is BusinessMemoryEvent => Boolean(event));

  return {
    user,
    tenantId: resolvedTenantId,
    events: [...memoryEvents, ...missionEvents],
  };
}

export const businessContextMemoryService = {
  async getBusinessContext(userId: string, tenantId?: string): Promise<BusinessContextProjection> {
    const memory = await loadMergedMemoryEvents(userId, tenantId);
    const [businessState, missionAuthority, progress, achievements] = await Promise.all([
      businessStateService.getBusinessState(memory.user.id),
      missionEngineAuthorityService.getCurrentMission(memory.user.id),
      prisma.userProgress.findUnique({
        where: { userId: memory.user.id },
        select: { completedChecks: true },
      }),
      prisma.achievement.findMany({
        where: { userId: memory.user.id, tenantId: memory.tenantId },
        orderBy: { unlockedAt: 'desc' },
        take: 8,
        select: { title: true },
      }),
    ]);

    return buildBusinessContextProjection({
      events: memory.events,
      completedChecks: stringArray(progress?.completedChecks),
      achievementTitles: achievements.map((achievement) => achievement.title),
      businessBottlenecks: businessState.bottlenecks,
      currentMissionTitle: missionAuthority.currentMission.title,
      currentMissionDescription: missionAuthority.currentMission.description,
    });
  },

  async getWeeklyReview(userId: string, tenantId?: string): Promise<WeeklyReviewProjection> {
    const memory = await loadMergedMemoryEvents(userId, tenantId);
    return buildWeeklyReviewProjection({ events: memory.events });
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
