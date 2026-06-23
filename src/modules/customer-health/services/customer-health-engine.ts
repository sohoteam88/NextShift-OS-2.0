import { Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import type { AuthUser } from '@/modules/auth/services/auth-service';
import { activationEngine } from '@/modules/activation/services/activation-engine';
import { userSuccessEngine } from '@/modules/user-success/services/user-success-engine';
import { retentionEngine } from '@/modules/retention/services/retention-engine';
import { expansionEngine } from '@/modules/expansion/services/expansion-engine';
import { referralEngine } from '@/modules/referral/services/referral-engine';
import type { CustomerHealthProjection } from '../contracts/CustomerHealthProjection';
import { buildCustomerHealthProjection } from './customer-health-projection';

export const CUSTOMER_HEALTH_AUDIT_ACTIONS = {
  levelChanged: 'health.level.changed',
  riskDetected: 'health.risk.detected',
  interventionGenerated: 'health.intervention.generated',
  recovered: 'health.recovered',
  thriving: 'health.thriving',
} as const;

async function previousHealthScore(input: { tenantId: string; userId: string }) {
  const previous = await prisma.auditLog.findFirst({
    where: {
      tenantId: input.tenantId,
      actorId: input.userId,
      action: CUSTOMER_HEALTH_AUDIT_ACTIONS.levelChanged,
      targetType: 'customer_health',
    },
    select: { metadata: true },
    orderBy: { createdAt: 'desc' },
  });
  const metadata = previous?.metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return null;
  const score = (metadata as Record<string, unknown>).healthScore;
  return typeof score === 'number' && Number.isFinite(score) ? score : null;
}

export async function getCustomerHealthProjection(userId: string, tenantId?: string): Promise<CustomerHealthProjection> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, tenantId: true, languagePreference: true },
  });

  if (!user) throw new Error('User not found');

  const resolvedTenantId = tenantId ?? user.tenantId;
  const [
    activationProjection,
    userSuccessProjection,
    retentionProjection,
    expansionProjection,
    referralProjection,
    previousScore,
  ] = await Promise.all([
    activationEngine.getProjection(user.id, resolvedTenantId),
    userSuccessEngine.getProjection(user.id, resolvedTenantId),
    retentionEngine.getProjection(user.id, resolvedTenantId),
    expansionEngine.getProjection(user.id, resolvedTenantId),
    referralEngine.getProjection(user.id, resolvedTenantId),
    previousHealthScore({ tenantId: resolvedTenantId, userId: user.id }),
  ]);

  return buildCustomerHealthProjection({
    generatedAt: new Date().toISOString(),
    activationProjection,
    userSuccessProjection,
    retentionProjection,
    expansionProjection,
    referralProjection,
    previousHealthScore: previousScore,
    locale: user.languagePreference,
    personalization: {
      businessModel: expansionProjection.personalization.businessModel,
      stage: expansionProjection.expansionState.currentExpansionStage,
    },
  });
}

async function writeHealthAuditIfMissing(input: {
  user: AuthUser;
  action: string;
  targetId: string;
  projection: CustomerHealthProjection;
}) {
  const existing = await prisma.auditLog.findFirst({
    where: {
      tenantId: input.user.tenantId,
      actorId: input.user.id,
      action: input.action,
      targetType: 'customer_health',
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
      targetType: 'customer_health',
      targetId: input.targetId,
      metadata: {
        healthLevel: input.projection.customerHealth.healthLevel,
        healthScore: input.projection.customerHealth.healthScore,
        interventionRequired: input.projection.customerHealth.interventionRequired,
        trend: input.projection.healthTrend.direction,
        recommendedAction: input.projection.recommendedAction.action,
        riskFactors: input.projection.customerHealth.riskFactors.map((risk) => risk.type),
        healthDrivers: input.projection.customerHealth.healthDrivers.map((driver) => driver.type),
        locale: input.projection.localization.locale,
        translationSource: input.projection.localization.translationSource,
        fallbackUsed: input.projection.localization.fallbackUsed,
        messageKeys: input.projection.localization.messageKeys,
        timestamp: new Date().toISOString(),
      } as Prisma.InputJsonValue,
    },
  });
}

export async function ensureCustomerHealthAudit(input: {
  user: AuthUser;
  projection: CustomerHealthProjection;
}) {
  await writeHealthAuditIfMissing({
    user: input.user,
    action: CUSTOMER_HEALTH_AUDIT_ACTIONS.levelChanged,
    targetId: `${input.projection.customerHealth.healthLevel}:${input.projection.customerHealth.healthScore}`,
    projection: input.projection,
  });

  if (input.projection.customerHealth.riskFactors.length > 0) {
    await writeHealthAuditIfMissing({
      user: input.user,
      action: CUSTOMER_HEALTH_AUDIT_ACTIONS.riskDetected,
      targetId: input.projection.customerHealth.riskFactors[0].type,
      projection: input.projection,
    });
  }

  if (input.projection.customerHealth.interventionRequired) {
    await writeHealthAuditIfMissing({
      user: input.user,
      action: CUSTOMER_HEALTH_AUDIT_ACTIONS.interventionGenerated,
      targetId: input.projection.recommendedAction.action,
      projection: input.projection,
    });
  }

  if (input.projection.customerHealth.healthLevel === 'STABLE' && input.projection.healthTrend.direction === 'UP') {
    await writeHealthAuditIfMissing({
      user: input.user,
      action: CUSTOMER_HEALTH_AUDIT_ACTIONS.recovered,
      targetId: 'stable_up',
      projection: input.projection,
    });
  }

  if (input.projection.customerHealth.healthLevel === 'THRIVING') {
    await writeHealthAuditIfMissing({
      user: input.user,
      action: CUSTOMER_HEALTH_AUDIT_ACTIONS.thriving,
      targetId: 'thriving',
      projection: input.projection,
    });
  }
}

export const customerHealthEngine = {
  getProjection: getCustomerHealthProjection,
  ensureAudit: ensureCustomerHealthAudit,
};
