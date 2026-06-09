import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentInsightsService } from '@/modules/brand-builder/services/content-insights-service';

export const dynamic = 'force-dynamic';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const insights = await contentInsightsService.analyze(user);
  return NextResponse.json({ data: insights });
});
