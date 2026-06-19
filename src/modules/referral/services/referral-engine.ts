import prisma from '@/lib/prisma';
import { getInterviewAuthorityProjection } from '@/modules/interview-authority/services/interview-authority-service';
import { expansionEngine } from '@/modules/expansion/services/expansion-engine';
import { retentionEngine } from '@/modules/retention/services/retention-engine';
import { valueRealizationEngine } from '@/modules/value/services/value-realization-engine';
import type { ReferralProjection } from '../contracts/ReferralProjection';
import { buildReferralProjection } from './referral-projection';

const POSITIVE_FEEDBACK_TYPES = ['positive', 'testimonial', 'review', 'success', 'nps_promoter'];
const NEGATIVE_FEEDBACK_TYPES = ['negative', 'complaint', 'bug', 'nps_detractor'];

function isReferralSource(source: string | null) {
  if (!source) return false;
  const normalized = source.toLowerCase();
  return normalized.includes('referral') || normalized.includes('invite') || normalized.includes('推荐') || normalized.includes('转介绍');
}

async function countFeedbackSignals(input: { tenantId: string | null; userId: string; types: string[] }) {
  if (!input.tenantId) return 0;

  try {
    return await prisma.feedback.count({
      where: {
        tenantId: input.tenantId,
        userId: input.userId,
        OR: input.types.map((type) => ({ type: { contains: type, mode: 'insensitive' as const } })),
      },
    });
  } catch (error) {
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2021') {
      console.warn('feedback table missing; referral satisfaction signals defaulted to 0');
      return 0;
    }

    throw error;
  }
}

export async function getReferralProjection(userId: string, tenantId?: string): Promise<ReferralProjection> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true },
  });

  if (!user) throw new Error('User not found');

  const resolvedTenantId = tenantId ?? user.tenantId;
  const now = new Date();

  const [
    interview,
    valueProjection,
    expansionProjection,
    retentionProjection,
    inviteCounts,
    usedInviteCount,
    leads,
    referredMembers,
    positiveFeedbackCount,
    negativeFeedbackCount,
  ] = await Promise.all([
    getInterviewAuthorityProjection(user.id),
    valueRealizationEngine.getProjection(user.id, resolvedTenantId),
    expansionEngine.getProjection(user.id, resolvedTenantId),
    retentionEngine.getProjection(user.id, resolvedTenantId),
    prisma.inviteCode.count({ where: { tenantId: resolvedTenantId, sponsorId: user.id } }),
    prisma.inviteCode.count({ where: { tenantId: resolvedTenantId, sponsorId: user.id, used: true } }),
    prisma.lead.findMany({
      where: { tenantId: resolvedTenantId, ownerId: user.id, deletedAt: null },
      select: { source: true },
      take: 500,
    }),
    prisma.user.count({ where: { tenantId: resolvedTenantId, sponsorId: user.id, deletedAt: null } }),
    countFeedbackSignals({ tenantId: resolvedTenantId, userId: user.id, types: POSITIVE_FEEDBACK_TYPES }),
    countFeedbackSignals({ tenantId: resolvedTenantId, userId: user.id, types: NEGATIVE_FEEDBACK_TYPES }),
  ]);

  return buildReferralProjection({
    businessMode: interview.businessMode,
    generatedAt: now.toISOString(),
    valueProjection,
    expansionProjection,
    retentionProjection,
    referralInvitesCreated: inviteCounts,
    referralInvitesUsed: usedInviteCount,
    referralLeads: leads.filter((lead) => isReferralSource(lead.source)).length,
    referredMembers,
    positiveSatisfactionSignals: positiveFeedbackCount,
    negativeSatisfactionSignals: negativeFeedbackCount,
  });
}

export const referralEngine = {
  getProjection: getReferralProjection,
};
