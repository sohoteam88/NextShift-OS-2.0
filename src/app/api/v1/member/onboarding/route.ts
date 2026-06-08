import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { onboardingService } from '@/modules/member/services/onboarding-service';
import type { OnboardingStep } from '@/modules/member/types';

const StepSchema = z.object({
  step: z.enum(['profile', 'goals', 'brand', 'first_content', 'first_funnel']),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const overview = await onboardingService.getOverview(user.id);
  return NextResponse.json({ data: overview });
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json().catch(() => ({}));
  const input = StepSchema.parse(body);
  const state = await onboardingService.completeStep(user.id, input.step as OnboardingStep);
  return NextResponse.json({ data: state });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  void request;
  const state = await onboardingService.skipOnboarding(user.id);
  return NextResponse.json({ data: state });
});
