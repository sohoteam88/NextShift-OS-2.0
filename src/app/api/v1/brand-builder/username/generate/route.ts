import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { usernameService } from '@/modules/brand-builder/services/username-service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = (await request.json().catch(() => ({}))) as { brand_profile?: Record<string, unknown> };

  let brandProfile = body.brand_profile;
  if (!brandProfile) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
    brandProfile = ((dbUser?.metadata as Record<string, unknown>)?.brand_profile as Record<string, unknown>) ?? {};
  }

  const options = await usernameService.generate(user, brandProfile);
  return NextResponse.json({ data: options });
});
