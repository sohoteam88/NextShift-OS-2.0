import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelCopyService } from '@/modules/ai/services/funnel-copy-service';

const Schema = z.object({
  funnelId: z.string().uuid(),
  copy: z.record(z.string(), z.unknown()),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = await request.json();
  const { funnelId, copy } = Schema.parse(body);
  const updated = await funnelCopyService.applyToFunnel(user, funnelId, copy as never);
  return NextResponse.json({ data: updated });
});
