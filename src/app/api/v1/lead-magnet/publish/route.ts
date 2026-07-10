import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { leadMagnetService } from '@/modules/lead-magnet/leadMagnetService';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';
import { resolveRequestWorkspaceContext } from '@/modules/workspace/request-workspace-context';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const workspaceContext = await resolveRequestWorkspaceContext({ user, request });
  const data = await leadMagnetService.publish(user, workspaceContext);
  await notifyMissionProgress(user, 'lead_magnet_created');
  return NextResponse.json({ data });
});
