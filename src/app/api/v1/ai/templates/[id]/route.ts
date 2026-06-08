import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { templateService } from '@/modules/ai/services/template-service';

const UpdateTemplateSchema = z.object({
  name: z.string().min(1).max(120).optional(),
  category: z.string().min(1).max(80).optional(),
  system_prompt: z.string().min(1).optional(),
  user_prompt_template: z.string().min(1).optional(),
  variables: z.array(z.string().min(1)).optional(),
  language: z.enum(['zh', 'en', 'ms']).optional(),
  model_preference: z.string().min(1).optional(),
  is_default: z.boolean().optional(),
});

async function getTemplateId(
  context: { params: Promise<Record<string, string>> | Record<string, string> } | undefined,
) {
  return (await Promise.resolve(context!.params)).id;
}

export const GET = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  const id = await getTemplateId(context);
  const template = await templateService.getById(user.tenantId, id);
  return NextResponse.json({ data: template });
});

export const PATCH = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);

  const id = await getTemplateId(context);
  const body = await request.json();
  const input = UpdateTemplateSchema.parse(body);

  const template = await templateService.update(user.tenantId, id, {
    name: input.name,
    category: input.category,
    systemPrompt: input.system_prompt,
    userPromptTemplate: input.user_prompt_template,
    variables: input.variables,
    language: input.language,
    modelPreference: input.model_preference,
    isDefault: input.is_default,
  });

  return NextResponse.json({ data: template });
});

export const DELETE = apiHandler(async (request: NextRequest, context) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);

  const id = await getTemplateId(context);
  const result = await templateService.delete(user.tenantId, id);
  return NextResponse.json({ data: result });
});
