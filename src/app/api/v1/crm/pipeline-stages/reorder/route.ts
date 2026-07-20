import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { requireCanonicalMutationPath } from '@/lib/navigation/mutation-compatibility';
import { pipelineService } from '@/modules/crm/services/pipeline-service';

const ReorderSchema = z.object({
  stage_ids: z.array(z.string().uuid()),
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);
  requireCanonicalMutationPath(request, '/api/v1/admin/crm/pipeline-stages/reorder');
  const body = await request.json();
  const { stage_ids } = ReorderSchema.parse(body);
  const stages = await pipelineService.reorderStages(user.tenantId, stage_ids);
  return NextResponse.json({ data: stages });
});
