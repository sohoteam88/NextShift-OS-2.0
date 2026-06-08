import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { tagService } from '@/modules/crm/services/tag-service';

const CreateTagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/).optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const tags = await tagService.listTags(user.tenantId);
  return NextResponse.json({ data: tags });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['leader', 'operator', 'platform_admin']);
  const body = await request.json();
  const input = CreateTagSchema.parse(body);
  const tag = await tagService.createTag(user.tenantId, input);
  return NextResponse.json({ data: tag }, { status: 201 });
});
