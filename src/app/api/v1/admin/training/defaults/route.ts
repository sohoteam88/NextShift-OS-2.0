import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { trainingService } from '@/modules/member/services/training-service';

const ModuleSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  description: z.string().trim().min(1),
  content_url: z.string().trim().optional(),
  order: z.number().int(),
});

const BodySchema = z.object({
  modules: z.array(ModuleSchema).min(1),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);
  const modules = await trainingService.getModules(user.tenantId);
  return NextResponse.json({ data: modules });
});

export const PUT = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);
  const body = await request.json();
  const input = BodySchema.parse(body);
  const modules = await trainingService.updateDefaultModules(user.tenantId, input.modules);
  return NextResponse.json({ data: modules });
});
