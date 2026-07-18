import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { apiHandler } from '@/lib/api-handler';
import { requireAuthApi, requireRoleApi } from '@/modules/auth/middleware/require-auth-api';
import { requireCanonicalMutationPath } from '@/lib/navigation/mutation-compatibility';
import { templateService } from '@/modules/ai/services/template-service';

const CreateTemplateSchema = z.object({
  name: z.string().min(1).max(120),
  category: z.string().min(1).max(80),
  system_prompt: z.string().min(1),
  user_prompt_template: z.string().min(1),
  variables: z.array(z.string().min(1)).default([]),
  language: z.enum(['zh', 'en', 'ms']).default('zh'),
  model_preference: z.string().min(1).optional(),
  is_default: z.boolean().optional(),
});

export const GET = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  const category = request.nextUrl.searchParams.get('category') || undefined;
  const templates = await templateService.list(user.tenantId, category);
  return NextResponse.json({ data: templates });
});

export const POST = apiHandler(async (request: NextRequest) => {
  const user = await requireAuthApi(request);
  requireRoleApi(user, ['operator']);
  requireCanonicalMutationPath(request, '/api/v1/admin/ai/templates');

  const body = await request.json();
  const input = CreateTemplateSchema.parse(body);

  const template = await templateService.create(user.tenantId, {
    name: input.name,
    category: input.category,
    systemPrompt: input.system_prompt,
    userPromptTemplate: input.user_prompt_template,
    variables: input.variables,
    language: input.language,
    modelPreference: input.model_preference,
    isDefault: input.is_default,
  });

  return NextResponse.json({ data: template }, { status: 201 });
});
