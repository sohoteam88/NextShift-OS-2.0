import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelCopyService } from '@/modules/ai/services/funnel-copy-service';

const Schema = z.object({
  funnelType: z.enum(['landing', 'quiz', 'lead_magnet']),
  audience: z.string().min(1).max(200),
  offer: z.string().min(1).max(200),
  product: z.string().max(200).optional(),
  language: z.enum(['zh', 'en', 'ms']).optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'funnel-copy' });
  const body = await request.json();
  const input = Schema.parse(body);
  const result = await funnelCopyService.generate(user, input);
  return NextResponse.json({ data: result });
});
