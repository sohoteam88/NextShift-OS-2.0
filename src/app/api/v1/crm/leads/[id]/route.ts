import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { leadService } from '@/modules/crm/services/lead-service';
import { UpdateLeadSchema } from '@/modules/crm/schemas/lead-schemas';
import { notifyMissionProgress } from '@/modules/mission/utils/complete-mission';

async function getLeadId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  const params = await Promise.resolve(context!.params);
  return params.id;
}

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getLeadId(context);
  const lead = await leadService.getById(user, id);
  return NextResponse.json({ data: lead });
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['member', 'leader', 'operator']);
  const id = await getLeadId(context);
  const body = await request.json();
  const input = UpdateLeadSchema.parse(body);
  const lead = await leadService.update(user, id, input);
  const convertedStages = new Set(['已转化', 'converted', 'won']);
  const mission = input.pipelineStage && convertedStages.has(input.pipelineStage)
    ? await notifyMissionProgress(user, 'first_sale_completed')
    : undefined;
  return NextResponse.json({ data: lead, mission });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['member', 'leader', 'operator']);
  const id = await getLeadId(context);
  const result = await leadService.delete(user, id);
  return NextResponse.json({ data: result });
});
