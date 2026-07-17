import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import prisma from '@/lib/prisma';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { platformAdminService } from '@/modules/admin/services/platform-admin-service';
import { writePlatformAudit } from '@/modules/admin/services/platform-audit-service';

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
  const user = await authorize(request); const id = await idOf(context);
  const result = await prisma.tenant.updateMany({ where: { id, status: { not: 'deleted' } }, data: { status: 'deleted', updatedAt: new Date() } });
  const outcome = result.count === 1 ? 'success' : 'failure';
  await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'tenant.delete', targetType: 'tenant', targetId: id, targetKey: id, outcome, metadata: outcome === 'failure' ? { failure_code: 'already_deleted' } : {} });
  return NextResponse.json({ data: { id, status: 'deleted', alreadyDeleted: result.count === 0 } });
});
