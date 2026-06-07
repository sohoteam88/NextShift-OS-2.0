import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { pipelineService } from '@/modules/crm/services/pipeline-service';

const CreateStageSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const stages = await pipelineService.listStages(user.tenantId);
  return NextResponse.json({ data: stages });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator', 'platform_admin']);
  const body = await request.json();
  const input = CreateStageSchema.parse(body);
  const stage = await pipelineService.createStage(user.tenantId, input);
  return NextResponse.json({ data: stage }, { status: 201 });
});
