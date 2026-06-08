import { type Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { type CreateTemplateInput, type UpdateTemplateInput } from '../schemas/funnel-schemas';

export const funnelTemplateService = {
  async list(tenantId: string, type?: string) {
    return prisma.funnelTemplate.findMany({
      where: { tenantId, ...(type && { type }) },
      orderBy: { createdAt: 'asc' },
    });
  },

  async getById(tenantId: string, templateId: string) {
    const template = await prisma.funnelTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!template) throw new AppError('NOT_FOUND', 404, 'Template not found');
    return template;
  },

  async create(tenantId: string, input: CreateTemplateInput) {
    return prisma.funnelTemplate.create({
      data: {
        tenantId,
        name: input.name,
        type: input.type,
        config: input.config as Prisma.InputJsonValue,
        thumbnail: input.thumbnail,
      },
    });
  },

  async update(tenantId: string, templateId: string, input: UpdateTemplateInput) {
    const existing = await prisma.funnelTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!existing) throw new AppError('NOT_FOUND', 404, 'Template not found');

    return prisma.funnelTemplate.update({
      where: { id: templateId },
      data: {
        ...(input.name && { name: input.name }),
        ...(input.config && { config: input.config as Prisma.InputJsonValue }),
        ...(input.thumbnail !== undefined && { thumbnail: input.thumbnail }),
      },
    });
  },

  async delete(tenantId: string, templateId: string) {
    const existing = await prisma.funnelTemplate.findFirst({
      where: { id: templateId, tenantId },
    });
    if (!existing) throw new AppError('NOT_FOUND', 404, 'Template not found');

    const funnelCount = await prisma.funnel.count({ where: { templateId } });
    if (funnelCount > 0) {
      throw new AppError('CONFLICT', 409, `Cannot delete template in use by ${funnelCount} funnels`);
    }

    return prisma.funnelTemplate.delete({ where: { id: templateId } });
  },
};
