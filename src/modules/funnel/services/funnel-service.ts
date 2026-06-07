import { type Prisma } from '@prisma/client';
import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { paginationMeta } from '@/lib/query-helpers';
import { type AuthUser } from '@/modules/auth/services/auth-service';
import { type CreateFunnelInput, type UpdateFunnelInput, type FunnelQuery } from '../schemas/funnel-schemas';
import { type FunnelConfig } from '../types';
import { quotaService } from '@/modules/tenant/services/quota-service';

function slugify(str: string): string {
  return str
    .toLowerCase()
    .replace(/[\s一-鿿]+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .slice(0, 50);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 6);
}

async function generateSlug(base: string): Promise<string> {
  const prefix = slugify(base) || 'funnel';
  let slug = `${prefix}-${randomSuffix()}`;
  let attempts = 0;
  while (await prisma.funnel.findUnique({ where: { slug } })) {
    slug = `${prefix}-${randomSuffix()}`;
    if (++attempts > 10) slug = `funnel-${Date.now().toString(36)}`;
  }
  return slug;
}

function validatePublishConfig(config: FunnelConfig): void {
  const sections = config.sections ?? [];
  const hasHero = sections.some((s) => s.type === 'hero');
  const hasCTA = sections.some((s) => s.type === 'cta' || s.type === 'form');
  if (!hasHero) throw new AppError('VALIDATION_ERROR', 400, 'Funnel must have a hero section');
  if (!hasCTA) throw new AppError('VALIDATION_ERROR', 400, 'Funnel must have a CTA or form section');
}

export const funnelService = {
  async list(user: AuthUser, query: FunnelQuery) {
    const where: Prisma.FunnelWhereInput = { tenantId: user.tenantId };
    if (user.role === 'member') where.ownerId = user.id;
    if (query.status) where.status = query.status;
    if (query.search) where.title = { contains: query.search, mode: 'insensitive' };

    const [items, total] = await Promise.all([
      prisma.funnel.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
        include: { template: { select: { id: true, name: true, type: true } } },
      }),
      prisma.funnel.count({ where }),
    ]);

    return { items, meta: paginationMeta(total, query.page, query.limit) };
  },

  async getById(user: AuthUser, funnelId: string) {
    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId, tenantId: user.tenantId },
      include: { template: { select: { id: true, name: true, type: true } } },
    });
    if (!funnel) throw new AppError('NOT_FOUND', 404, 'Funnel not found');
    if (user.role === 'member' && funnel.ownerId !== user.id) {
      throw new AppError('FORBIDDEN', 403, 'Access denied');
    }
    return funnel;
  },

  async getBySlugGlobal(slug: string) {
    const funnel = await prisma.funnel.findUnique({
      where: { slug },
      include: { owner: { select: { id: true, name: true } } },
    });
    if (!funnel || funnel.status !== 'published') {
      throw new AppError('NOT_FOUND', 404, 'Funnel not found or not published');
    }
    return funnel;
  },

  async getBySlug(tenantSlug: string, funnelSlug: string) {
    const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
    if (!tenant) throw new AppError('NOT_FOUND', 404, 'Tenant not found');

    const funnel = await prisma.funnel.findFirst({
      where: { slug: funnelSlug, tenantId: tenant.id, status: 'published' },
    });
    if (!funnel) throw new AppError('NOT_FOUND', 404, 'Funnel not found or not published');

    return funnel;
  },

  async create(user: AuthUser, input: CreateFunnelInput) {
    await quotaService.checkFunnelQuota(user.tenantId);

    let config: Record<string, unknown> = input.config ?? {};

    if (input.template_id) {
      const template = await prisma.funnelTemplate.findFirst({
        where: { id: input.template_id, tenantId: user.tenantId },
      });
      if (!template) throw new AppError('NOT_FOUND', 404, 'Template not found');
      config = template.config as Record<string, unknown>;
    }

    const slug = await generateSlug(input.title);

    return prisma.funnel.create({
      data: {
        tenantId: user.tenantId,
        ownerId: user.id,
        templateId: input.template_id ?? null,
        title: input.title,
        slug,
        config: config as Prisma.InputJsonValue,
        status: 'draft',
      },
      include: { template: { select: { id: true, name: true, type: true } } },
    });
  },

  async update(user: AuthUser, funnelId: string, input: UpdateFunnelInput) {
    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId, tenantId: user.tenantId },
    });
    if (!funnel) throw new AppError('NOT_FOUND', 404, 'Funnel not found');
    if (user.role === 'member' && funnel.ownerId !== user.id) {
      throw new AppError('FORBIDDEN', 403, 'Access denied');
    }

    return prisma.funnel.update({
      where: { id: funnelId },
      data: {
        ...(input.title && { title: input.title }),
        ...(input.config && { config: input.config as Prisma.InputJsonValue }),
        ...(input.status && { status: input.status }),
        updatedAt: new Date(),
      },
      include: { template: { select: { id: true, name: true, type: true } } },
    });
  },

  async publish(user: AuthUser, funnelId: string) {
    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId, tenantId: user.tenantId },
    });
    if (!funnel) throw new AppError('NOT_FOUND', 404, 'Funnel not found');
    if (user.role === 'member' && funnel.ownerId !== user.id) {
      throw new AppError('FORBIDDEN', 403, 'Access denied');
    }

    validatePublishConfig(funnel.config as unknown as FunnelConfig);

    return prisma.funnel.update({
      where: { id: funnelId },
      data: { status: 'published', publishedAt: new Date(), updatedAt: new Date() },
    });
  },

  async unpublish(user: AuthUser, funnelId: string) {
    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId, tenantId: user.tenantId },
    });
    if (!funnel) throw new AppError('NOT_FOUND', 404, 'Funnel not found');
    if (user.role === 'member' && funnel.ownerId !== user.id) {
      throw new AppError('FORBIDDEN', 403, 'Access denied');
    }

    return prisma.funnel.update({
      where: { id: funnelId },
      data: { status: 'draft', updatedAt: new Date() },
    });
  },

  async delete(user: AuthUser, funnelId: string) {
    const funnel = await prisma.funnel.findFirst({
      where: { id: funnelId, tenantId: user.tenantId },
    });
    if (!funnel) throw new AppError('NOT_FOUND', 404, 'Funnel not found');
    if (user.role === 'member' && funnel.ownerId !== user.id) {
      throw new AppError('FORBIDDEN', 403, 'Access denied');
    }

    await prisma.funnel.delete({ where: { id: funnelId } });
    return { deleted: true };
  },

  async trackView(funnelId: string) {
    await prisma.funnel.updateMany({
      where: { id: funnelId },
      data: { views: { increment: 1 } },
    });
  },
};
