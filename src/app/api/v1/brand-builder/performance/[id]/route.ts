import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { postPerformanceService } from '@/modules/brand-builder/services/post-performance-service';

export const dynamic = 'force-dynamic';

async function getId(
  context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined,
) {
  return (await Promise.resolve(context!.params)).id;
}

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const id = await getId(context);
  const user = await requireAuthApi(request);
  const body = (await request.json()) as Record<string, number | string>;
  const item = await postPerformanceService.update(user, id, body);
  return NextResponse.json({ data: item });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const id = await getId(context);
  const user = await requireAuthApi(request);
  await postPerformanceService.delete(user, id);
  return NextResponse.json({ success: true });
});
