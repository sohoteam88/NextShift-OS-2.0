import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';
import { writePlatformAudit } from '@/modules/admin/services/platform-audit-service';
import { deleteTenantWithAudit } from '@/modules/admin/services/tenant-deletion-service';

const UpdateSchema = z.object({ name: z.string().min(1).max(120).optional(), slug: z.string().min(1).max(120).optional(), plan: z.enum(['starter', 'growth', 'pro']).optional(), status: z.string().trim().optional(), maxMembers: z.coerce.number().int().positive().optional(), maxAiCalls: z.coerce.number().int().positive().optional() });
const idOf = async (context: { params?: Promise<Record<string, string>> | Record<string, string> } | undefined) => (await Promise.resolve(context?.params ?? {})).id;
const authorize = async (request: NextRequest) => { const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']); return user; };

export const GET = apiHandler(async (request, context) => { await authorize(request); return NextResponse.json({ data: await platformAdminService.getTenantDetail(await idOf(context)) }); });
export const PATCH = apiHandler(async (request, context) => {
  const user = await authorize(request); const id = await idOf(context); const input = UpdateSchema.parse(await request.json());
  const current = await prisma.tenant.findUnique({ where: { id }, select: { status: true } });
  if (current?.status === 'deleted') throw new AppError('TENANT_DELETED_TERMINAL', 409, 'A deleted tenant cannot be restored');
  try { const data = await platformAdminService.updateTenant(id, input); await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'tenant.update', targetType: 'tenant', targetId: id, targetKey: id, outcome: 'success' }); return NextResponse.json({ data }); }
  catch (error) { await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'tenant.update', targetType: 'tenant', targetId: id, targetKey: id, outcome: 'failure', metadata: { failure_code: error instanceof Error ? error.name : 'UNKNOWN' } }); throw error; }
});
export const DELETE = apiHandler(async (request, context) => {
  const user = await authorize(request);
  const id = await idOf(context);
  const suppliedIdempotency = request.headers.get('idempotency-key')?.trim();
  if (suppliedIdempotency && !/^[A-Za-z0-9._:-]{8,128}$/.test(suppliedIdempotency)) {
    throw new AppError('VALIDATION_ERROR', 400, 'Invalid Idempotency-Key header');
  }
  const result = await deleteTenantWithAudit({
    tenantId: id,
    actorId: user.id,
    idempotencyKey: suppliedIdempotency,
    correlationId: request.headers.get('x-correlation-id')?.trim() || undefined,
  });
  return NextResponse.json({ data: result, correlationId: result.correlationId });
});
