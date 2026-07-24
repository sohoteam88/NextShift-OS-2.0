import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { operationRateLimitGuard } from '@/lib/operation-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelBuilderService } from '@/modules/funnel/services/funnel-builder-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import { resolveRequestWorkspaceContext } from '@/modules/workspace/request-workspace-context';
import { assertTenantOperational } from '@/modules/tenant/services/tenant-operational-guard';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await assertTenantOperational(user.tenantId, 'claim');
  await operationRateLimitGuard(user.id, 'funnel-publish');
  let body: unknown;
  try { body = await request.json(); } catch { body = {}; }
  const { track } = z.object({
    track: z.enum(['retail', 'recruitment']).default('retail'),
    workspaceId: z.string().optional(),
  }).parse(body);
  const workspaceContext = await resolveRequestWorkspaceContext({
    user,
    request,
    body,
    legacyWorkspaceType: track,
  });
  await assertTenantOperational(user.tenantId, 'pre_side_effect');
  const data = await funnelBuilderService.publishLandingPage(user, track, workspaceContext);
  const mission = await notifyMissionProgress(user, 'funnel_published');
  return NextResponse.json({ data, mission });
});
