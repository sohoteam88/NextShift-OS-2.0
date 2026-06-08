import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';

export const tagService = {
  async listTags(tenantId: string) {
    return prisma.tag.findMany({
      where: { tenantId },
      orderBy: { name: 'asc' },
    });
  },

  async createTag(tenantId: string, data: { name: string; color?: string }) {
    const exists = await prisma.tag.findFirst({
      where: { tenantId, name: data.name },
    });
    if (exists) throw new AppError('CONFLICT', 409, `Tag "${data.name}" already exists`);

    return prisma.tag.create({
      data: { tenantId, name: data.name, color: data.color ?? '#6366f1' },
    });
  },

  async updateTag(tagId: string, data: { name?: string; color?: string }) {
    return prisma.tag.update({ where: { id: tagId }, data });
  },

  async deleteTag(tagId: string) {
    // LeadTag rows cascade via DB foreign key
    return prisma.tag.delete({ where: { id: tagId } });
  },

  async setLeadTags(leadId: string, tenantId: string, tagIds: string[]) {
    // Verify all tags belong to tenant
    if (tagIds.length > 0) {
      const valid = await prisma.tag.count({
        where: { id: { in: tagIds }, tenantId },
      });
      if (valid !== tagIds.length) {
        throw new AppError('FORBIDDEN', 403, 'One or more tags do not belong to this tenant');
      }
    }

    await prisma.$transaction([
      prisma.leadTag.deleteMany({ where: { leadId } }),
      ...(tagIds.length > 0
        ? [prisma.leadTag.createMany({
            data: tagIds.map((tagId) => ({ leadId, tagId })),
          })]
        : []),
    ]);

    return prisma.lead.findFirst({
      where: { id: leadId },
      include: { tags: { include: { tag: true } } },
    });
  },
};
