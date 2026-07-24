import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { bioService } from '@/modules/brand-builder/services/bio-service';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'brand-bio' });
  const body = (await request.json().catch(() => ({}))) as { brand_profile?: Record<string, unknown> };

  let brandProfile = body.brand_profile;
  if (!brandProfile) {
    const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { metadata: true } });
    brandProfile = ((dbUser?.metadata as Record<string, unknown>)?.brand_profile as Record<string, unknown>) ?? {};
  }

  const bios = await bioService.generate(user, brandProfile);
  return NextResponse.json({ data: bios });
});
