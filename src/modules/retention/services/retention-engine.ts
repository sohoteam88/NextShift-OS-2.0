import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import type { MomentumWin, RetentionProjection } from '../contracts/RetentionProjection';
import { buildRetentionProjection } from './retention-projection';
import type { OutcomeTemplateId } from '@/modules/mission-engine/services/OutcomeOrchestrator';

const THIRTY_DAYS_MS = 30 * 86_400_000;

export const RETENTION_AUDIT_ACTIONS = {
  progressed: 'retention.progressed',
  atRisk: 'retention.at_risk',
  stalled: 'retention.stalled',
  recovered: 'retention.recovered',
  expanding: 'retention.expanding',
} as const;

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

function numberFromMetadata(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string') {
    const parsed = Number(value.replace(/[^\d.]/g, ''));
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function revenueFromCustomers(customers: Array<{ metadata: unknown }>) {
  return customers.reduce((sum, customer) => {
    const metadata = metadataRecord(customer.metadata);
    return sum
      + numberFromMetadata(metadata.revenue)
      + numberFromMetadata(metadata.amount)
      + numberFromMetadata(metadata.value)
      + numberFromMetadata(metadata.purchaseAmount);
  }, 0);
}

function nextOutcomeFor(input: { leadCount: number; customerCount: number; revenue: number }): OutcomeTemplateId {
  if (input.revenue > 0) return 'RETENTION_SYSTEM';
  if (input.customerCount > 0) return 'FIRST_REVENUE';
  if (input.leadCount > 0) return 'FIRST_CUSTOMER';
  return 'FIRST_LEAD';
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
      languagePreference: true,
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
    leads,
    customers,
    completedOutcomeAudits,
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
    prisma.lead.findMany({
      where: { tenantId: resolvedTenantId, ownerId: user.id, deletedAt: null },
      select: { createdAt: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    }),
    prisma.customer.findMany({
      where: { tenantId: resolvedTenantId, ownerId: user.id },
      select: { createdAt: true, purchaseDate: true, metadata: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    }),
    prisma.auditLog.findMany({
      where: {
        tenantId: resolvedTenantId,
        actorId: user.id,
        targetType: 'business_outcome',
        action: 'outcome.completed',
      },
      select: { targetId: true, createdAt: true, metadata: true },
      orderBy: { createdAt: 'asc' },
      take: 100,
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
    ...leads.map((lead) => lead.createdAt),
    ...customers.map((customer) => customer.purchaseDate ?? customer.createdAt),
    ...completedOutcomeAudits.map((audit) => audit.createdAt),
  ].filter((date) => date >= since);

  const leadMagnetRecent = Boolean(leadMagnetDate && leadMagnetDate >= since);
  const revenue = revenueFromCustomers(customers);
  const derivedOutcomeDates = [
    leads[0]?.createdAt,
    leads[1]?.createdAt,
    customers[0]?.createdAt,
    revenue > 0 ? customers.find((customer) => customer.purchaseDate || customer.createdAt)?.purchaseDate ?? customers[0]?.createdAt : null,
    ...completedOutcomeAudits.map((audit) => audit.createdAt),
  ].filter((date): date is Date => Boolean(date));
  const derivedOutcomeCount = [
    leads.length > 0,
    leads.length >= 2,
    customers.length > 0,
    revenue > 0,
  ].filter(Boolean).length;
  const outcomeCompletionCount = Math.max(derivedOutcomeCount, completedOutcomeAudits.length);
  const outcomeCompletionCount30d = Math.max(
    [
      leads[0]?.createdAt,
      leads[1]?.createdAt,
      customers[0]?.createdAt,
      revenue > 0 ? customers[0]?.purchaseDate ?? customers[0]?.createdAt : null,
    ].filter((date): date is Date => Boolean(date && date >= since)).length,
    completedOutcomeAudits.filter((audit) => audit.createdAt >= since).length,
  );
  const lastOutcomeAt = derivedOutcomeDates.length > 0
    ? latestDate(derivedOutcomeDates, user.createdAt)
    : null;
  const currentOutcome = nextOutcomeFor({
    leadCount: leads.length,
    customerCount: customers.length,
    revenue,
  });
  const currentOutcomeProgressPercentage = currentOutcome === 'FIRST_LEAD'
    ? 0
    : currentOutcome === 'FIRST_CUSTOMER'
      ? Math.min(90, leads.length * 35)
      : currentOutcome === 'FIRST_REVENUE'
        ? Math.min(90, customers.length * 50)
        : Math.min(90, outcomeCompletionCount * 20);
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
    ...completedOutcomeAudits.map((audit) => {
      const metadata = metadataRecord(audit.metadata);
      return {
        type: 'outcome' as const,
        title: String(metadata.templateId ?? metadata.outcomeId ?? audit.targetId ?? 'Outcome completed'),
        occurredAt: audit.createdAt.toISOString(),
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
    outcomeCompletionCount,
    outcomeCompletionCount30d,
    lastOutcomeAt,
    currentOutcome,
    currentOutcomeProgressPercentage,
    assetUtilizationCount30d: contentRows.length + (leadMagnetRecent ? 1 : 0) + launchedFunnels.length,
    agentUsageCount30d: aiCooInteractions,
    locale: user.languagePreference,
    recentWins,
  });
}

async function writeRetentionAuditIfMissing(input: {
  user: AuthUser;
  action: string;
  targetId: string;
  projection: RetentionProjection;
}) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      tenantId: input.user.tenantId,
      actorId: input.user.id,
      action: input.action,
      targetType: 'retention',
      targetId: input.targetId,
    },
    select: { id: true },
  });
  if (existing) return;

  await prisma.auditLog.create({
    data: {
      tenantId: input.user.tenantId,
      actorId: input.user.id,
      action: input.action,
      targetType: 'retention',
      targetId: input.targetId,
      metadata: {
        retentionLevel: input.projection.outcomeRetention.retentionLevel,
        outcomeCount: input.projection.momentum.outcomesCompleted,
        progressPercentage: input.projection.outcomeRetention.progressPercentage,
        nextOutcome: input.projection.outcomeRetention.nextOutcome,
        retained: input.projection.outcomeRetention.retained,
        locale: input.projection.localization.locale,
        translationSource: input.projection.localization.translationSource,
        fallbackUsed: input.projection.localization.fallbackUsed,
        messageKeys: input.projection.localization.messageKeys,
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

export async function ensureRetentionAudit(input: {
  user: AuthUser;
  projection: RetentionProjection;
}) {
  if (input.projection.outcomeRetention.retentionLevel === 'EXPANDING') {
    await writeRetentionAuditIfMissing({
      user: input.user,
      action: RETENTION_AUDIT_ACTIONS.expanding,
      targetId: `${input.projection.outcomeRetention.nextOutcome}:expanding`,
      projection: input.projection,
    });
  }

  if (input.projection.outcomeRetention.retentionLevel === 'AT_RISK') {
    await writeRetentionAuditIfMissing({
      user: input.user,
      action: RETENTION_AUDIT_ACTIONS.atRisk,
      targetId: `${input.projection.outcomeRetention.nextOutcome}:at_risk`,
      projection: input.projection,
    });
  }

  if (input.projection.outcomeRetention.retentionLevel === 'STALLED') {
    await writeRetentionAuditIfMissing({
      user: input.user,
      action: RETENTION_AUDIT_ACTIONS.stalled,
      targetId: `${input.projection.outcomeRetention.nextOutcome}:stalled`,
      projection: input.projection,
    });
  }

  if (input.projection.retentionRecovery.needed) {
    await writeRetentionAuditIfMissing({
      user: input.user,
      action: RETENTION_AUDIT_ACTIONS.recovered,
      targetId: `${input.projection.outcomeRetention.nextOutcome}:recovery`,
      projection: input.projection,
    });
  }

  if (input.projection.outcomeRetention.progressPercentage > 0) {
    await writeRetentionAuditIfMissing({
      user: input.user,
      action: RETENTION_AUDIT_ACTIONS.progressed,
      targetId: `${input.projection.outcomeRetention.nextOutcome}:${input.projection.outcomeRetention.progressPercentage}`,
      projection: input.projection,
    });
  }
}

export const retentionEngine = {
  getProjection: getRetentionProjection,
  ensureAudit: ensureRetentionAudit,
};
