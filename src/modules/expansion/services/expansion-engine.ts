import prisma from '@/lib/prisma';
import { runAuditBestEffort, writeAuditIfMissing } from '@/lib/audit-log-writer';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { getInterviewAuthorityProjection } from '@/modules/interview-authority/services/interview-authority-service';
import { retentionEngine } from '@/modules/retention/services/retention-engine';
import { valueRealizationEngine } from '@/modules/value/services/value-realization-engine';
import type { ExpansionProjection } from '../contracts/ExpansionProjection';
import { metric } from './expansion-facts';
import { buildExpansionProjection } from './expansion-projection';

const THIRTY_DAYS_MS = 30 * 86_400_000;

export const EXPANSION_AUDIT_ACTIONS = {
  progressed: 'expansion.progressed',
  opportunityCreated: 'expansion.opportunity.created',
  plateauDetected: 'expansion.plateau.detected',
  recovered: 'expansion.recovered',
  levelChanged: 'expansion.level.changed',
} as const;

function metadataRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
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

function latestDate(dates: Date[]) {
  if (dates.length === 0) return null;
  const first = dates[0] as Date;
  const rest = dates.slice(1);
  return rest.reduce((latest, date) => date > latest ? date : latest, first);
}

export async function getExpansionProjection(userId: string, tenantId?: string): Promise<ExpansionProjection> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true, languagePreference: true },
  });

  if (!user) throw new Error('User not found');

  const resolvedTenantId = tenantId ?? user.tenantId;
  const now = new Date();
  const currentSince = new Date(now.getTime() - THIRTY_DAYS_MS);
  const previousSince = new Date(now.getTime() - THIRTY_DAYS_MS * 2);

  const [
    interview,
    valueProjection,
    retentionProjection,
    currentLeads,
    previousLeads,
    currentCustomers,
    previousCustomers,
    currentContent,
    previousContent,
    currentAudience,
    previousAudience,
    currentTeam,
    previousTeam,
    currentTeamRows,
    previousTeamRows,
    completedOutcomeAudits,
  ] = await Promise.all([
    getInterviewAuthorityProjection(user.id),
    valueRealizationEngine.getProjection(user.id, resolvedTenantId),
    retentionEngine.getProjection(user.id, resolvedTenantId),
    prisma.lead.count({
      where: { tenantId: resolvedTenantId, ownerId: user.id, deletedAt: null, createdAt: { gte: currentSince } },
    }),
    prisma.lead.count({
      where: { tenantId: resolvedTenantId, ownerId: user.id, deletedAt: null, createdAt: { gte: previousSince, lt: currentSince } },
    }),
    prisma.customer.findMany({
      where: { tenantId: resolvedTenantId, ownerId: user.id, purchaseDate: { gte: currentSince } },
      select: { metadata: true, purchaseDate: true },
      take: 500,
    }),
    prisma.customer.findMany({
      where: { tenantId: resolvedTenantId, ownerId: user.id, purchaseDate: { gte: previousSince, lt: currentSince } },
      select: { metadata: true, purchaseDate: true },
      take: 500,
    }),
    prisma.content.count({
      where: { tenantId: resolvedTenantId, ownerId: user.id, status: 'published', createdAt: { gte: currentSince } },
    }),
    prisma.content.count({
      where: { tenantId: resolvedTenantId, ownerId: user.id, status: 'published', createdAt: { gte: previousSince, lt: currentSince } },
    }),
    prisma.postPerformance.aggregate({
      where: { tenantId: resolvedTenantId, userId: user.id, publishedAt: { gte: currentSince } },
      _sum: { reach: true, impressions: true },
    }),
    prisma.postPerformance.aggregate({
      where: { tenantId: resolvedTenantId, userId: user.id, publishedAt: { gte: previousSince, lt: currentSince } },
      _sum: { reach: true, impressions: true },
    }),
    prisma.user.count({
      where: { tenantId: resolvedTenantId, sponsorId: user.id, deletedAt: null, createdAt: { gte: currentSince } },
    }),
    prisma.user.count({
      where: { tenantId: resolvedTenantId, sponsorId: user.id, deletedAt: null, createdAt: { gte: previousSince, lt: currentSince } },
    }),
    prisma.user.findMany({
      where: { tenantId: resolvedTenantId, sponsorId: user.id, deletedAt: null, createdAt: { gte: currentSince } },
      select: { createdAt: true },
      take: 500,
    }),
    prisma.user.findMany({
      where: { tenantId: resolvedTenantId, sponsorId: user.id, deletedAt: null, createdAt: { gte: previousSince, lt: currentSince } },
      select: { createdAt: true },
      take: 500,
    }),
    prisma.auditLog.findMany({
      where: {
        tenantId: resolvedTenantId,
        actorId: user.id,
        action: 'outcome.completed',
        targetType: 'business_outcome',
      },
      select: { createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    }),
  ]);

  const currentRevenue = revenueFromCustomers(currentCustomers);
  const previousRevenue = revenueFromCustomers(previousCustomers);
  const currentAudienceTotal = Math.max(currentAudience._sum.reach ?? 0, currentAudience._sum.impressions ?? 0);
  const previousAudienceTotal = Math.max(previousAudience._sum.reach ?? 0, previousAudience._sum.impressions ?? 0);
  const revenueDates = [
    ...(currentRevenue > previousRevenue ? [now] : []),
    ...currentCustomers.filter((customer) => revenueFromCustomers([customer]) > 0).map((customer) => customer.purchaseDate),
    ...previousCustomers.filter((customer) => revenueFromCustomers([customer]) > 0).map((customer) => customer.purchaseDate),
  ];
  const teamDates = [
    ...(currentTeam > previousTeam ? [now] : []),
    ...currentTeamRows.map((member) => member.createdAt),
    ...previousTeamRows.map((member) => member.createdAt),
  ];

  return buildExpansionProjection({
    businessMode: interview.businessMode,
    generatedAt: now.toISOString(),
    valueProjection,
    retentionProjection,
    outcomeCount: Math.max(completedOutcomeAudits.length, retentionProjection.momentum.outcomesCompleted ?? 0),
    lastOutcomeAt: latestDate(completedOutcomeAudits.map((audit) => audit.createdAt)),
    lastRevenueGrowthAt: latestDate(revenueDates),
    lastTeamProgressAt: latestDate(teamDates),
    opportunityAdoptionRate: retentionProjection.outcomeRetention.progressPercentage,
    locale: user.languagePreference,
    personalization: {
      stage: retentionProjection.outcomeRetention.currentStage,
    },
    metrics: {
      leads: metric(currentLeads, previousLeads),
      customers: metric(currentCustomers.length, previousCustomers.length),
      revenue: metric(currentRevenue, previousRevenue),
      audience: metric(currentAudienceTotal, previousAudienceTotal),
      content: metric(currentContent, previousContent),
      team: metric(currentTeam, previousTeam),
    },
  });
}

async function writeExpansionAuditIfMissing(input: {
  user: AuthUser;
  action: string;
  targetKey: string;
  projection: ExpansionProjection;
}) {
  await writeAuditIfMissing({
    tenantId: input.user.tenantId,
    actorId: input.user.id,
    action: input.action,
    targetType: 'expansion',
    targetId: null,
    targetKey: input.targetKey,
    metadata: {
      expansionLevel: input.projection.expansionState.expansionLevel,
      opportunity: input.projection.expansionState.nextExpansionOpportunity,
      expanding: input.projection.expansionState.expanding,
      progress: input.projection.expansionState.expansionProgress,
      riskCode: input.projection.expansionRecovery.riskCode,
      recoveryAction: input.projection.expansionRecovery.action,
      locale: input.projection.localization.locale,
      translationSource: input.projection.localization.translationSource,
      fallbackUsed: input.projection.localization.fallbackUsed,
      messageKeys: input.projection.localization.messageKeys,
    },
  });
}

export async function ensureExpansionAudit(input: {
  user: AuthUser;
  projection: ExpansionProjection;
}) {
  await runAuditBestEffort({
    operation: 'ensureExpansionAudit',
    tenantId: input.user.tenantId,
    actorId: input.user.id,
  }, async () => {
    await writeExpansionAuditIfMissing({
      user: input.user,
      action: EXPANSION_AUDIT_ACTIONS.opportunityCreated,
      targetKey: `${input.projection.expansionState.nextExpansionOpportunity}:opportunity`,
      projection: input.projection,
    });

    if (input.projection.expansionState.expansionProgress > 0) {
      await writeExpansionAuditIfMissing({
        user: input.user,
        action: EXPANSION_AUDIT_ACTIONS.progressed,
        targetKey: `${input.projection.expansionState.nextExpansionOpportunity}:${input.projection.expansionState.expansionProgress}`,
        projection: input.projection,
      });
    }

    if (input.projection.expansionRecovery.riskCode === 'PLATEAU') {
      await writeExpansionAuditIfMissing({
        user: input.user,
        action: EXPANSION_AUDIT_ACTIONS.plateauDetected,
        targetKey: `${input.projection.expansionState.nextExpansionOpportunity}:plateau`,
        projection: input.projection,
      });
    }

    if (input.projection.expansionRecovery.needed) {
      await writeExpansionAuditIfMissing({
        user: input.user,
        action: EXPANSION_AUDIT_ACTIONS.recovered,
        targetKey: `${input.projection.expansionState.nextExpansionOpportunity}:recovery`,
        projection: input.projection,
      });
    }

    await writeExpansionAuditIfMissing({
      user: input.user,
      action: EXPANSION_AUDIT_ACTIONS.levelChanged,
      targetKey: `${input.projection.expansionState.expansionLevel}:level`,
      projection: input.projection,
    });
  });
}

export const expansionEngine = {
  getProjection: getExpansionProjection,
  ensureAudit: ensureExpansionAudit,
};
