import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { requireCanonicalMutationPath } from '@/lib/navigation/mutation-compatibility';
import { funnelTemplateService } from '@/modules/funnel/services/template-service';
import { CreateTemplateSchema } from '@/modules/funnel/schemas/funnel-schemas';

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const type = request.nextUrl.searchParams.get('type') ?? undefined;
  const templates = await funnelTemplateService.list(user.tenantId, type);
  return NextResponse.json({ data: templates });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);
  requireCanonicalMutationPath(request, '/api/v1/admin/funnel/templates');
  const body = await request.json();
  const input = CreateTemplateSchema.parse(body);
  const template = await funnelTemplateService.create(user.tenantId, input);
  return NextResponse.json({ data: template }, { status: 201 });
});
