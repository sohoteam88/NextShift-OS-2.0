import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { onboardingService } from '@/modules/member/services/onboarding-service';

const GoalsSchema = z.object({
  health_goals: z.array(z.string().trim().min(1)).min(1),
  target_audience: z.string().trim().min(1).max(120),
  specialty: z.string().trim().min(1).max(120),
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = GoalsSchema.parse(body);
  const state = await onboardingService.saveGoals(user.id, input);
  return NextResponse.json({ data: state });
});
