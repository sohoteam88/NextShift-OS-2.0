import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { brandAdvisorService } from '@/modules/brand-intelligence/services/advisor-service';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'brand-advisor', userLimit: 120, tenantLimit: 600 });
  const advisor = await brandAdvisorService.getSnapshot(user.id);
  return NextResponse.json({ data: advisor });
});
