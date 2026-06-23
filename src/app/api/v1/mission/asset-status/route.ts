import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { missionAgentAssistanceService } from '@/modules/mission-workspace/services/MissionAgentAssistanceService';

const AssetStatusSchema = z.object({
  missionId: z.string().min(1).max(120),
  assetId: z.string().min(1).max(200),
  status: z.enum(['READY', 'APPROVED', 'ARCHIVED']),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const input = AssetStatusSchema.parse(await request.json());
  const data = await missionAgentAssistanceService.updateGeneratedAssetStatus({
    user,
    missionId: input.missionId,
    assetId: input.assetId,
    status: input.status,
  });

  return NextResponse.json({ data });
});
