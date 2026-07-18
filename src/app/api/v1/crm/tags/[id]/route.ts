import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { requireCanonicalMutationPath } from '@/lib/navigation/mutation-compatibility';
import { tagService } from '@/modules/crm/services/tag-service';

async function getTagId(context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined) {
  return (await Promise.resolve(context!.params)).id;
}

const UpdateTagSchema = z.object({
  name: z.string().min(1).max(50).optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);
  requireCanonicalMutationPath(request, '/api/v1/admin/crm/tags/:id');
  void user;
  const id = await getTagId(context);
  const body = await request.json();
  const input = UpdateTagSchema.parse(body);
  const tag = await tagService.updateTag(id, input);
  return NextResponse.json({ data: tag });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);
  requireCanonicalMutationPath(request, '/api/v1/admin/crm/tags/:id');
  void user;
  const id = await getTagId(context);
  await tagService.deleteTag(id);
  return NextResponse.json({ data: { deleted: true } });
});
