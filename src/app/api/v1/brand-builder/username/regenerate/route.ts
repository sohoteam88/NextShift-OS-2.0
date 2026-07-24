import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { usernameService } from '@/modules/brand-builder/services/username-service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'brand-username-regenerate' });
  const body = (await request.json()) as { excluded?: string[]; brand_profile?: Record<string, unknown> };

  if (!Array.isArray(body.excluded)) {
    throw new AppError('VALIDATION_ERROR', 400, 'excluded must be an array of strings');
  }

  let brandProfile = body.brand_profile;
  if (!brandProfile) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
    brandProfile = ((dbUser?.metadata as Record<string, unknown>)?.brand_profile as Record<string, unknown>) ?? {};
  }

  const options = await usernameService.regenerate(user, brandProfile, body.excluded);
  return NextResponse.json({ data: options });
});
