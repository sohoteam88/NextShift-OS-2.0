import prisma from '@/lib/prisma';
import { runAuditBestEffort, writeAuditIfMissing } from '@/lib/audit-log-writer';
import type { ActivationProjection } from '../contracts/ActivationProjection';
import { buildActivationProjection } from './activation-projection';
import type { AuthUser } from '@/modules/auth/services/auth-service';

export const ACTIVATION_AUDIT_ACTIONS = {
  stepCompleted: 'activation.step.completed',
  stateChanged: 'activation.state.changed',
  atRisk: 'activation.at_risk',
  dropoff: 'activation.dropoff',
  stalled: 'activation.stalled',
  recovered: 'activation.recovered',
  completed: 'activation.completed',
} as const;

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
      languagePreference: true,
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
    firstMissionStarted,
    firstAssetGenerated,
    firstAssetReviewed,
    firstOutcomeCompleted,
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
    prisma.auditLog.findFirst({
      where: {
        tenantId: resolvedTenantId,
        actorId: user.id,
        action: { in: ['mission_agent.invoked', 'mission.started', 'mission.workspace.started'] },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.auditLog.findFirst({
      where: {
        tenantId: resolvedTenantId,
        actorId: user.id,
        action: { in: ['agent.asset.generated', 'mission_agent.asset_generated'] },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.auditLog.findFirst({
      where: {
        tenantId: resolvedTenantId,
        actorId: user.id,
        action: { in: ['agent.asset.approved', 'agent.asset.updated'] },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
    prisma.auditLog.findFirst({
      where: {
        tenantId: resolvedTenantId,
        actorId: user.id,
        action: { in: ['outcome.completed', 'activation.completed'] },
      },
      orderBy: { createdAt: 'asc' },
      select: { createdAt: true },
    }),
  ]);

  const leadMagnetFromMetadata = dateFromMetadata(metadata.lead_magnet);
  const landingPagePublishedAt = publishedLandingPage?.publishedAt ?? publishedLandingPage?.createdAt ?? null;

  return buildActivationProjection(
    {
      userCreatedAt: user.createdAt,
      interviewStartedAt: firstInterview?.createdAt ?? null,
      interviewCompletedAt: completedInterview?.updatedAt ?? null,
      brandDnaGeneratedAt: brandProfile?.updatedAt ?? brandProfile?.createdAt ?? null,
      firstContentGeneratedAt: firstContent?.createdAt ?? null,
      firstLeadCapturedAt: firstLead?.createdAt ?? null,
      leadMagnetGeneratedAt: leadMagnetFromMetadata ?? landingPagePublishedAt,
      landingPagePublishedAt,
      firstMissionStartedAt: firstMissionStarted?.createdAt ?? null,
      firstAssetGeneratedAt: firstAssetGenerated?.createdAt
        ?? firstContent?.createdAt
        ?? leadMagnetFromMetadata
        ?? landingPagePublishedAt,
      firstAssetReviewedAt: firstAssetReviewed?.createdAt ?? null,
      firstOutcomeVerifiedAt: firstOutcomeCompleted?.createdAt ?? null,
      lastActivityAt: user.updatedAt,
      generatedAt: new Date().toISOString(),
    },
    { userPreference: user.languagePreference },
  );
}

async function writeActivationAuditIfMissing(input: {
  user: AuthUser;
  action: string;
  targetKey: string;
  metadata: Record<string, unknown>;
}) {
  await writeAuditIfMissing({
    tenantId: input.user.tenantId,
    actorId: input.user.id,
    action: input.action,
    targetType: 'activation',
    targetId: null,
    targetKey: input.targetKey,
    metadata: input.metadata,
  });
}

async function writeActivationAuditWithDailyThrottle(input: {
  user: AuthUser;
  action: string;
  targetKey: string;
  metadata: Record<string, unknown>;
}) {
  await writeAuditIfMissing({
    tenantId: input.user.tenantId,
    actorId: input.user.id,
    action: input.action,
    targetType: 'activation',
    targetId: null,
    targetKey: input.targetKey,
    metadata: input.metadata,
    createdAtSince: new Date(Date.now() - 24 * 3_600_000),
  });
}

export async function ensureActivationAudit(input: {
  user: AuthUser;
  projection: ActivationProjection;
}) {
  await runAuditBestEffort({
    operation: 'ensureActivationAudit',
    tenantId: input.user.tenantId,
    actorId: input.user.id,
  }, async () => {
    await Promise.all(input.projection.activationFunnel
      .filter((step) => step.status === 'completed')
      .map((step) => writeActivationAuditIfMissing({
        user: input.user,
        action: ACTIVATION_AUDIT_ACTIONS.stepCompleted,
        targetKey: step.id,
        metadata: {
          step: step.id,
          completedAt: step.completedAt,
          completionPercentage: input.projection.activationState.completionPercentage,
          locale: input.projection.localization.locale,
          translationSource: input.projection.localization.translationSource,
          fallbackUsed: input.projection.localization.fallbackUsed,
          messageKeys: input.projection.localization.messageKeys,
        },
      })));

    if (input.projection.dropOffStage !== 'none') {
      await writeActivationAuditWithDailyThrottle({
        user: input.user,
        action: ACTIVATION_AUDIT_ACTIONS.dropoff,
        targetKey: input.projection.activationState.currentStep,
        metadata: {
          step: input.projection.activationState.currentStep,
          state: input.projection.activationState.state,
          blockedReason: input.projection.activationState.blockedReason,
          hoursSinceActivity: input.projection.dropOffRisk.hoursSinceActivity,
          interventions: input.projection.interventions,
          locale: input.projection.localization.locale,
          translationSource: input.projection.localization.translationSource,
          fallbackUsed: input.projection.localization.fallbackUsed,
          messageKey: input.projection.interventions[0]?.messageKey ?? input.projection.localization.messageKeys[0],
        },
      });
    }

    if (input.projection.dropOffRisk.state === 'AT_RISK') {
      await writeActivationAuditWithDailyThrottle({
        user: input.user,
        action: ACTIVATION_AUDIT_ACTIONS.atRisk,
        targetKey: input.projection.activationState.currentStep,
        metadata: {
          step: input.projection.activationState.currentStep,
          state: input.projection.activationState.state,
          hoursSinceActivity: input.projection.dropOffRisk.hoursSinceActivity,
          hoursRemaining: input.projection.dropOffRisk.hoursRemaining,
          interventions: input.projection.interventions,
          locale: input.projection.localization.locale,
          translationSource: input.projection.localization.translationSource,
          fallbackUsed: input.projection.localization.fallbackUsed,
          messageKey: input.projection.interventions[0]?.messageKey ?? input.projection.localization.messageKeys[0],
        },
      });
    }

    if (input.projection.dropOffRisk.state !== 'ON_TRACK') {
      await writeActivationAuditWithDailyThrottle({
        user: input.user,
        action: ACTIVATION_AUDIT_ACTIONS.stateChanged,
        targetKey: `${input.projection.activationState.currentStep}:${input.projection.activationState.state}`,
        metadata: {
          step: input.projection.activationState.currentStep,
          state: input.projection.activationState.state,
          hoursSinceActivity: input.projection.dropOffRisk.hoursSinceActivity,
          locale: input.projection.localization.locale,
          translationSource: input.projection.localization.translationSource,
          fallbackUsed: input.projection.localization.fallbackUsed,
          messageKeys: input.projection.localization.messageKeys,
        },
      });
    }

    if (input.projection.activationState.activated) {
      await writeActivationAuditIfMissing({
        user: input.user,
        action: ACTIVATION_AUDIT_ACTIONS.completed,
        targetKey: 'ACTIVATED',
        metadata: {
          step: 'ACTIVATED',
          firstValue: input.projection.firstValue,
          timeToFirstWinMinutes: input.projection.firstWin.timeToFirstWinMinutes,
          locale: input.projection.localization.locale,
          translationSource: input.projection.localization.translationSource,
          fallbackUsed: input.projection.localization.fallbackUsed,
          messageKeys: input.projection.localization.messageKeys,
        },
      });
    }
  });
}

export const activationEngine = {
  getProjection: getActivationProjection,
  ensureAudit: ensureActivationAudit,
};
