import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { assertRequestBodySize } from '@/lib/request-guards';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { discussCommandCenterRecommendation } from '@/modules/dashboard/services/discussion-service';

const DiscussionTurnSchema = z.object({
  role: z.enum(['user', 'assistant']),
  content: z.string().min(1).max(2_000),
});

const DiscussRecommendationSchema = z.object({
  message: z.string().min(1).max(1_500),
  history: z.array(DiscussionTurnSchema).max(10).optional().default([]),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  assertRequestBodySize(request, 100_000, 'AI discussion payload');
  const input = DiscussRecommendationSchema.parse(await request.json());
  const result = await discussCommandCenterRecommendation(user, input);

  if (!result) {
    return NextResponse.json({ data: null });
  }

  return NextResponse.json(result);
});
