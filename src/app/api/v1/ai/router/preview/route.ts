import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { getRouterForTenant, type TaskCategory } from '@/modules/ai/router';

const PreviewSchema = z.object({
  task_category: z.enum([
    'brand_extraction',
    'content_generation',
    'video_script',
    'whatsapp_reply',
    'lead_analysis',
    'content_calendar',
    'content_insights',
    'username_generation',
    'bio_generation',
    'funnel_copy',
    'translation',
    'formatting',
  ]),
  input_length: z.number().int().positive().optional(),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = PreviewSchema.parse(await request.json());
  const router = await getRouterForTenant(user.tenantId);

  return NextResponse.json({
    data: router.preview(body.task_category as TaskCategory, body.input_length),
  });
});
