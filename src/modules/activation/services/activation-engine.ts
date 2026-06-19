import prisma from '@/lib/prisma';
import type { ActivationProjection } from '../contracts/ActivationProjection';
import { buildActivationProjection } from './activation-projection';

function dateFromMetadata(value: unknown): Date | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null;
  const record = value as Record<string, unknown>;
  const dateValue =
    record.updatedAt ??
    record.generatedAt ??
    record.createdAt ??
    (record.landingPage && typeof record.landingPage === 'object' && !Array.isArray(record.landingPage)
      ? (record.landingPage as Record<string, unknown>).publishedAt
      : null);

  if (typeof dateValue !== 'string') return null;
  const date = new Date(dateValue);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function getActivationProjection(userId: string, tenantId?: string): Promise<ActivationProjection> {
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
  const metadata = user.metadata && typeof user.metadata === 'object' && !Array.isArray(user.metadata)
    ? user.metadata as Record<string, unknown>
    : {};

  const completedInterviewStatuses = ['ready_for_analysis', 'extracted', 'confirmed'];
  const [
    firstInterview,
    completedInterview,
    brandProfile,
    firstContent,
    firstLead,
    publishedLandingPage,
  ] = await Promise.all([
    prisma.brandInterview.findFirst({
      where: { tenantId: resolvedTenantId, userId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.brandInterview.findFirst({
      where: { tenantId: resolvedTenantId, userId: user.id, status: { in: completedInterviewStatuses } },
      orderBy: { updatedAt: 'asc' },
      select: { updatedAt: true },
    }),
    prisma.brandProfile.findUnique({
      where: { userId: user.id },
      select: { createdAt: true, updatedAt: true },
    }),
    prisma.content.findFirst({
      where: { tenantId: resolvedTenantId, ownerId: user.id },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.lead.findFirst({
      where: { tenantId: resolvedTenantId, ownerId: user.id, deletedAt: null },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.funnel.findFirst({
      where: { tenantId: resolvedTenantId, ownerId: user.id, status: 'published' },
      orderBy: { publishedAt: 'asc' },
      select: { publishedAt: true, createdAt: true },
    }),
  ]);

  const leadMagnetFromMetadata = dateFromMetadata(metadata.lead_magnet);
  const landingPagePublishedAt = publishedLandingPage?.publishedAt ?? publishedLandingPage?.createdAt ?? null;

  return buildActivationProjection({
    userCreatedAt: user.createdAt,
    interviewStartedAt: firstInterview?.createdAt ?? null,
    interviewCompletedAt: completedInterview?.updatedAt ?? null,
    brandDnaGeneratedAt: brandProfile?.updatedAt ?? brandProfile?.createdAt ?? null,
    firstContentGeneratedAt: firstContent?.createdAt ?? null,
    firstLeadCapturedAt: firstLead?.createdAt ?? null,
    leadMagnetGeneratedAt: leadMagnetFromMetadata ?? landingPagePublishedAt,
    landingPagePublishedAt,
    lastActivityAt: user.updatedAt,
    generatedAt: new Date().toISOString(),
  });
}

export const activationEngine = {
  getProjection: getActivationProjection,
};
