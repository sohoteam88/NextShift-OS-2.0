import prisma from '@/lib/prisma';
import { getInterviewAuthorityProjection } from '@/modules/interview-authority/services/interview-authority-service';
import { retentionEngine } from '@/modules/retention/services/retention-engine';
import { valueRealizationEngine } from '@/modules/value/services/value-realization-engine';
import type { ExpansionProjection } from '../contracts/ExpansionProjection';
import { metric } from './expansion-facts';
import { buildExpansionProjection } from './expansion-projection';

const THIRTY_DAYS_MS = 30 * 86_400_000;

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

export async function getExpansionProjection(userId: string, tenantId?: string): Promise<ExpansionProjection> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true },
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
      select: { metadata: true },
      take: 500,
    }),
    prisma.customer.findMany({
      where: { tenantId: resolvedTenantId, ownerId: user.id, purchaseDate: { gte: previousSince, lt: currentSince } },
      select: { metadata: true },
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
  ]);

  const currentRevenue = revenueFromCustomers(currentCustomers);
  const previousRevenue = revenueFromCustomers(previousCustomers);
  const currentAudienceTotal = Math.max(currentAudience._sum.reach ?? 0, currentAudience._sum.impressions ?? 0);
  const previousAudienceTotal = Math.max(previousAudience._sum.reach ?? 0, previousAudience._sum.impressions ?? 0);

  return buildExpansionProjection({
    businessMode: interview.businessMode,
    generatedAt: now.toISOString(),
    valueProjection,
    retentionProjection,
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

export const expansionEngine = {
  getProjection: getExpansionProjection,
};
