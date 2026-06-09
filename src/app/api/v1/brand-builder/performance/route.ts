import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { postPerformanceService } from '@/modules/brand-builder/services/post-performance-service';

export const dynamic = 'force-dynamic';

const CreateSchema = z.object({
  platform: z.string().min(1),
  postUrl: z.string().url().optional().or(z.literal('')),
  pillar: z.string().optional(),
  format: z.string().optional(),
  publishedAt: z.string(),
  reach: z.number().int().min(0),
  impressions: z.number().int().min(0).optional(),
  likes: z.number().int().min(0),
  comments: z.number().int().min(0),
  shares: z.number().int().min(0),
  saves: z.number().int().min(0).optional(),
  clicks: z.number().int().min(0).optional(),
  contentId: z.string().optional(),
  calendarId: z.string().optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const sp = request.nextUrl.searchParams;
  const result = await postPerformanceService.list(user, {
    platform: sp.get('platform') ?? undefined,
    pillar: sp.get('pillar') ?? undefined,
    startDate: sp.get('start') ? new Date(sp.get('start')!) : undefined,
    endDate: sp.get('end') ? new Date(sp.get('end')!) : undefined,
    page: sp.get('page') ? Number(sp.get('page')) : 1,
    limit: sp.get('limit') ? Number(sp.get('limit')) : 20,
  });
  return NextResponse.json({ data: result.items, meta: result.meta });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const body = await request.json();
  const input = CreateSchema.safeParse(body);
  if (!input.success) throw new AppError('VALIDATION_ERROR', 400, input.error.message);
  const item = await postPerformanceService.create(user, {
    ...input.data,
    postUrl: input.data.postUrl || undefined,
    publishedAt: new Date(input.data.publishedAt),
  });
  return NextResponse.json({ data: item }, { status: 201 });
});
