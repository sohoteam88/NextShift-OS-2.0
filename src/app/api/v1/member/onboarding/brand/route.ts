import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { onboardingService } from '@/modules/member/services/onboarding-service';

const SaveBrandSchema = z.object({
  positioning: z.string().trim().min(1),
  content_pillars: z.array(z.string().trim().min(1)).min(1),
  audience: z.string().trim().optional(),
  why_this_works: z.string().trim().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const brand = await onboardingService.generateBrandPositioning(user.id);
  return NextResponse.json({ data: brand });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = SaveBrandSchema.parse(body);
  const state = await onboardingService.saveBrandPositioning(user.id, input);
  return NextResponse.json({ data: state });
});
