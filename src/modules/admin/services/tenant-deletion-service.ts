import { randomUUID } from 'crypto';
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

export async function deleteTenantWithAudit(
  command: DeleteTenantCommand,
  db: PrismaClient = prisma,
): Promise<DeleteTenantResult> {
  const retryIdentity = command.idempotencyKey ?? randomUUID();
  const correlationId = command.correlationId ?? retryIdentity;
  const transitionedInput = {
    actorId: command.actorId,
    actorRole: 'platform_admin' as const,
    action: 'tenant.delete',
    targetType: 'tenant',
    targetId: command.tenantId,
    targetKey: command.tenantId,
    outcome: 'success' as const,
    correlationId,
    idempotencyIdentity: retryIdentity,
    metadata: { classification: 'logical_delete_transition' },
  };

  try {
    return await db.$transaction(async (tx) => {
      const tenants = await tx.$queryRaw<Array<{ id: string; status: string }>>`
        SELECT "id", "status" FROM "tenants"
        WHERE "id" = ${command.tenantId}::uuid
        FOR UPDATE
      `;
      const tenant = tenants[0];
      if (!tenant) throw new AppError('NOT_FOUND', 404, 'Tenant not found');

      if (tenant.status === 'deleted') {
        if (command.idempotencyKey) {
          const expected = buildPlatformAuditEvent(transitionedInput);
          const prior = await tx.auditLog.findFirst({
            where: { idempotencyKey: expected.idempotencyKey, payloadDigest: expected.payloadDigest },
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
          ...transitionedInput,
          action: 'tenant.delete.noop',
          metadata: { classification: 'already_deleted_terminal_noop' },
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
      await writePlatformAuditInTransaction(tx, transitionedInput);
      return {
        id: command.tenantId,
        status: 'deleted' as const,
        alreadyDeleted: false,
        replayed: false,
        correlationId,
      };
    }, { isolationLevel: 'ReadCommitted' });
  } catch (error) {
    const code = error instanceof AppError ? error.code : error instanceof Error ? error.name : 'UNKNOWN';
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
      metadata: { failure_code: code },
    });
    throw error;
  }
}
