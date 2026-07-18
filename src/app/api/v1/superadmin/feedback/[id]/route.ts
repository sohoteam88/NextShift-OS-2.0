import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { writePlatformAudit, writePlatformAuditInTransaction } from '@/modules/admin/services/platform-audit-service';

const Body = z.object({ status: z.enum(['open', 'acknowledged', 'in_progress', 'resolved', 'closed']) });

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['platform_admin']);
  const { id } = await Promise.resolve(context?.params ?? {});
  const { status } = Body.parse(await request.json());
  try {
    const data = await prisma.$transaction(async (tx) => {
      const current = await tx.feedback.findUnique({ where: { id }, select: { id: true, tenantId: true, status: true } });
      if (!current) throw new AppError('NOT_FOUND', 404, 'Feedback not found');
      const updated = await tx.feedback.update({ where: { id }, data: { status, updatedAt: new Date() } });
      await writePlatformAuditInTransaction(tx, { actorId: user.id, actorRole: 'platform_admin', action: 'feedback.update', targetType: 'feedback', targetId: id, targetKey: id, outcome: 'success', metadata: { target_tenant_id: current.tenantId, from_status: current.status, to_status: status } });
      return updated;
    });
    return NextResponse.json({ data });
  } catch (error) {
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'feedback.update', targetType: 'feedback', targetId: id, targetKey: id, outcome: 'failure', metadata: { failure_code: error instanceof Error ? error.name : 'UNKNOWN' } });
    throw error;
  }
});
