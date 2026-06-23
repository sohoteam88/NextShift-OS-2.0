import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { missionExecutionWorkspaceService } from '@/modules/mission-workspace/services/MissionExecutionWorkspaceService';

async function getMissionId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  const params = await context?.params;
  return params?.missionId ?? '';
}

export const GET = apiHandler(async (
  request: NextRequest,
  context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined,
) => {
  const user = await requireAuthApi(request);
  const missionId = await getMissionId(context);
  const data = await missionExecutionWorkspaceService.getWorkspace(user, decodeURIComponent(missionId));

  return NextResponse.json({ data });
});
