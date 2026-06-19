import prisma from '@/lib/prisma';
import { getInterviewAuthorityProjection } from '@/modules/interview-authority/services/interview-authority-service';
import type { ValueProjection } from '../contracts/ValueProjection';
import { buildValueProjection } from './value-projection';

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

function isAppointmentStage(stage: string) {
  const normalized = stage.toLowerCase();
  return normalized.includes('appointment') || normalized.includes('预约') || normalized.includes('book');
}

function isCustomerStage(stage: string) {
  const normalized = stage.toLowerCase();
  return normalized.includes('customer') || normalized.includes('converted') || normalized.includes('won') || normalized.includes('已转化');
}

export async function getValueProjection(userId: string, tenantId?: string): Promise<ValueProjection> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true },
  });

  if (!user) throw new Error('User not found');

  const resolvedTenantId = tenantId ?? user.tenantId;
  const [
    interview,
    firstPublishedContent,
    publishedContentCount,
    performanceAggregate,
    first100Performance,
    first1000Performance,
    firstLead,
    leads,
    appointmentActivities,
    customers,
    downlineCount,
  ] = await Promise.all([
    getInterviewAuthorityProjection(user.id),
    prisma.content.findFirst({
      where: { tenantId: resolvedTenantId, ownerId: user.id, status: 'published' },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.content.count({ where: { tenantId: resolvedTenantId, ownerId: user.id, status: 'published' } }),
    prisma.postPerformance.aggregate({
      where: { tenantId: resolvedTenantId, userId: user.id },
      _sum: { reach: true, impressions: true },
    }),
    prisma.postPerformance.findFirst({
      where: {
        tenantId: resolvedTenantId,
        userId: user.id,
        OR: [{ reach: { gte: 100 } }, { impressions: { gte: 100 } }],
      },
      orderBy: { publishedAt: 'asc' },
      select: { publishedAt: true },
    }),
    prisma.postPerformance.findFirst({
      where: {
        tenantId: resolvedTenantId,
        userId: user.id,
        OR: [{ reach: { gte: 1000 } }, { impressions: { gte: 1000 } }],
      },
      orderBy: { publishedAt: 'asc' },
      select: { publishedAt: true },
    }),
    prisma.lead.findFirst({
      where: { tenantId: resolvedTenantId, ownerId: user.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.lead.findMany({
      where: { tenantId: resolvedTenantId, ownerId: user.id, deletedAt: null },
      select: { pipelineStage: true, createdAt: true, updatedAt: true },
      orderBy: { createdAt: 'asc' },
      take: 500,
    }),
    prisma.activity.findMany({
      where: { tenantId: resolvedTenantId, userId: user.id, type: 'appointment' },
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
    prisma.user.count({ where: { tenantId: resolvedTenantId, sponsorId: user.id, deletedAt: null } }),
  ]);

  const appointmentLead = leads.find((lead) => isAppointmentStage(lead.pipelineStage));
  const customerLead = leads.find((lead) => isCustomerStage(lead.pipelineStage));
  const firstCustomer = customers[0];
  const revenueGenerated = revenueFromCustomers(customers);
  const viewsGenerated = Math.max(performanceAggregate._sum.reach ?? 0, performanceAggregate._sum.impressions ?? 0);

  return buildValueProjection({
    businessMode: interview.businessMode,
    generatedAt: new Date().toISOString(),
    leadsGenerated: leads.length,
    appointmentsBooked: appointmentActivities.length + leads.filter((lead) => isAppointmentStage(lead.pipelineStage)).length,
    customersAcquired: customers.length + leads.filter((lead) => isCustomerStage(lead.pipelineStage)).length,
    revenueGenerated,
    teamMembersRecruited: downlineCount,
    contentPublished: publishedContentCount,
    viewsGenerated,
    firstContentPublishedAt: firstPublishedContent?.createdAt ?? null,
    first100ViewsAt: first100Performance?.publishedAt ?? null,
    first1000ViewsAt: first1000Performance?.publishedAt ?? null,
    firstLeadAt: firstLead?.createdAt ?? null,
    firstAppointmentAt: appointmentActivities[0]?.createdAt ?? appointmentLead?.updatedAt ?? null,
    firstCustomerAt: firstCustomer?.createdAt ?? customerLead?.updatedAt ?? null,
    firstSaleAt: revenueGenerated > 0 ? firstCustomer?.purchaseDate ?? firstCustomer?.createdAt ?? customerLead?.updatedAt ?? null : customerLead?.updatedAt ?? null,
    firstTeamMemberAt: downlineCount > 0 ? new Date() : null,
  });
}

export const valueRealizationEngine = {
  getProjection: getValueProjection,
};
