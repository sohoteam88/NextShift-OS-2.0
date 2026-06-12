import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi } from '@/modules/auth/middleware/require-auth-api';
import { videoProjectService } from '@/modules/video/services/video-project-service';
import { VideoHookSchema, VideoProductionInputSchema } from '../../schemas';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

const Schema = z.object({
  chosen_hook: VideoHookSchema,
  input: VideoProductionInputSchema,
});

export const POST = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const body = Schema.parse(await request.json());
  const result = await videoProjectService.generateFullScript(user, await getId(context), body.chosen_hook, body.input);
  return NextResponse.json({ data: result });
});
