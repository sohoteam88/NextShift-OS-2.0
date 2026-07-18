import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { writePlatformAudit, writePlatformAuditInTransaction } from '@/modules/admin/services/platform-audit-service';

const Body = z.object({
  targetTenantId: z.string().uuid(),
  currentUserId: z.string().uuid(),
  desiredAuthUserId: z.string().uuid(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const actor = await requireAuthApi(request);
  requireRoleApi(actor, ['platform_admin']);
  const body = Body.parse(await request.json());
  try {
    const data = await prisma.$transaction(async (tx) => {
      const target = await tx.user.findFirst({
        where: { id: body.currentUserId, tenantId: body.targetTenantId, deletedAt: null },
        select: { id: true, email: true, tenantId: true },
      });
      if (!target) throw new AppError('NOT_FOUND', 404, 'Target user not found in explicit tenant');
      const collision = await tx.user.findUnique({ where: { id: body.desiredAuthUserId }, select: { id: true } });
      if (collision && collision.id !== target.id) throw new AppError('CONFLICT', 409, 'Desired auth UID is already assigned');
      if (target.id !== body.desiredAuthUserId) {
        await tx.user.updateMany({ where: { sponsorId: target.id }, data: { sponsorId: body.desiredAuthUserId } });
        await tx.lead.updateMany({ where: { ownerId: target.id, tenantId: target.tenantId }, data: { ownerId: body.desiredAuthUserId } });
        await tx.activity.updateMany({ where: { userId: target.id, tenantId: target.tenantId }, data: { userId: body.desiredAuthUserId } });
        await tx.note.updateMany({ where: { userId: target.id }, data: { userId: body.desiredAuthUserId } });
        await tx.funnel.updateMany({ where: { ownerId: target.id, tenantId: target.tenantId }, data: { ownerId: body.desiredAuthUserId } });
        await tx.user.update({ where: { id: target.id }, data: { id: body.desiredAuthUserId } });
      }
      await writePlatformAuditInTransaction(tx, {
        actorId: actor.id, actorRole: 'platform_admin', action: 'auth.uid.reconcile',
        targetType: 'user', targetId: body.desiredAuthUserId,
        targetKey: `${body.currentUserId}->${body.desiredAuthUserId}`, outcome: 'success',
        metadata: { target_tenant_id: body.targetTenantId, already_reconciled: target.id === body.desiredAuthUserId },
      });
      return { userId: body.desiredAuthUserId, tenantId: body.targetTenantId, reconciled: target.id !== body.desiredAuthUserId };
    });
    return NextResponse.json({ data });
  } catch (error) {
    await writePlatformAudit({
      actorId: actor.id, actorRole: 'platform_admin', action: 'auth.uid.reconcile',
      targetType: 'user', targetId: body.desiredAuthUserId,
      targetKey: `${body.currentUserId}->${body.desiredAuthUserId}`, outcome: 'failure',
      metadata: { target_tenant_id: body.targetTenantId, failure_code: error instanceof Error ? error.name : 'UNKNOWN' },
    });
    throw error;
  }
});
