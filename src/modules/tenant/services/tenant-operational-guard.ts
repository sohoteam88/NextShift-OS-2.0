import type { PrismaClient } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';

type TenantStatusDatabase = Pick<PrismaClient, 'tenant'>;
export type TenantOperationalPhase = 'request' | 'claim' | 'pre_side_effect' | 'webhook';

/** Reads the live Tenant row; token claims are never the status authority. */
export async function assertTenantOperational(
  tenantId: string,
  phase: TenantOperationalPhase,
  db: TenantStatusDatabase = prisma,
): Promise<void> {
  const tenant = await db.tenant.findUnique({ where: { id: tenantId }, select: { status: true } });
  if (!tenant) throw new AppError('TENANT_NOT_FOUND', 404, 'Tenant not found', { tenantId, phase });
  if (tenant.status === 'deleted') {
    throw new AppError('TENANT_DELETED', 403, 'Deleted tenant side effects are suppressed', {
      tenantId,
      phase,
      suppressionReason: 'TENANT_DELETED_TERMINAL',
    });
  }
}

export async function tenantOperationalState(
  tenantId: string,
  phase: TenantOperationalPhase,
  db: TenantStatusDatabase = prisma,
): Promise<{ operational: true } | { operational: false; reason: 'TENANT_DELETED_TERMINAL' }> {
  try {
    await assertTenantOperational(tenantId, phase, db);
    return { operational: true };
  } catch (error) {
    if (error instanceof AppError && error.code === 'TENANT_DELETED') {
      return { operational: false, reason: 'TENANT_DELETED_TERMINAL' };
    }
    throw error;
  }
}
