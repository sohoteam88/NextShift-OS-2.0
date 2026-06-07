import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export const pipelineService = {
  async listStages(tenantId: string) {
    return prisma.pipelineStage.findMany({
      where: { tenantId },
      orderBy: { stageOrder: 'asc' },
    });
  },

  async createStage(tenantId: string, data: { name: string; color?: string }) {
    const max = await prisma.pipelineStage.aggregate({
      where: { tenantId },
      _max: { stageOrder: true },
    });
    const nextOrder = (max._max.stageOrder ?? -1) + 1;

    return prisma.pipelineStage.create({
      data: {
        tenantId,
        name: data.name,
        color: data.color ?? '#6366f1',
        stageOrder: nextOrder,
      },
    });
  },

  async updateStage(stageId: string, data: { name?: string; color?: string; stageOrder?: number }) {
    return prisma.pipelineStage.update({
      where: { id: stageId },
      data,
    });
  },

  async deleteStage(stageId: string) {
    const stage = await prisma.pipelineStage.findUnique({ where: { id: stageId } });
    if (!stage) throw new AppError('NOT_FOUND', 404, 'Stage not found');

    const leadCount = await prisma.lead.count({
      where: { tenantId: stage.tenantId, pipelineStage: stage.name, deletedAt: null },
    });
    if (leadCount > 0) {
      throw new AppError('CONFLICT', 409, `Cannot delete stage with ${leadCount} leads`);
    }

    return prisma.pipelineStage.delete({ where: { id: stageId } });
  },

  async reorderStages(tenantId: string, stageIds: string[]) {
    await Promise.all(
      stageIds.map((id, index) =>
        prisma.pipelineStage.update({
          where: { id, tenantId },
          data: { stageOrder: index },
        }),
      ),
    );
    return pipelineService.listStages(tenantId);
  },
};
