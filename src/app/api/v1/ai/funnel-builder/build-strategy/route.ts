import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { funnelStrategyService } from '@/modules/funnel/services/funnel-strategy-service';

const CaseStudySchema = z.object({
  name: z.string().min(1).max(80),
  before_state: z.string().min(1).max(500),
  process: z.string().min(1).max(500),
  after_result: z.string().min(1).max(500),
});

const Schema = z.object({
  business: z.object({
    type: z.string().min(1).max(100),
    product: z.string().min(1).max(200),
    audience: z.string().min(1).max(300),
    pain_point: z.string().min(1).max(300),
    desired_outcome: z.string().min(1).max(300),
    price_range: z.string().max(100).optional(),
  }),
  real_material: z.object({
    founder_story: z.string().max(1500).optional(),
    case_studies: z.array(CaseStudySchema).min(1).max(3),
    common_objections: z.array(z.string().min(1).max(300)).min(3).max(6),
    competitors_mentioned: z.string().max(500).optional(),
  }),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const input = Schema.parse(await request.json());
  const context = await funnelStrategyService.buildStrategy(user, input);
  return NextResponse.json({ data: context });
});
