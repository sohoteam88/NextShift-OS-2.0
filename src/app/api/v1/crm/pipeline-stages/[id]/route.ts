import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { pipelineService } from '@/modules/crm/services/pipeline-service';

async function getStageId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

const UpdateStageSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
  stageOrder: z.number().int().min(0).optional(),
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator', 'platform_admin']);
  const id = await getStageId(context);
  const body = await request.json();
  const input = UpdateStageSchema.parse(body);
  const stage = await pipelineService.updateStage(id, input);
  return NextResponse.json({ data: stage });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator', 'platform_admin']);
  void user;
  const id = await getStageId(context);
  await pipelineService.deleteStage(id);
  return NextResponse.json({ data: { deleted: true } });
});
