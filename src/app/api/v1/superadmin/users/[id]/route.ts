import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { adminService } from '@/modules/admin/services/admin-service';
import { writePlatformAudit } from '@/modules/admin/services/platform-audit-service';

const Body = z.object({ role: z.enum(['member','leader','operator','platform_admin']).optional(), status: z.enum(['active','pending','suspended']).optional() });
const target = async (context: { params?: Promise<Record<string,string>> | Record<string,string> } | undefined) => (await Promise.resolve(context?.params ?? {})).id;

async function auditFailure(userId: string, id: string, action: string, error: unknown) {
  await writePlatformAudit({ actorId: userId, actorRole: 'platform_admin', action, targetType: 'user', targetId: id, targetKey: id, outcome: 'failure', metadata: { failure_code: error instanceof Error ? error.name : 'UNKNOWN' } });
}

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']);
  const id = await target(context);
  try {
    const data = await adminService.updateUser(user.id, user.tenantId, id, Body.parse(await request.json()));
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'user.update', targetType: 'user', targetId: id, targetKey: id, outcome: 'success', metadata: { target_tenant_id: data.tenantId } });
    return NextResponse.json({ data });
  } catch (error) { await auditFailure(user.id, id, 'user.update', error); throw error; }
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']);
  const id = await target(context);
  try {
    const data = await adminService.deleteUser(user.id, id);
    await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'user.delete', targetType: 'user', targetId: id, targetKey: id, outcome: 'success', metadata: { target_tenant_id: data.tenantId } });
    return NextResponse.json({ data });
  } catch (error) { await auditFailure(user.id, id, 'user.delete', error); throw error; }
});
