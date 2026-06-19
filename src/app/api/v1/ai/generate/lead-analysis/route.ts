import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { leadAnalysisService } from '@/modules/ai/services/lead-analysis-service';

const LeadAnalysisSchema = z.object({
  leadId: z.string().uuid(),
  language: z.enum(['zh', 'en', 'ms']).optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = await request.json();
  const input = LeadAnalysisSchema.parse(body);
  const result = await leadAnalysisService.analyze(user, input);
  return NextResponse.json({ data: result });
});
