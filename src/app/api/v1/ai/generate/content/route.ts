import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { assertRequestBodySize } from '@/lib/request-guards';
import { checkRateLimit } from '@/lib/rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentService } from '@/modules/ai/services/content-service';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

const GenerateContentSchema = z.object({
  topic: z.string().min(1),
  platform: z.enum(['facebook', 'instagram', 'tiktok', 'xiaohongshu', 'whatsapp']),
  tone: z.enum(['educational', 'inspirational', 'personal', 'professional']).optional(),
  language: z.enum(['zh', 'en', 'ms']).optional(),
  templateId: z.string().uuid().optional(),
  additionalContext: z.string().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  if (!(await checkRateLimit(`ai:${user.id}`, 20, 60 * 60 * 1000))) {
    throw new AppError('RATE_LIMITED', 429, 'Too many AI generation requests');
  }
  assertRequestBodySize(request, 1_000_000, 'AI generation payload');
  const body = await request.json();
  const input = GenerateContentSchema.parse(body);
  const result = await contentService.generate(user, input);
  const mission = await notifyMissionProgress(user, 'first_content_generated');
  return NextResponse.json({ data: result, mission });
});
