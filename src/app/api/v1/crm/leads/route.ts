import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { assertRequestBodySize } from '@/lib/request-guards';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { getSearchParams } from '@/lib/query-helpers';
import { leadService } from '@/modules/crm/services/lead-service';
import { CreateLeadSchema, LeadQuerySchema } from '@/modules/crm/schemas/lead-schemas';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['member', 'leader', 'operator', 'platform_admin']);
  const query = LeadQuerySchema.parse(getSearchParams(request));
  const result = await leadService.list(user, query);
  return NextResponse.json({ data: result.items, meta: result.meta });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['member', 'leader', 'operator']);
  assertRequestBodySize(request, 1_000_000, 'Lead payload');
  const body = await request.json();
  const input = CreateLeadSchema.parse(body);
  const lead = await leadService.create(user, input);
  return NextResponse.json({ data: lead }, { status: 201 });
});
