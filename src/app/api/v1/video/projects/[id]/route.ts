import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { AppError } from '@/lib/errors';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { videoProjectService } from '@/modules/video/services/video-project-service';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const project = await videoProjectService.get(user, await getId(context));
  if (!project) throw new AppError('NOT_FOUND', 404, 'Video project not found');
  return NextResponse.json({ data: project });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const result = await videoProjectService.delete(user, await getId(context));
  return NextResponse.json({ data: result });
});
