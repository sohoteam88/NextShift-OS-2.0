import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { missionService } from '@/modules/mission/services/mission-service';

const CompleteCheckSchema = z.object({
  check_key: z.string().min(1).max(100),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = CompleteCheckSchema.parse(body);
  const result = await missionService.completeCheck(user, input.check_key);
  return NextResponse.json({ data: result, mission: result });
});
