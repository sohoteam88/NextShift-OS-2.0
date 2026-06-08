import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { onboardingService } from '@/modules/member/services/onboarding-service';

const ProfileSchema = z.object({
  phone: z.string().trim().max(30).optional(),
  whatsapp: z.string().trim().max(30).optional(),
  bio: z.string().trim().max(500).optional(),
  avatar_url: z.string().url().optional(),
});

export const PATCH = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = ProfileSchema.parse(body);
  const state = await onboardingService.saveProfile(user.id, input);
  return NextResponse.json({ data: state });
});
