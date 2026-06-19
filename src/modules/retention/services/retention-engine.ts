import prisma from '@/lib/prisma';
import type { MomentumWin, RetentionProjection } from '../contracts/RetentionProjection';
import { buildRetentionProjection } from './retention-projection';

const THIRTY_DAYS_MS = 30 * 86_400_000;

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function dateFromMetadata(value: unknown): Date | null {
  const record = metadataRecord(value);
  const landingPage = metadataRecord(record.landingPage);
  const dateValue = record.updatedAt ?? record.generatedAt ?? record.createdAt ?? landingPage.publishedAt;
  if (typeof dateValue !== 'string') return null;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

function dayKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

function countActiveDays(dates: Date[]) {
  return new Set(dates.map(dayKey)).size;
}

function latestDate(dates: Date[], fallback: Date) {
  if (dates.length === 0) return fallback;
  return dates.reduce((latest, date) => date > latest ? date : latest, fallback);
}

export async function getRetentionProjection(userId: string, tenantId?: string): Promise<RetentionProjection> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tenantId: true,
      createdAt: true,
      updatedAt: true,
      metadata: true,
    },
  });

  if (!user) throw new Error('User not found');

  const resolvedTenantId = tenantId ?? user.tenantId;
  const now = new Date();
  const since = new Date(now.getTime() - THIRTY_DAYS_MS);
  const metadata = metadataRecord(user.metadata);
  const leadMagnetDate = dateFromMetadata(metadata.lead_magnet);

  const [
    loginEvents,
    analyticsEvents,
    completedMissions,
    totalMissions,
    contentRows,
    launchedFunnels,
    executionCompletedCount,
    executionFailedCount,
    aiCooInteractions,
    achievements,
    businessMemoryWins,
  ] = await Promise.all([
    prisma.analyticsEvent.count({
      where: {
        tenantId: resolvedTenantId,
        userId: user.id,
        eventName: { in: ['login', 'user_login', 'auth.login', 'SIGNED_IN'] },
        createdAt: { gte: since },
      },
    }),
    prisma.analyticsEvent.findMany({
      where: { tenantId: resolvedTenantId, userId: user.id, createdAt: { gte: since } },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 100,
    }),
    prisma.mission.findMany({
      where: { tenantId: resolvedTenantId, userId: user.id, status: 'completed', completedAt: { gte: since } },
      select: { title: true, completedAt: true, createdAt: true },
      orderBy: { completedAt: 'desc' },
      take: 50,
    }),
    prisma.mission.count({
      where: {
        tenantId: resolvedTenantId,
        userId: user.id,
        OR: [
          { createdAt: { gte: since } },
          { completedAt: { gte: since } },
        ],
      },
    }),
    prisma.content.findMany({
      where: { tenantId: resolvedTenantId, ownerId: user.id, createdAt: { gte: since } },
      select: { title: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
    prisma.funnel.findMany({
      where: { tenantId: resolvedTenantId, ownerId: user.id, status: 'published', publishedAt: { gte: since } },
      select: { title: true, publishedAt: true, createdAt: true },
      orderBy: { publishedAt: 'desc' },
      take: 50,
    }),
    prisma.auditLog.count({
      where: { tenantId: resolvedTenantId, actorId: user.id, targetType: 'autonomous_execution', action: 'EXECUTION_COMPLETED', createdAt: { gte: since } },
    }),
    prisma.auditLog.count({
      where: { tenantId: resolvedTenantId, actorId: user.id, targetType: 'autonomous_execution', action: 'EXECUTION_FAILED', createdAt: { gte: since } },
    }),
    prisma.auditLog.count({
      where: { tenantId: resolvedTenantId, actorId: user.id, targetType: 'business_memory', action: 'COO_DECISION_MADE', createdAt: { gte: since } },
    }),
    prisma.achievement.findMany({
      where: { tenantId: resolvedTenantId, userId: user.id, unlockedAt: { gte: since } },
      select: { title: true, unlockedAt: true },
      orderBy: { unlockedAt: 'desc' },
      take: 50,
    }),
    prisma.auditLog.findMany({
      where: {
        tenantId: resolvedTenantId,
        actorId: user.id,
        targetType: 'business_memory',
        action: { in: ['MISSION_COMPLETED', 'EXECUTION_COMPLETED', 'MILESTONE_COMPLETED'] },
        createdAt: { gte: since },
      },
      select: { action: true, metadata: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 50,
    }),
  ]);

  const activityDates = [
    user.updatedAt,
    ...analyticsEvents.map((event) => event.createdAt),
    ...completedMissions.map((mission) => mission.completedAt ?? mission.createdAt),
    ...contentRows.map((content) => content.createdAt),
    ...launchedFunnels.map((funnel) => funnel.publishedAt ?? funnel.createdAt),
    ...achievements.map((achievement) => achievement.unlockedAt),
    ...businessMemoryWins.map((win) => win.createdAt),
  ].filter((date) => date >= since);

  const leadMagnetRecent = Boolean(leadMagnetDate && leadMagnetDate >= since);
  const recentWins: MomentumWin[] = [
    ...completedMissions.map((mission) => ({
      type: 'mission' as const,
      title: mission.title,
      occurredAt: (mission.completedAt ?? mission.createdAt).toISOString(),
    })),
    ...contentRows.map((content) => ({
      type: 'content' as const,
      title: content.title ?? '内容已生成',
      occurredAt: content.createdAt.toISOString(),
    })),
    ...launchedFunnels.map((funnel) => ({
      type: 'funnel' as const,
      title: funnel.title,
      occurredAt: (funnel.publishedAt ?? funnel.createdAt).toISOString(),
    })),
    ...achievements.map((achievement) => ({
      type: 'achievement' as const,
      title: achievement.title,
      occurredAt: achievement.unlockedAt.toISOString(),
    })),
    ...businessMemoryWins.map((win) => {
      const metadata = metadataRecord(win.metadata);
      return {
        type: 'execution' as const,
        title: String(metadata.title ?? win.action),
        occurredAt: win.createdAt.toISOString(),
      };
    }),
  ].sort((a, b) => b.occurredAt.localeCompare(a.occurredAt));

  if (leadMagnetRecent && leadMagnetDate) {
    recentWins.push({
      type: 'lead_magnet',
      title: '引流磁铁已创建',
      occurredAt: leadMagnetDate.toISOString(),
    });
  }

  const lastActivityAt = latestDate(activityDates, user.updatedAt);

  return buildRetentionProjection({
    userCreatedAt: user.createdAt,
    lastActivityAt,
    generatedAt: now.toISOString(),
    loginEvents30d: loginEvents || countActiveDays(activityDates),
    activeDays30d: countActiveDays(activityDates),
    missionCompleted30d: completedMissions.length,
    missionTotal30d: totalMissions,
    contentGenerated30d: contentRows.length,
    executionCompleted30d: executionCompletedCount,
    executionFailed30d: executionFailedCount,
    aiCooInteractions30d: aiCooInteractions,
    leadMagnetsCreated30d: leadMagnetRecent ? 1 : 0,
    funnelsLaunched30d: launchedFunnels.length,
    winsAchieved30d: recentWins.length,
    recentWins,
  });
}

export const retentionEngine = {
  getProjection: getRetentionProjection,
};
