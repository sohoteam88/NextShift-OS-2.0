import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { brandDnaService } from '@/modules/brand-dna/services/brandDnaService';
import prisma from '@/lib/prisma';

/**
 * POST /api/v1/brand-dna/regenerate
 * Regenerates Brand DNA from the user's latest completed interview.
 */
export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'brand-dna' });

  // Find latest extracted/confirmed interview
  const interview = await prisma.brandInterview.findFirst({
    where: {
      userId: user.id,
      tenantId: user.tenantId,
      status: { in: ['extracted', 'confirmed'] },
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!interview) {
    return NextResponse.json(
      { error: { code: 'NOT_FOUND', message: 'No completed interview found. Complete Brand Discovery first.' } },
      { status: 404 },
    );
  }

  const dna = await brandDnaService.regenerateBrandDNA(user.id, interview.id);

  return NextResponse.json({ data: dna });
});
