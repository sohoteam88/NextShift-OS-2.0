import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';

type TemplateInput = {
  name: string;
  category: string;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  language?: string;
  modelPreference?: string;
  isDefault?: boolean;
};

type TemplateUpdateInput = Partial<TemplateInput>;

function composePrompt(systemPrompt: string, userPromptTemplate: string): string {
  return [systemPrompt.trim(), userPromptTemplate.trim()].filter(Boolean).join('\n\n');
}

export const templateService = {
  async list(tenantId: string, category?: string) {
    return prisma.aIPromptTemplate.findMany({
      where: {
        tenantId,
        ...(category ? { category } : {}),
      },
      orderBy: [{ isDefault: 'desc' }, { name: 'asc' }],
    });
  },

  async getById(tenantId: string, id: string) {
    const template = await prisma.aIPromptTemplate.findFirst({
      where: { id, tenantId },
    });

    if (!template) {
      throw new AppError('NOT_FOUND', 404, 'Template not found');
    }

    return template;
  },

  async create(tenantId: string, data: TemplateInput) {
    return prisma.aIPromptTemplate.create({
      data: {
        tenantId,
        name: data.name,
        category: data.category,
        prompt: composePrompt(data.systemPrompt, data.userPromptTemplate),
        systemPrompt: data.systemPrompt,
        userPromptTemplate: data.userPromptTemplate,
        variables: data.variables,
        language: data.language ?? 'zh',
        modelPreference: data.modelPreference ?? 'anthropic',
        isDefault: data.isDefault ?? false,
      },
    });
  },

  async update(tenantId: string, id: string, data: TemplateUpdateInput) {
    const existing = await this.getById(tenantId, id);
    const nextSystemPrompt = data.systemPrompt ?? existing.systemPrompt;
    const nextUserPromptTemplate = data.userPromptTemplate ?? existing.userPromptTemplate;

    return prisma.aIPromptTemplate.update({
      where: { id },
      data: {
        ...(data.name !== undefined ? { name: data.name } : {}),
        ...(data.category !== undefined ? { category: data.category } : {}),
        ...(data.language !== undefined ? { language: data.language } : {}),
        ...(data.modelPreference !== undefined ? { modelPreference: data.modelPreference } : {}),
        ...(data.isDefault !== undefined ? { isDefault: data.isDefault } : {}),
        ...(data.systemPrompt !== undefined ? { systemPrompt: data.systemPrompt } : {}),
        ...(data.userPromptTemplate !== undefined
          ? { userPromptTemplate: data.userPromptTemplate }
          : {}),
        ...(data.variables !== undefined ? { variables: data.variables } : {}),
        prompt: composePrompt(nextSystemPrompt, nextUserPromptTemplate),
      },
    });
  },

  async delete(tenantId: string, id: string) {
    await this.getById(tenantId, id);
    await prisma.aIPromptTemplate.delete({ where: { id } });
    return { deleted: true };
  },
};
