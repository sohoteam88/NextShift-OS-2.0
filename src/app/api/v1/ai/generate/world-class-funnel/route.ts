import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelBuilderService } from '@/modules/ai/services/funnel-builder-service';
import { resolveRequestWorkspaceContext } from '@/modules/workspace/request-workspace-context';

const Schema = z.object({
  businessType: z.string().min(1).max(100),
  productOrService: z.string().min(1).max(200),
  targetAudience: z.string().min(1).max(300),
  marketLocation: z.string().min(1).max(100),
  language: z.enum(['zh', 'en', 'ms']).default('zh'),
  mainCustomerPain: z.string().min(1).max(300),
  desiredResult: z.string().min(1).max(300),
  offerPrice: z.string().max(100).optional(),
  funnelGoal: z.string().min(1).max(200),
  trafficSource: z.string().max(200).optional(),
  closingMethod: z.string().min(1).max(100),
  brandTone: z.string().max(100).optional(),
  strategyContext: z.any().optional(),
  workspaceId: z.string().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'world-class-funnel' });
  const body = await request.json();
  const { workspaceId: _workspaceId, ...input } = Schema.parse(body);
  const workspaceContext = await resolveRequestWorkspaceContext({ user, request, body });
  const result = await funnelBuilderService.generateWorldClassFunnel(user, input, workspaceContext);
  return NextResponse.json({ data: result });
});
