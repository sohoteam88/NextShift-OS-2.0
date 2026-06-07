import prisma from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import type { AuthUser } from '@/modules/auth/services/auth-service';

const APPROVAL_ROLES = new Set(['leader', 'operator', 'platform_admin']);

export const approvalService = {
  async getPendingMembers(user: AuthUser) {
    if (!APPROVAL_ROLES.has(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }

    const where =
      user.role === 'leader'
        ? { tenantId: user.tenantId, status: 'pending', sponsorId: user.id }
        : { tenantId: user.tenantId, status: 'pending' };

    const members = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        sponsor: { select: { id: true, name: true } },
        tenant: { select: { id: true, name: true, maxMembers: true } },
      },
    });

    return members;
  },

  async approve(user: AuthUser, memberId: string) {
    if (!APPROVAL_ROLES.has(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }

    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        tenantId: user.tenantId,
        status: 'pending',
        ...(user.role === 'leader' ? { sponsorId: user.id } : {}),
      },
    });

    if (!member) {
      throw new AppError('NOT_FOUND', 404, 'Member not found');
    }

    const tenant = await prisma.tenant.findUnique({
      where: { id: user.tenantId },
      select: { id: true, maxMembers: true, name: true },
    });

    const activeCount = await prisma.user.count({
      where: { tenantId: user.tenantId, status: 'active', deletedAt: null },
    });

    if (activeCount >= (tenant?.maxMembers ?? 10)) {
      throw new AppError('QUOTA_EXCEEDED', 429, 'Member limit reached. Upgrade your plan.');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: memberId },
        data: { status: 'active' },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: user.tenantId,
          actorId: user.id,
          action: 'member.approved',
          targetType: 'user',
          targetId: memberId,
          metadata: {
            member_name: member.name,
            member_email: member.email,
            sponsor_id: member.sponsorId,
            tenant_name: tenant?.name ?? '',
          },
        },
      }),
    ]);
  },

  async reject(user: AuthUser, memberId: string, reason?: string) {
    if (!APPROVAL_ROLES.has(user.role)) {
      throw new AppError('FORBIDDEN', 403, 'Insufficient permissions');
    }

    const member = await prisma.user.findFirst({
      where: {
        id: memberId,
        tenantId: user.tenantId,
        status: 'pending',
        ...(user.role === 'leader' ? { sponsorId: user.id } : {}),
      },
    });

    if (!member) {
      throw new AppError('NOT_FOUND', 404, 'Member not found');
    }

    await prisma.$transaction([
      prisma.user.update({
        where: { id: memberId },
        data: { status: 'suspended' },
      }),
      prisma.auditLog.create({
        data: {
          tenantId: user.tenantId,
          actorId: user.id,
          action: 'member.rejected',
          targetType: 'user',
          targetId: memberId,
          metadata: {
            member_name: member.name,
            member_email: member.email,
            sponsor_id: member.sponsorId,
            reason: reason ?? '',
          },
        },
      }),
    ]);
  },
};
