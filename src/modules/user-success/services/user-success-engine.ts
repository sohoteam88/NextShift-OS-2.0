import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { missionEngineAuthorityService } from '@/modules/mission-engine/services/MissionEngineAuthorityService';
import { outcomeOrchestrator } from '@/modules/mission-engine/services/OutcomeOrchestrator';
import { valueRealizationEngine } from '@/modules/value/services/value-realization-engine';
import { retentionEngine } from '@/modules/retention/services/retention-engine';
import type { UserSuccessProjection } from '../contracts/UserSuccessProjection';
import { buildUserSuccessProjection } from './user-success-projection';

export const USER_SUCCESS_AUDIT_ACTIONS = {
  progressed: 'success.progressed',
  blocked: 'success.blocked',
  recovered: 'success.recovered',
  completed: 'success.completed',
} as const;

function daysBetween(start: Date, end: Date) {
  return Math.max(0, Math.floor((end.getTime() - start.getTime()) / 86_400_000));
}

async function writeSuccessAuditIfMissing(input: {
  user: AuthUser;
  action: string;
  targetId: string;
  projection: UserSuccessProjection;
}) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      tenantId: input.user.tenantId,
      actorId: input.user.id,
      action: input.action,
      targetType: 'user_success',
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
      targetType: 'user_success',
      targetId: input.targetId,
      metadata: {
        outcome: input.projection.successState.currentOutcome,
        successLevel: input.projection.successState.successLevel,
        progress: input.projection.successState.progressPercentage,
        successful: input.projection.successState.successful,
        blockedReason: input.projection.successState.blockedReason,
        locale: input.projection.localization.locale,
        translationSource: input.projection.localization.translationSource,
        fallbackUsed: input.projection.localization.fallbackUsed,
        messageKeys: input.projection.localization.messageKeys,
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

export async function getUserSuccessProjection(userId: string, tenantId?: string): Promise<UserSuccessProjection> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      tenantId: true,
      createdAt: true,
      languagePreference: true,
    },
  });

  if (!user) throw new Error('User not found');

  const resolvedTenantId = tenantId ?? user.tenantId;
  const [missionAuthority, valueProjection, retentionProjection] = await Promise.all([
    missionEngineAuthorityService.getCurrentMission(user.id),
    valueRealizationEngine.getProjection(user.id, resolvedTenantId),
    retentionEngine.getProjection(user.id, resolvedTenantId),
  ]);
  const outcome = outcomeOrchestrator.createPlan({
    currentMissionType: missionAuthority.missionPlan.missionType,
    sourceAvailable: missionAuthority.missionCompletion.verificationSource === 'signal',
    signals: {
      leadCount: valueProjection.outcomeMetrics.leadsGenerated,
      customerCount: valueProjection.outcomeMetrics.customersAcquired,
      revenue: valueProjection.outcomeMetrics.revenueGenerated,
      retentionRate: retentionProjection.signals.executionConsistency.value,
      publishedContentCount: valueProjection.outcomeMetrics.contentPublished,
      sopCount: retentionProjection.momentum.missionsCompleted,
      activeAgentCount: retentionProjection.signals.aiCooInteractionFrequency.value,
    },
  });
  const generatedAt = new Date().toISOString();

  return buildUserSuccessProjection({
    outcome,
    valueProjection,
    retentionProjection,
    daysSinceActivation: daysBetween(user.createdAt, new Date(generatedAt)),
    generatedAt,
    locale: { userPreference: user.languagePreference },
  });
}

export async function ensureUserSuccessAudit(input: {
  user: AuthUser;
  projection: UserSuccessProjection;
}) {
  if (input.projection.successState.successful) {
    await writeSuccessAuditIfMissing({
      user: input.user,
      action: USER_SUCCESS_AUDIT_ACTIONS.completed,
      targetId: `${input.projection.successState.currentOutcome}:completed`,
      projection: input.projection,
    });
    return;
  }

  if (input.projection.successState.successLevel === 'BLOCKED') {
    await writeSuccessAuditIfMissing({
      user: input.user,
      action: USER_SUCCESS_AUDIT_ACTIONS.blocked,
      targetId: `${input.projection.successState.currentOutcome}:${input.projection.successState.blockedReason ?? 'blocked'}`,
      projection: input.projection,
    });
  }

  if (input.projection.recoveryActions.length > 0) {
    await writeSuccessAuditIfMissing({
      user: input.user,
      action: USER_SUCCESS_AUDIT_ACTIONS.recovered,
      targetId: `${input.projection.successState.currentOutcome}:recovery`,
      projection: input.projection,
    });
  }

  if (input.projection.successState.progressPercentage > 0) {
    await writeSuccessAuditIfMissing({
      user: input.user,
      action: USER_SUCCESS_AUDIT_ACTIONS.progressed,
      targetId: `${input.projection.successState.currentOutcome}:${input.projection.successState.progressPercentage}`,
      projection: input.projection,
    });
  }
}

export const userSuccessEngine = {
  getProjection: getUserSuccessProjection,
  ensureAudit: ensureUserSuccessAudit,
};
