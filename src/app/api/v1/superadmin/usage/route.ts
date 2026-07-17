import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { writePlatformAudit } from '@/modules/admin/services/platform-audit-service';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request); requireRoleApi(user, ['platform_admin']);
  const body = await request.json();
  await writePlatformAudit({ actorId: user.id, actorRole: 'platform_admin', action: 'platform.usage.record', targetType: 'usage', targetKey: 'platform', outcome: 'success', metadata: { event_type: typeof body?.eventType === 'string' ? body.eventType : 'unknown' } });
  return NextResponse.json({ data: { accepted: true } });
});
