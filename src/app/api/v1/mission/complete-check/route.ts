import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { missionService } from '@/modules/mission/services/mission-service';
import { missionCheckRegistry } from '@/modules/mission-workspace/services/MissionCheckRegistry';

const CompleteCheckSchema = z.object({
  check_key: z.string().min(1).max(100),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = CompleteCheckSchema.parse(body);
  const validation = await missionCheckRegistry.validateWorkspaceCheck({
    user,
    checkKey: input.check_key,
  });
  const result = await missionService.completeCheck(user, input.check_key);
  await missionCheckRegistry.recordAcceptedWorkspaceCheck({ user, validation });
  return NextResponse.json({ data: result, mission: result });
});
