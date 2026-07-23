import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentPlanService } from '@/modules/ai/services/content-plan-service';

const Schema = z.object({
  niche: z.string().min(1).max(200),
  targetAudience: z.string().min(1).max(300),
  offer: z.string().min(1).max(200),
  platforms: z.array(z.string()).min(1).max(4),
  language: z.enum(['zh', 'en', 'ms']).default('zh'),
  postingFrequency: z.number().int().min(1).max(3).optional(),
  brandTone: z.string().max(100).optional(),
  personalStory: z.string().max(500).optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'content-plan' });
  const body = await request.json();
  const input = Schema.parse(body);
  const result = await contentPlanService.generate(user, input);
  return NextResponse.json({ data: result });
});
