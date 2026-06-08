import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { pipelineService } from '@/modules/crm/services/pipeline-service';

const ReorderSchema = z.object({
  stage_ids: z.array(z.string().uuid()),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator', 'platform_admin']);
  const body = await request.json();
  const { stage_ids } = ReorderSchema.parse(body);
  const stages = await pipelineService.reorderStages(user.tenantId, stage_ids);
  return NextResponse.json({ data: stages });
});
