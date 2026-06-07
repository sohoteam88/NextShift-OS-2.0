import { type Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { paginationMeta } from '@/lib/query-helpers';
import { type AuthUser } from '@/modules/auth/services/auth-service';
import { type CreateLeadInput, type UpdateLeadInput, type LeadQuery } from '../schemas/lead-schemas';
import { calculateLeadScore, recalculateLeadScore } from './scoring-service';
import { logActivity } from './activity-service';

export const leadService = {
  async list(user: AuthUser, query: LeadQuery) {
    const where: Prisma.LeadWhereInput = { tenantId: user.tenantId };

    if (user.role === 'member') {
      where.ownerId = user.id;
    } else if (user.role === 'leader') {
      const downlineIds = await getDownlineUserIds(user.id, user.tenantId);
      where.ownerId = { in: [user.id, ...downlineIds] };
    }

    if (query.stage) where.pipelineStage = query.stage;
    if (query.owner_id && user.role !== 'member') where.ownerId = query.owner_id;

    if (query.search) {
      where.OR = [
        { name: { contains: query.search, mode: 'insensitive' } },
        { email: { contains: query.search, mode: 'insensitive' } },
        { phone: { contains: query.search } },
      ];
    }

    if (query.min_score !== undefined || query.max_score !== undefined) {
      where.score = {
        ...(query.min_score !== undefined && { gte: query.min_score }),
        ...(query.max_score !== undefined && { lte: query.max_score }),
      };
    }

    if (query.tag) {
      where.tags = { some: { tag: { name: query.tag } } };
    }

    const [items, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { [query.sort_by]: query.sort_order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: {
          tags: { include: { tag: true } },
          owner: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      prisma.lead.count({ where }),
    ]);

    return { items, meta: paginationMeta(total, query.page, query.limit) };
  },

  async getById(user: AuthUser, leadId: string) {
    const lead = await prisma.lead.findFirst({
      where: { id: leadId, tenantId: user.tenantId },
      include: {
        tags: { include: { tag: true } },
        notes: {
          orderBy: { createdAt: 'desc' },
          take: 20,
          include: { user: { select: { id: true, name: true } } },
        },
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 50,
          include: { user: { select: { id: true, name: true } } },
        },
        owner: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    if (!lead) throw new AppError('NOT_FOUND', 404, 'Lead not found');

    if (user.role === 'member' && lead.ownerId !== user.id) {
      throw new AppError('FORBIDDEN', 403, 'Access denied');
    }

    return lead;
  },

  async create(user: AuthUser, input: CreateLeadInput) {
    if (input.phone) {
      const existing = await prisma.lead.findFirst({
        where: { tenantId: user.tenantId, phone: input.phone, deletedAt: null },
      });
      if (existing) {
        throw new AppError('CONFLICT', 409, `Lead with phone ${input.phone} already exists`);
      }
    }

    const { metadata, ...rest } = input;
    const lead = await prisma.lead.create({
      data: {
        ...rest,
        tenantId: user.tenantId,
        ownerId: user.id,
        pipelineStage: 'new',
        score: 0,
        ...(metadata !== undefined && { metadata: metadata as Prisma.InputJsonValue }),
      },
      include: { tags: { include: { tag: true } } },
    });

    const { score, reasons } = calculateLeadScore(lead);
    await prisma.lead.update({
      where: { id: lead.id },
      data: { score, scoreReasons: reasons as never, scoreUpdatedAt: new Date() },
    });

    await logActivity({
      tenantId: user.tenantId,
      leadId: lead.id,
      userId: user.id,
      type: 'lead_created',
      description: `Lead created from source: ${input.source ?? 'manual'}`,
    });

    return { ...lead, score, scoreReasons: reasons };
  },

  async update(user: AuthUser, leadId: string, input: UpdateLeadInput) {
    const existing = await prisma.lead.findFirst({
      where: { id: leadId, tenantId: user.tenantId },
    });
    if (!existing) throw new AppError('NOT_FOUND', 404, 'Lead not found');

    if (user.role === 'member' && existing.ownerId !== user.id) {
      throw new AppError('FORBIDDEN', 403, 'Access denied');
    }

    const oldStage = existing.pipelineStage;
    const { metadata: updateMeta, nextFollowup, ...updateRest } = input;

    const lead = await prisma.lead.update({
      where: { id: leadId },
      data: {
        ...updateRest,
        nextFollowup: nextFollowup ? new Date(nextFollowup) : nextFollowup,
        updatedAt: new Date(),
        ...(updateMeta !== undefined && { metadata: updateMeta as Prisma.InputJsonValue }),
      },
      include: { tags: { include: { tag: true } } },
    });

    const newScore = await recalculateLeadScore(lead.id);

    if (input.pipelineStage && input.pipelineStage !== oldStage) {
      await logActivity({
        tenantId: user.tenantId,
        leadId: lead.id,
        userId: user.id,
        type: 'stage_change',
        description: `Stage changed: ${oldStage} → ${input.pipelineStage}`,
        metadata: { from: oldStage, to: input.pipelineStage },
      });
    }

    return { ...lead, score: newScore };
  },

  async delete(user: AuthUser, leadId: string) {
    const existing = await prisma.lead.findFirst({
      where: { id: leadId, tenantId: user.tenantId },
    });
    if (!existing) throw new AppError('NOT_FOUND', 404, 'Lead not found');

    if (user.role === 'member' && existing.ownerId !== user.id) {
      throw new AppError('FORBIDDEN', 403, 'Access denied');
    }

    await prisma.lead.delete({ where: { id: leadId } });
    return { deleted: true };
  },
};

async function getDownlineUserIds(userId: string, tenantId: string): Promise<string[]> {
  const downline = await prisma.user.findMany({
    where: { tenantId, sponsorId: userId },
    select: { id: true },
  });
  const ids = downline.map((u) => u.id);
  for (const id of [...ids]) {
    const subIds = await getDownlineUserIds(id, tenantId);
    ids.push(...subIds);
  }
  return ids;
}
