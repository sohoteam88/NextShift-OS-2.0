import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { sharedAiRateLimitGuard } from '@/lib/ai-rate-limit';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { contentCalendarService } from '@/modules/brand-builder/services/content-calendar-service';

export const dynamic = 'force-dynamic';

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  await sharedAiRateLimitGuard(user, { feature: 'generation' });
  const body = (await request.json().catch(() => ({}))) as { days?: number };
  const days = typeof body.days === 'number' ? Math.min(body.days, 60) : 30;
  const items = await contentCalendarService.generate(user, days);
  return NextResponse.json({ data: items }, { status: 201 });
});
