import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { getInterviewAuthorityProjection } from '@/modules/interview-authority/services/interview-authority-service';
import { expansionEngine } from '@/modules/expansion/services/expansion-engine';
import { retentionEngine } from '@/modules/retention/services/retention-engine';
import { valueRealizationEngine } from '@/modules/value/services/value-realization-engine';
import type { ReferralProjection } from '../contracts/ReferralProjection';
import { buildReferralProjection } from './referral-projection';

const POSITIVE_FEEDBACK_TYPES = ['positive', 'testimonial', 'review', 'success', 'nps_promoter'];
const NEGATIVE_FEEDBACK_TYPES = ['negative', 'complaint', 'bug', 'nps_detractor'];

export const REFERRAL_AUDIT_ACTIONS = {
  ready: 'referral.ready',
  invited: 'referral.invited',
  activated: 'referral.activated',
  successful: 'referral.successful',
  levelChanged: 'referral.level.changed',
} as const;

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
    select: { id: true, tenantId: true, languagePreference: true },
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
    referredMemberRows,
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
    prisma.user.findMany({
      where: { tenantId: resolvedTenantId, sponsorId: user.id, deletedAt: null },
      select: { id: true },
      take: 500,
    }),
    countFeedbackSignals({ tenantId: resolvedTenantId, userId: user.id, types: POSITIVE_FEEDBACK_TYPES }),
    countFeedbackSignals({ tenantId: resolvedTenantId, userId: user.id, types: NEGATIVE_FEEDBACK_TYPES }),
  ]);
  const referredMemberIds = referredMemberRows.map((member) => member.id);
  const activatedAudits = referredMemberIds.length > 0
    ? await prisma.auditLog.findMany({
      where: {
        tenantId: resolvedTenantId,
        actorId: { in: referredMemberIds },
        action: 'activation.completed',
        targetType: 'activation',
      },
      select: { actorId: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
      take: 500,
    })
    : [];
  const activatedByUser = new Map(
    activatedAudits
      .filter((audit) => audit.actorId)
      .map((audit) => [audit.actorId as string, audit.createdAt]),
  );
  const referralLeads = leads.filter((lead) => isReferralSource(lead.source)).length;
  const activatedReferrals = activatedByUser.size;
  const pendingReferrals = Math.max(0, inviteCounts + referredMemberRows.length - activatedReferrals);

  return buildReferralProjection({
    businessMode: interview.businessMode,
    generatedAt: now.toISOString(),
    valueProjection,
    expansionProjection,
    retentionProjection,
    referralInvitesCreated: inviteCounts,
    referralInvitesUsed: usedInviteCount,
    referralLeads,
    referredMembers: referredMemberRows.length,
    activatedReferrals,
    successfulReferrals: activatedReferrals,
    pendingReferrals,
    ignoredReferralRequests: Math.max(0, inviteCounts - usedInviteCount - activatedReferrals),
    referralAttribution: referredMemberRows.map((member) => ({
      referralUserId: member.id,
      source: 'invite_code',
      activated: activatedByUser.has(member.id),
      successful: activatedByUser.has(member.id),
      activatedAt: activatedByUser.get(member.id)?.toISOString() ?? null,
    })),
    positiveSatisfactionSignals: positiveFeedbackCount,
    negativeSatisfactionSignals: negativeFeedbackCount,
    locale: user.languagePreference,
    personalization: {
      stage: expansionProjection.expansionState.currentExpansionStage,
    },
  });
}

async function writeReferralAuditIfMissing(input: {
  user: AuthUser;
  action: string;
  targetId: string;
  projection: ReferralProjection;
}) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      tenantId: input.user.tenantId,
      actorId: input.user.id,
      action: input.action,
      targetType: 'referral',
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
      targetType: 'referral',
      targetId: input.targetId,
      metadata: {
        referralLevel: input.projection.referralState.referralLevel,
        referralReady: input.projection.referralState.referralReady,
        referralCount: input.projection.referralState.referralCount,
        successfulReferrals: input.projection.referralState.successfulReferrals,
        pendingReferrals: input.projection.referralState.pendingReferrals,
        opportunity: input.projection.referralState.nextReferralOpportunity,
        locale: input.projection.localization.locale,
        translationSource: input.projection.localization.translationSource,
        fallbackUsed: input.projection.localization.fallbackUsed,
        messageKeys: input.projection.localization.messageKeys,
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

export async function ensureReferralAudit(input: {
  user: AuthUser;
  projection: ReferralProjection;
}) {
  if (input.projection.referralState.referralReady) {
    await writeReferralAuditIfMissing({
      user: input.user,
      action: REFERRAL_AUDIT_ACTIONS.ready,
      targetId: `${input.projection.referralState.referralLevel}:ready`,
      projection: input.projection,
    });
  }

  if (input.projection.referralState.referralCount > 0) {
    await writeReferralAuditIfMissing({
      user: input.user,
      action: REFERRAL_AUDIT_ACTIONS.invited,
      targetId: `${input.projection.referralState.referralCount}:invites`,
      projection: input.projection,
    });
  }

  if (input.projection.signals.activatedReferrals > 0) {
    await writeReferralAuditIfMissing({
      user: input.user,
      action: REFERRAL_AUDIT_ACTIONS.activated,
      targetId: `${input.projection.signals.activatedReferrals}:activated`,
      projection: input.projection,
    });
  }

  if (input.projection.referralState.successfulReferrals > 0) {
    await writeReferralAuditIfMissing({
      user: input.user,
      action: REFERRAL_AUDIT_ACTIONS.successful,
      targetId: `${input.projection.referralState.successfulReferrals}:successful`,
      projection: input.projection,
    });
  }

  await writeReferralAuditIfMissing({
    user: input.user,
    action: REFERRAL_AUDIT_ACTIONS.levelChanged,
    targetId: `${input.projection.referralState.referralLevel}:level`,
    projection: input.projection,
  });
}

export const referralEngine = {
  getProjection: getReferralProjection,
  ensureAudit: ensureReferralAudit,
};
