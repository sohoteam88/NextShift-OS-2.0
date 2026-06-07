import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { leadService } from '@/modules/crm/services/lead-service';
import { UpdateLeadSchema } from '@/modules/crm/schemas/lead-schemas';

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
  return NextResponse.json({ data: lead });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['member', 'leader', 'operator']);
  const id = await getLeadId(context);
  const result = await leadService.delete(user, id);
  return NextResponse.json({ data: result });
});
