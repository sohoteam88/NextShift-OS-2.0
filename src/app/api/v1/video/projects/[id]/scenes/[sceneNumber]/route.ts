import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { videoProjectService } from '@/modules/video/services/video-project-service';

async function getParams(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return Promise.resolve(context!.params);
}

const Schema = z.object({ instruction: z.string().min(1).max(1000) });

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const params = await getParams(context);
  const body = Schema.parse(await request.json());
  const result = await videoProjectService.regenerateScene(user, params.id, Number(params.sceneNumber), body.instruction);
  return NextResponse.json({ data: result });
});
