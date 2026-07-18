import { createHash, randomUUID } from 'crypto';
import { type PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import {
  buildPlatformAuditEvent,
  writePlatformAuditInTransaction,
  writePlatformAuditUsing,
} from './platform-audit-service';

export type DeleteTenantCommand = {
  tenantId: string;
  actorId: string;
  idempotencyKey?: string;
  correlationId?: string;
};

export type DeleteTenantResult = {
  id: string;
  status: 'deleted';
  alreadyDeleted: boolean;
  replayed: boolean;
  correlationId: string;
};

type TenantDeletionSnapshot = {
  tenantId: string;
  tenantLabelSha256: string | null;
  priorStatus: string | null;
};

function sha256(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

function deletionMetadata(
  snapshot: TenantDeletionSnapshot,
  correlationId: string,
  outcome: 'success' | 'failure',
  failureCode: string | null = null,
) {
  return {
    tenant_id: snapshot.tenantId,
    tenant_label_sha256: snapshot.tenantLabelSha256,
    prior_status: snapshot.priorStatus,
    correlation_id: correlationId,
    actor_role: 'platform_admin',
    outcome,
    failure_code: failureCode,
  };
}

export async function deleteTenantWithAudit(
  command: DeleteTenantCommand,
  db: PrismaClient = prisma,
): Promise<DeleteTenantResult> {
  const retryIdentity = command.idempotencyKey ?? randomUUID();
  const correlationId = command.correlationId ?? retryIdentity;
  let snapshot: TenantDeletionSnapshot = {
    tenantId: command.tenantId,
    tenantLabelSha256: null,
    priorStatus: null,
  };
  const transitionedInput = () => ({
    actorId: command.actorId,
    actorRole: 'platform_admin' as const,
    action: 'tenant.delete',
    targetType: 'tenant',
    targetId: command.tenantId,
    targetKey: command.tenantId,
    outcome: 'success' as const,
    correlationId,
    idempotencyIdentity: retryIdentity,
    metadataProfile: 'tenant_deletion_snapshot' as const,
    metadata: deletionMetadata(snapshot, correlationId, 'success'),
  });

  try {
    return await db.$transaction(async (tx) => {
      const tenants = await tx.$queryRaw<Array<{ id: string; name: string; status: string }>>`
        SELECT "id", "name", "status" FROM "tenants"
        WHERE "id" = ${command.tenantId}::uuid
        FOR UPDATE
      `;
      const tenant = tenants[0];
      if (!tenant) throw new AppError('NOT_FOUND', 404, 'Tenant not found');
      snapshot = {
        tenantId: tenant.id,
        tenantLabelSha256: sha256(tenant.name),
        priorStatus: tenant.status,
      };

      if (tenant.status === 'deleted') {
        if (command.idempotencyKey) {
          const expected = buildPlatformAuditEvent(transitionedInput());
          const prior = await tx.auditLog.findFirst({
            where: {
              scope: 'PLATFORM',
              action: 'tenant.delete',
              targetId: command.tenantId,
              idempotencyKey: expected.idempotencyKey,
            },
            select: { id: true },
          });
          if (prior) {
            return {
              id: command.tenantId,
              status: 'deleted' as const,
              alreadyDeleted: false,
              replayed: true,
              correlationId,
            };
          }
        }
        await writePlatformAuditInTransaction(tx, {
          ...transitionedInput(),
          action: 'tenant.delete.noop',
          metadata: deletionMetadata(snapshot, correlationId, 'success'),
        });
        return {
          id: command.tenantId,
          status: 'deleted' as const,
          alreadyDeleted: true,
          replayed: false,
          correlationId,
        };
      }

      await tx.tenant.update({
        where: { id: command.tenantId },
        data: { status: 'deleted', updatedAt: new Date() },
      });
      await writePlatformAuditInTransaction(tx, transitionedInput());
      return {
        id: command.tenantId,
        status: 'deleted' as const,
        alreadyDeleted: false,
        replayed: false,
        correlationId,
      };
    }, { isolationLevel: 'ReadCommitted' });
  } catch (error) {
    const code = error instanceof AppError ? error.code : 'TENANT_DELETE_TRANSACTION_FAILED';
    await writePlatformAuditUsing(db, {
      actorId: command.actorId,
      actorRole: 'platform_admin',
      action: 'tenant.delete',
      targetType: 'tenant',
      targetId: command.tenantId,
      targetKey: command.tenantId,
      outcome: 'failure',
      correlationId,
      idempotencyIdentity: `${retryIdentity}:failure`,
      metadataProfile: 'tenant_deletion_snapshot',
      metadata: deletionMetadata(snapshot, correlationId, 'failure', code),
    });
    throw error;
  }
}
