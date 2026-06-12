import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { videoProjectService } from '@/modules/video/services/video-project-service';
import { VideoProductionInputSchema } from './schemas';

export const dynamic = 'force-dynamic';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const status = request.nextUrl.searchParams.get('status') || undefined;
  const platform = request.nextUrl.searchParams.get('platform') || undefined;
  const projects = await videoProjectService.list(user, { status, platform });
  return NextResponse.json({ data: projects });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const input = VideoProductionInputSchema.parse(await request.json());
  const result = await videoProjectService.startProject(user, input);
  return NextResponse.json({ data: result }, { status: 201 });
});
