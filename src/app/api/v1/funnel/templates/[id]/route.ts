import { NextRequest, NextResponse } from 'next/server';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { requireCanonicalMutationPath } from '@/lib/navigation/mutation-compatibility';
import { funnelTemplateService } from '@/modules/funnel/services/template-service';
import { UpdateTemplateSchema } from '@/modules/funnel/schemas/funnel-schemas';

async function getId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getId(context);
  const template = await funnelTemplateService.getById(user.tenantId, id);
  return NextResponse.json({ data: template });
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);
  requireCanonicalMutationPath(request, '/api/v1/admin/funnel/templates/:id');
  const id = await getId(context);
  const body = await request.json();
  const input = UpdateTemplateSchema.parse(body);
  const template = await funnelTemplateService.update(user.tenantId, id, input);
  return NextResponse.json({ data: template });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);
  requireCanonicalMutationPath(request, '/api/v1/admin/funnel/templates/:id');
  const id = await getId(context);
  await funnelTemplateService.delete(user.tenantId, id);
  return NextResponse.json({ data: { deleted: true } });
});
