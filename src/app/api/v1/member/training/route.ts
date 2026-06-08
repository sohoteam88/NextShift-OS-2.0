import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { trainingService } from '@/modules/member/services/training-service';

const BodySchema = z.object({
  moduleId: z.string().trim().min(1),
  status: z.enum(['in_progress', 'completed']),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  void request;
  const overview = await trainingService.getOverview(user);
  return NextResponse.json({ data: overview });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = BodySchema.parse(body);
  const progress =
    input.status === 'completed'
      ? await trainingService.completeModule(user, input.moduleId)
      : await trainingService.startModule(user, input.moduleId);
  return NextResponse.json({ data: progress });
});
