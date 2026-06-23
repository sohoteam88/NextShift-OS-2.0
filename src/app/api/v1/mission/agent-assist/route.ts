import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { missionAgentAssistanceService } from '@/modules/mission-workspace/services/MissionAgentAssistanceService';

const AgentAssistSchema = z.object({
  missionId: z.string().min(1).max(120),
  agentId: z.string().min(1).max(80),
  actionId: z.string().min(1).max(120),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const input = AgentAssistSchema.parse(await request.json());
  const data = await missionAgentAssistanceService.invokeAgent({
    user,
    missionId: input.missionId,
    agentId: input.agentId,
    actionId: input.actionId,
  });

  return NextResponse.json({ data });
});
