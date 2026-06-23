import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { autonomousExecutionEngine } from '@/modules/autonomous-execution/services/autonomous-execution-engine';

const AutonomousRunSchema = z.object({
  action: z.enum([
    'AUTO_GENERATE_CONTENT_DRAFT',
    'AUTO_GENERATE_WEEKLY_CONTENT_DRAFTS',
    'AUTO_GENERATE_LEAD_MAGNET_DRAFT',
    'AUTO_GENERATE_FUNNEL_DRAFT',
    'AUTO_GENERATE_CRM_FOLLOW_UP_DRAFT',
    'AUTO_GENERATE_OFFER_DRAFT',
    'AUTO_GENERATE_INTERNAL_REPORT',
    'AUTO_GENERATE_SOP_DRAFT',
    'AUTO_GENERATE_MEETING_NOTES',
    'AUTO_REFRESH_ANALYTICS_SUMMARY',
    'AUTO_GENERATE_OPPORTUNITY_REPORT',
  ]),
  triggerType: z.enum(['scheduled', 'mission', 'event', 'manual']).default('manual'),
  missionId: z.string().min(1).max(120).optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const input = AutonomousRunSchema.parse(await request.json());
  const data = await autonomousExecutionEngine.runAutonomous({
    user,
    action: input.action,
    triggerType: input.triggerType,
    missionId: input.missionId,
  });

  return NextResponse.json({ data });
});
