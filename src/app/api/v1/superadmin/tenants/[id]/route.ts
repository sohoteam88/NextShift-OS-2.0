import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';
import { deleteTenantWithAudit } from '@/modules/admin/services/tenant-deletion-service';
import { updatePlatformTenantWithAudit } from '@/modules/admin/services/platform-mutation-service';
import { resolvePlatformCorrelationId } from '@/modules/admin/services/platform-request-authority';

const UpdateSchema = z.object({ name: z.string().min(1).max(120).optional(), slug: z.string().min(1).max(120).optional(), plan: z.enum(['starter', 'growth', 'pro']).optional(), status: z.enum(['active', 'suspended']).optional(), maxMembers: z.coerce.number().int().positive().optional(), maxAiCalls: z.coerce.number().int().positive().optional() });
const idOf = async (context: { params?: Promise<Record<string, string>> | Record<string, string> } | undefined) => (await Promise.resolve(context?.params ?? {})).id;
const authorize = async (request: NextRequest) => { const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']); return user; };

export const GET = apiHandler(async (request, context) => { await authorize(request); return NextResponse.json({ data: await platformAdminService.getTenantDetail(await idOf(context)) }); });
export const PATCH = apiHandler(async (request, context) => {
  const user = await authorize(request); const id = await idOf(context); const input = UpdateSchema.parse(await request.json());
  const data = await updatePlatformTenantWithAudit(user.id, id, resolvePlatformCorrelationId(request), input);
  return NextResponse.json({ data });
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
    correlationId: resolvePlatformCorrelationId(request),
  });
  return NextResponse.json({ data: result, correlationId: result.correlationId });
});
