import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { onboardingService } from '@/modules/member/services/onboarding-service';

const SaveContentSchema = z.object({
  title: z.string().trim().min(1),
  content: z.string().trim().min(1),
  platform: z.enum(['facebook', 'instagram', 'tiktok', 'xiaohongshu']),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const options = await onboardingService.generateFirstContentOptions(user.id);
  return NextResponse.json({ data: options });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = SaveContentSchema.parse(body);
  const content = await onboardingService.saveFirstContent(user.id, input);
  return NextResponse.json({ data: content });
});
