import { Prisma, type PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { writePlatformAuditInTransaction, writePlatformAuditUsing } from './platform-audit-service';
import { loadPlatformUserTarget } from './platform-mutation-service';

type ResetDatabase = PrismaClient;

export type UserDataResetReceipt = {
  perTableCounts: Record<string, number>;
  metadataKeysCleared: string[];
};

function failureCode(error: unknown): string {
  return error instanceof AppError ? error.code : error instanceof Error ? error.name : 'UNKNOWN';
}

function removeBrandDnaMetadata(metadata: Prisma.JsonValue): {
  metadata: Prisma.InputJsonValue;
  clearedKeys: string[];
} {
  const current = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
    ? metadata as Record<string, unknown>
    : {};
  const clearedKeys = Object.keys(current).filter(
    (key) => key === 'brand_profile' || key === 'brand_builder_state' || key.startsWith('brand_dna'),
  );
  const next = { ...current };
  for (const key of clearedKeys) delete next[key];
  return { metadata: next as Prisma.InputJsonValue, clearedKeys };
}

/**
 * Resets business data while retaining the user's identity, authentication,
 * tenant membership, role, and platform audit history.
 */
export async function resetUserBusinessDataWithAudit(
  actorId: string,
  targetUserId: string,
  confirmedEmail: string,
  correlationId: string,
  db: ResetDatabase = prisma,
): Promise<UserDataResetReceipt> {
  let targetTenantId: string | null = null;

  try {
    return await db.$transaction(async (tx) => {
      const target = await loadPlatformUserTarget(tx, actorId, targetUserId);
      targetTenantId = target.tenantId;
      if (target.email.trim().toLowerCase() !== confirmedEmail.trim().toLowerCase()) {
        throw new AppError('VALIDATION_ERROR', 400, 'Confirmation email does not match the target user');
      }

      // Every predicate is bound to the target user (or a parent owned by that
      // user). This deliberately never treats a tenant as a reset boundary.
      const perTableCounts = {
        leadTag: (await tx.leadTag.deleteMany({ where: { lead: { ownerId: targetUserId } } })).count,
        scheduledMessage: (await tx.scheduledMessage.deleteMany({
          where: { OR: [{ userId: targetUserId }, { lead: { ownerId: targetUserId } }] },
        })).count,
        note: (await tx.note.deleteMany({
          where: { OR: [{ userId: targetUserId }, { lead: { ownerId: targetUserId } }] },
        })).count,
        activity: (await tx.activity.deleteMany({
          where: { OR: [{ userId: targetUserId }, { lead: { ownerId: targetUserId } }] },
        })).count,
        analyticsEvent: (await tx.analyticsEvent.deleteMany({
          where: {
            OR: [
              { userId: targetUserId },
              { lead: { ownerId: targetUserId } },
              { funnel: { ownerId: targetUserId } },
            ],
          },
        })).count,
        customer: (await tx.customer.deleteMany({ where: { ownerId: targetUserId } })).count,
        lead: (await tx.lead.deleteMany({ where: { ownerId: targetUserId } })).count,
        funnel: (await tx.funnel.deleteMany({ where: { ownerId: targetUserId } })).count,
        content: (await tx.content.deleteMany({ where: { ownerId: targetUserId } })).count,
        userProgress: (await tx.userProgress.deleteMany({ where: { userId: targetUserId } })).count,
        mission: (await tx.mission.deleteMany({ where: { userId: targetUserId } })).count,
        achievement: (await tx.achievement.deleteMany({ where: { userId: targetUserId } })).count,
        brandProfile: (await tx.brandProfile.deleteMany({ where: { userId: targetUserId } })).count,
        aiUsageLog: (await tx.aIUsageLog.deleteMany({ where: { userId: targetUserId } })).count,
        dailyAction: (await tx.dailyAction.deleteMany({ where: { userId: targetUserId } })).count,
        trainingProgress: (await tx.trainingProgress.deleteMany({ where: { userId: targetUserId } })).count,
        voiceProfile: (await tx.voiceProfile.deleteMany({ where: { userId: targetUserId } })).count,
        brandInterview: (await tx.brandInterview.deleteMany({ where: { userId: targetUserId } })).count,
        postPerformance: (await tx.postPerformance.deleteMany({ where: { userId: targetUserId } })).count,
        contentCalendar: (await tx.contentCalendar.deleteMany({ where: { userId: targetUserId } })).count,
        videoProject: (await tx.videoProject.deleteMany({ where: { userId: targetUserId } })).count,
      };

      const targetMetadata = await tx.user.findUnique({
        where: { id: targetUserId },
        select: { metadata: true },
      });
      const { metadata, clearedKeys } = removeBrandDnaMetadata(targetMetadata?.metadata ?? {});
      await tx.user.update({
        where: { id: targetUserId },
        data: { metadata, updatedAt: new Date() },
      });

      await writePlatformAuditInTransaction(tx, {
        actorId,
        actorRole: 'platform_admin',
        action: 'user.data.reset',
        targetType: 'user',
        targetId: targetUserId,
        targetKey: targetUserId,
        outcome: 'success',
        correlationId,
        metadata: {
          target_tenant_id: target.tenantId,
          target_email: confirmedEmail,
          per_table_counts: perTableCounts,
          metadata_keys_cleared: clearedKeys,
        },
      });

      return { perTableCounts, metadataKeysCleared: clearedKeys };
    });
  } catch (error) {
    try {
      await writePlatformAuditUsing(db, {
        actorId,
        actorRole: 'platform_admin',
        action: 'user.data.reset',
        targetType: 'user',
        targetId: targetUserId,
        targetKey: targetUserId,
        outcome: 'failure',
        correlationId,
        metadata: {
          target_tenant_id: targetTenantId,
          failure_code: failureCode(error),
        },
      });
    } catch {
      // Failure auditing is best-effort and must never mask the original reset error.
    }
    throw error;
  }
}
