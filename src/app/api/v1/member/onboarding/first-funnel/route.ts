import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { onboardingService } from '@/modules/member/services/onboarding-service';

const FirstFunnelSchema = z.object({
  template_id: z.string().uuid(),
  whatsapp: z.string().trim().min(6),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = FirstFunnelSchema.parse(body);
  const result = await onboardingService.createFirstFunnel(user.id, {
    template_id: input.template_id,
    whatsapp: input.whatsapp,
  });
  return NextResponse.json({ data: result });
});
